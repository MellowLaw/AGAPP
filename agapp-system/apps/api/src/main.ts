import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
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
