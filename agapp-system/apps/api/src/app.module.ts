import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { SupabaseService } from './supabase.service';
import { PushService } from './push/push.service';
import { ReportController, ChatbotController, VerificationController } from './app.controllers';

@Module({
  imports: [
    // Global rate-limit default: 30 requests / 60s per IP (both API routes call
    // paid third-party services — Mistral + Roboflow — so every request costs
    // money; tighter per-route limits are set via @Throttle on each controller).
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 30 }]),
  ],
  controllers: [
    ReportController,
    ChatbotController,
    VerificationController
  ],
  providers: [
    SupabaseService,
    PushService,
    // Applies the default (and any @Throttle override) to every route globally.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
