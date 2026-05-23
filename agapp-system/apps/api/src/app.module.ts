import { Module } from '@nestjs/common';
import { SupabaseService } from './supabase.service';
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
  providers: [SupabaseService],
})
export class AppModule {}
