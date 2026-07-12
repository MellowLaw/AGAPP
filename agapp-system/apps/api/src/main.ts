import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS allowlist: comma-separated origins from ALLOWED_ORIGINS (e.g. the admin
  // dashboard's URL). The mobile client is React Native, not a browser, so it is
  // never subject to CORS and needs no entry here. If ALLOWED_ORIGINS is unset,
  // fall back to permissive (reflect any origin) so nothing breaks today — but
  // warn loudly, since that's not safe to ship to production as-is.
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()).filter(Boolean);
  if (allowedOrigins && allowedOrigins.length > 0) {
    app.enableCors({ origin: allowedOrigins });
  } else {
    console.warn('[AGAPP NestJS API] ALLOWED_ORIGINS is not set — CORS is wide open (all origins allowed). Set ALLOWED_ORIGINS in production.');
    app.enableCors();
  }
  // Enforce DTO validation (@IsString, @MaxLength, @ArrayMaxSize, etc.) on every
  // request. Without this, class-validator decorators are inert. `whitelist`
  // strips unknown properties and `forbidNonWhitelisted` rejects unexpected ones,
  // so clients can't smuggle extra fields past the DTO.
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  const PORT = process.env.PORT || 5000;
  await app.listen(PORT);
  console.log(`[AGAPP NestJS API] Running on port ${PORT}`);
}
bootstrap();
