import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Expo, { ExpoPushMessage } from 'expo-server-sdk';
import * as dotenv from 'dotenv';
dotenv.config();

@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);
  private supabase: SupabaseClient;
  private expo: Expo;

  constructor() {
    this.expo = new Expo();
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
    if (!supabaseKey) {
      throw new Error('Supabase key not found. Please set SUPABASE_KEY in your .env file.');
    }
    this.supabase = createClient(
      process.env.SUPABASE_URL || 'https://jrureblhypfdljwflout.supabase.co',
      supabaseKey
    );
  }

  async onModuleInit() {
    // --- Channel 1: per-user in-app notifications → OS push ---
    this.logger.log('Initializing Push Notification Service listener on notifications table...');

    this.supabase
      .channel('push-notifications-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, async (payload) => {
        const newNotification = payload.new;
        if (!newNotification || !newNotification.user_id) return;
        // Advisory rows are pushed as ONE batched Expo send by Channel 2 (an
        // advisory hits every citizen at once — batching is far fewer HTTP
        // calls than one send per row). The rows still exist here for the
        // in-app list; we just don't double-push them.
        if (newNotification.type === 'advisory') return;

        try {
          const { data: user, error } = await this.supabase
            .from('users')
            .select('expo_push_token, notification_preferences')
            .eq('id', newNotification.user_id)
            .single();

          if (error || !user || !user.expo_push_token) return;
          if (user.notification_preferences?.push === false) return;

          const pushToken = user.expo_push_token;
          if (!Expo.isExpoPushToken(pushToken)) {
            this.logger.error(`Push token ${pushToken} is not a valid Expo push token`);
            return;
          }

          const messages: ExpoPushMessage[] = [{
            to: pushToken,
            sound: 'default',
            title: newNotification.title,
            body: newNotification.body,
            data: { notificationId: newNotification.id },
          }];

          await this.sendChunked(messages);
          this.logger.log(`Sent push notification to user ${newNotification.user_id}: ${newNotification.title}`);
        } catch (e) {
          this.logger.error(`Failed to process notification insert: ${e}`);
        }
      })
      .subscribe();

    // --- Channel 2: advisory publishes → in-app rows + ONE batched OS push ---
    // When an LGU publishes an advisory we (a) INSERT a notifications row per
    // active citizen so it appears in each citizen's in-app list and is
    // tappable, and (b) send ONE chunked Expo push to all of their tokens at
    // once (Expo batches up to 100 recipients per HTTP call — far fewer calls
    // than one send per citizen). Channel 1 deliberately SKIPS advisory rows so
    // they aren't double-pushed. Both the row payload and the push data carry
    // { advisory_id } so a tap deep-links to the article (see the citizen app's
    // resolveNotificationTarget / App.tsx push-tap router).
    this.logger.log('Initializing advisory notification listener on news_announcements table...');

    this.supabase
      .channel('advisory-broadcast-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'news_announcements' }, async (payload) => {
        const row = payload.new as any;
        const oldRow = payload.old as any;

        // Only fire when type = advisory and status just became "published".
        // (Requires news_announcements REPLICA IDENTITY FULL so oldRow.status is
        // present on UPDATE — see supabase/schema.sql; otherwise this would
        // re-fire on every edit/view of a published advisory.)
        const isAdvisory = row?.type === 'advisory';
        const justPublished =
          row?.status === 'published' &&
          (payload.eventType === 'INSERT' || (payload.eventType === 'UPDATE' && oldRow?.status !== 'published'));

        if (!isAdvisory || !justPublished) return;

        this.logger.log(`Advisory published: "${row.title}" — notifying citizens of LGU ${row.lgu_id}`);

        try {
          // Active citizens of this LGU, with token + push preference for the
          // batched send.
          const { data: citizens, error } = await this.supabase
            .from('users')
            .select('id, expo_push_token, notification_preferences')
            .eq('role', 'CITIZEN')
            .eq('lgu_id', row.lgu_id)
            .eq('is_active', true);

          if (error || !citizens || citizens.length === 0) {
            this.logger.warn(`No active citizens found for LGU ${row.lgu_id}`);
            return;
          }

          // Strip markdown for the notification body (plain text only)
          const plainBody = (row.content || '')
            .replace(/!\[.*?\]\(.*?\)/g, '')   // images
            .replace(/\[.*?\]\(.*?\)/g, '$1')  // links → text
            .replace(/#{1,6}\s+/g, '')         // headings
            .replace(/[*_`~>]+/g, '')          // bold/italic/code/quote
            .replace(/\n+/g, ' ')              // newlines → spaces
            .trim()
            .slice(0, 180);

          const title = `⚠️ Advisory: ${row.title}`;
          const body = plainBody || 'New advisory from your LGU.';

          // (a) In-app rows for every citizen (Channel 1 skips pushing these).
          const notificationRows = citizens.map((c) => ({
            user_id: c.id,
            lgu_id: row.lgu_id,
            type: 'advisory',
            title,
            body,
            payload: { advisory_id: row.id },
            is_read: false,
          }));
          const { error: insErr } = await this.supabase.from('notifications').insert(notificationRows);
          if (insErr) {
            this.logger.error(`Failed to insert advisory notifications: ${insErr.message}`);
            // don't return — still attempt the push below
          }

          // (b) One batched push to all valid, opted-in tokens.
          const messages: ExpoPushMessage[] = citizens
            .filter((c) => Expo.isExpoPushToken(c.expo_push_token) && c.notification_preferences?.push !== false)
            .map((c) => ({
              to: c.expo_push_token,
              sound: 'default' as const,
              title,
              body,
              data: { type: 'advisory', advisory_id: row.id },
            }));

          if (messages.length === 0) {
            this.logger.warn(`Advisory "${row.title}": no valid opted-in tokens to push.`);
            return;
          }

          await this.sendChunked(messages);
          this.logger.log(`Advisory "${row.title}": ${notificationRows.length} in-app notice(s), batched push to ${messages.length} token(s).`);
        } catch (e) {
          this.logger.error(`Failed to process advisory: ${e}`);
        }
      })
      .subscribe();
  }

  /** Helper: chunk messages and send via Expo Push API */
  private async sendChunked(messages: ExpoPushMessage[]) {
    const chunks = this.expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      try {
        await this.expo.sendPushNotificationsAsync(chunk);
      } catch (err) {
        this.logger.error(`Error sending push notification chunk: ${err}`);
      }
    }
  }
}
