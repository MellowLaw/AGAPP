import { Module } from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import { PushService } from './push/push.service';
import { 
  AuthController, LguController, ReportController, 
  ServiceController, ForumController, ChatbotController, AuditController 
} from './app.controllers';

@Module({
  imports: [],
  controllers: [
    AuthController,
    LguController,
    ReportController,
    ServiceController,
    ForumController,
    ChatbotController,
    AuditController
  ],
  providers: [SupabaseService, PushService],
})
export class AppModule {}
