import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  const PORT = process.env.PORT || 5000;
  await app.listen(PORT);
  console.log(`[AGAPP NestJS API] Running on port ${PORT}`);
}
bootstrap();
