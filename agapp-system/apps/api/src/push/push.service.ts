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

    // --- Channel 2: advisory publishes → broadcast OS push to ALL LGU citizens ---
    this.logger.log('Initializing advisory broadcast push listener on news_announcements table...');

    this.supabase
      .channel('advisory-broadcast-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'news_announcements' }, async (payload) => {
        const row = payload.new as any;
        const oldRow = payload.old as any;

        // Only fire when type = advisory and status just became "published"
        const isAdvisory = row?.type === 'advisory';
        const justPublished =
          row?.status === 'published' &&
          (payload.eventType === 'INSERT' || (payload.eventType === 'UPDATE' && oldRow?.status !== 'published'));

        if (!isAdvisory || !justPublished) return;

        this.logger.log(`Advisory published: "${row.title}" — broadcasting push to all citizens of LGU ${row.lgu_id}`);

        try {
          // Fetch all active citizens with a push token for this LGU
          const { data: citizens, error } = await this.supabase
            .from('users')
            .select('expo_push_token, notification_preferences')
            .eq('role', 'CITIZEN')
            .eq('lgu_id', row.lgu_id)
            .eq('is_active', true)
            .not('expo_push_token', 'is', null);

          if (error || !citizens || citizens.length === 0) {
            this.logger.warn(`No citizens with push tokens found for LGU ${row.lgu_id}`);
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

          const messages: ExpoPushMessage[] = citizens
            .filter(c => {
              if (!Expo.isExpoPushToken(c.expo_push_token)) return false;
              if (c.notification_preferences?.push === false) return false;
              return true;
            })
            .map(c => ({
              to: c.expo_push_token,
              sound: 'default' as const,
              title: `⚠️ Advisory: ${row.title}`,
              body: plainBody || 'New advisory from your LGU.',
              data: { type: 'advisory', advisory_id: row.id },
            }));

          if (messages.length === 0) {
            this.logger.warn('No valid tokens to broadcast advisory push to.');
            return;
          }

          await this.sendChunked(messages);
          this.logger.log(`Advisory push broadcast sent to ${messages.length} citizens.`);
        } catch (e) {
          this.logger.error(`Failed to broadcast advisory push: ${e}`);
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
