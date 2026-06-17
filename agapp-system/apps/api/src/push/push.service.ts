import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Expo from 'expo-server-sdk';
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
    this.logger.log('Initializing Push Notification Service listener on notifications table...');
    
    this.supabase
      .channel('push-notifications-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, async (payload) => {
        const newNotification = payload.new;
        if (!newNotification || !newNotification.user_id) return;
        
        try {
          // Fetch the user's expo push token
          const { data: user, error } = await this.supabase
            .from('users')
            .select('expo_push_token')
            .eq('id', newNotification.user_id)
            .single();

          if (error || !user || !user.expo_push_token) {
             return; // User has no push token
          }

          const pushToken = user.expo_push_token;

          if (!Expo.isExpoPushToken(pushToken)) {
            this.logger.error(`Push token ${pushToken} is not a valid Expo push token`);
            return;
          }

          // Construct message
          const messages = [{
            to: pushToken,
            sound: 'default' as const,
            title: newNotification.title,
            body: newNotification.body,
            data: { notificationId: newNotification.id },
          }];

          const chunks = this.expo.chunkPushNotifications(messages);
          for (let chunk of chunks) {
            try {
              let ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
              this.logger.log(`Sent push notification to user ${newNotification.user_id}: ${newNotification.title}`);
            } catch (error) {
              this.logger.error(`Error sending push notification chunk: ${error}`);
            }
          }
        } catch (e) {
          this.logger.error(`Failed to process notification insert: ${e}`);
        }
      })
      .subscribe();
  }
}
