import { Module } from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import { PushService } from './push/push.service';
import { ReportController, ChatbotController } from './app.controllers';

@Module({
  imports: [],
  controllers: [
    ReportController,
    ChatbotController
  ],
  providers: [SupabaseService, PushService],
})
export class AppModule {}
