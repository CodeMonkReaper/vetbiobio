import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import * as Sentry from '@sentry/nestjs';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { installBigIntJson } from './common/bigint-json';

async function bootstrap() {
  // Red de seguridad JSON: BigInt (ids Prisma) → string en todas las respuestas.
  installBigIntJson();
  // Observabilidad mínima: solo si hay DSN (dev local queda sin efecto).
  if (process.env.SENTRY_DSN) {
    Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.1 });
  }
  if ((process.env.NODE_ENV ?? '') === 'production') {
    const jwt = process.env.JWT_SECRET ?? '';
    if (jwt.length < 32 || jwt.includes('change')) {
      throw new Error('JWT_SECRET inseguro o ausente en producción');
    }
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL ausente en producción');
  }
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.enableCors({ origin: (process.env.WEB_BASE_URL ?? 'http://localhost:3000').split(','), credentials: true });
  await app.listen(Number(process.env.API_PORT ?? 3001));
}
bootstrap();
