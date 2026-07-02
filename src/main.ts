import { NestFactory } from '@nestjs/core';
import { Logger as NestLogger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

/** Normalize an origin string to its scheme+host+port, or null if it isn't a valid URL. */
function toOrigin(value: string | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

/**
 * Fail fast on a misconfigured production boot. The dev-token path must never be reachable
 * on a live deployment — a stray AUTH_MODE would silently accept locally-signed JWTs.
 */
function assertConfig() {
  const isProd = process.env.NODE_ENV === 'production';
  const authMode = process.env.AUTH_MODE || 'cognito';
  if (isProd && authMode !== 'cognito') {
    throw new Error(
      `Refusing to start: AUTH_MODE=${authMode} in production. Dev tokens must never be accepted on a live deployment.`,
    );
  }
  if (authMode === 'cognito' && (!process.env.COGNITO_USER_POOL_ID || !process.env.COGNITO_CLIENT_ID)) {
    throw new Error(
      'AUTH_MODE=cognito requires COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID to be set.',
    );
  }
  if (!isProd && authMode !== 'cognito') {
    new NestLogger('Bootstrap').warn(
      `AUTH_MODE=${authMode}: accepting locally-signed dev tokens. This is for local development only.`,
    );
  }
}

async function bootstrap() {
  assertConfig();

  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  app.use(helmet());

  // Exact-origin allowlist. A prefix match (startsWith) would let `bank.evil.com` through
  // when the allowed origin is `bank.com`; compare the parsed origin instead.
  const allowedOrigins = [process.env.FRONTEND_URL, 'http://localhost:5173']
    .map(toOrigin)
    .filter((o): o is string => o !== null);
  app.enableCors({
    origin: (origin, callback) => {
      const parsed = toOrigin(origin);
      if (!origin || (parsed && allowedOrigins.includes(parsed))) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked: ${origin}`), false);
      }
    },
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());
  app.setGlobalPrefix('api/v1');

  // Expose the API schema only outside production so it isn't public on the live box.
  if (process.env.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Help Desk Hero API')
      .setDescription('IT ticketing system API (NestJS + Postgres/Drizzle, AWS Cognito auth)')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swaggerConfig));
  }

  const port = process.env.API_PORT || 3001;
  await app.listen(port);
}
bootstrap();
