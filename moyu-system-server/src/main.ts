import { loadEnvFiles } from './config/load-env';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

import {
  RequestMethod,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import path from 'node:path';
import os from 'node:os';
import fastifyCookie from '@fastify/cookie';
import fastifyCompress from '@fastify/compress';
import fastifyHelmet from '@fastify/helmet';
import fastifySession from '@fastify/session';
import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { WsAdapter } from '@nestjs/platform-ws';

import { getAppConfig, getFileConfig } from './config/file.config';
import { configYaml } from './config/yaml';
import { LoggerService } from './plugins/logger/logger.service';
import { assertPasswordStrength } from './utils/password-strength';

async function bootstrap() {
  const appLogger = new LoggerService('', {
    logLevels: ['error', 'warn'],
    timestamp: true,
  });

  const fileConfig = getFileConfig();
  const bodyLimit =
    Math.max(fileConfig.maxFileSize, fileConfig.maxChunkFileSize) + 1024 * 1024;

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: false,
      trustProxy: true,
      bodyLimit,
      connectionTimeout: 0,
      keepAliveTimeout: 120_000,
      requestTimeout: 0,
    }),
    {
      logger: appLogger,
    },
  );

  app.enableShutdownHooks();
  app.enableVersioning({
    type: VersioningType.HEADER,
    header: 'version',
  });

  const appConfig = getAppConfig();
  const apiPrefix = String(appConfig.apiPrefix || '')
    .replace(/^\//, '')
    .replace(/\/$/, '');
  if (apiPrefix) {
    app.setGlobalPrefix(apiPrefix, {
      exclude: [
        { path: '/', method: RequestMethod.GET },
        { path: 'health', method: RequestMethod.ALL },
        { path: 'health/{*path}', method: RequestMethod.ALL },
        { path: 'api-docs', method: RequestMethod.ALL },
        { path: 'api-docs/{*path}', method: RequestMethod.ALL },
        { path: 'api-docs-json', method: RequestMethod.ALL },
        { path: 'static/{*path}', method: RequestMethod.ALL },
      ],
    });
  }

  await app.register(fastifyStatic, {
    root: path.join(__dirname, '..', '..', 'static'),
    prefix: '/static/',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 前端常传空筛选：?userId=&clientId= → 删掉空串，避免可选字段校验失败
  app.getHttpAdapter().getInstance().addHook('preValidation', async (request) => {
    const query = request.query as Record<string, unknown> | undefined;
    if (!query || typeof query !== 'object') return;
    for (const key of Object.keys(query)) {
      if (query[key] === '') delete query[key];
    }
  });

  await app.register(fastifyHelmet, {
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
    crossOriginOpenerPolicy: process.env.NODE_ENV === 'production' ? { policy: 'same-origin-allow-popups' } : false,
    crossOriginResourcePolicy: process.env.NODE_ENV === 'production' ? { policy: 'same-origin' } : false,
  });

  const yamlConfig = configYaml();
  const corsOrigin = (yamlConfig.cors?.origins || '')
    .split(',')
    .map((s: string) => s.trim())
    .filter(Boolean);
  if (process.env.NODE_ENV === 'production' && corsOrigin.length === 0) {
    appLogger.error('生产环境必须配置 cors.origins（config.yaml）');
    process.exit(1);
  }
  const captchaOff =
    process.env.AUTH_CAPTCHA_ENABLED === 'false' ||
    process.env.AUTH_CAPTCHA_ENABLED === '0';
  if (process.env.NODE_ENV === 'production' && captchaOff) {
    appLogger.error('生产环境禁止关闭图形验证码（AUTH_CAPTCHA_ENABLED=false）');
    process.exit(1);
  }
  const importPwd = process.env.USER_IMPORT_DEFAULT_PASSWORD?.trim();
  if (importPwd) {
    try {
      assertPasswordStrength(importPwd, 'USER_IMPORT_DEFAULT_PASSWORD', 12);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (process.env.NODE_ENV === 'production') {
        appLogger.error(msg);
        process.exit(1);
      }
      appLogger.warn(`${msg}（开发环境仅告警）`);
    }
  }
  const isProd = process.env.NODE_ENV === 'production';
  app.enableCors({
    // 开发：反射任意 Origin，避免本机/局域网前端被误判为 CORS
    // 生产：仅允许 config.yaml cors.origins 白名单
    origin: (origin, callback) => {
      if (!origin || !isProd) {
        callback(null, true);
        return;
      }
      if (corsOrigin.includes(origin)) {
        callback(null, true);
        return;
      }
      // 切勿 callback(Error)：会导致 OPTIONS 500 且无 ACAO，浏览器一律显示 CORS
      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    // 不写死 allowedHeaders，由 CORS 中间件回显预检请求头（兼容前端自定义头）
    exposedHeaders: [
      'Authorization',
      'Set-Cookie',
      'Accept-Ranges',
      'Content-Range',
      'Content-Length',
    ],
    maxAge: 3600,
  });

  await app.register(fastifyCookie);

  const sessionSecret = process.env.SESSION_SECRET || 'dev-insecure-secret-change-in-prod';
  const assertSecretStrength = (name: string, value: string | undefined) => {
    if (!value) return;
    if (value.length < 32) {
      const msg = `${name} 长度应 ≥ 32 字符`;
      if (process.env.NODE_ENV === 'production') {
        appLogger.error(msg);
        process.exit(1);
      }
      appLogger.warn(`${msg}（当前开发环境仅告警）`);
    }
  };
  if (!process.env.SESSION_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      appLogger.error('生产环境必须设置 SESSION_SECRET 环境变量');
      process.exit(1);
    }
    appLogger.warn('未设置 SESSION_SECRET，使用开发模式默认密钥，请勿在生产环境使用');
  }
  if (!process.env.JWT_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      appLogger.error('生产环境必须设置 JWT_SECRET 环境变量');
      process.exit(1);
    }
  }
  assertSecretStrength('SESSION_SECRET', process.env.SESSION_SECRET || sessionSecret);
  assertSecretStrength('JWT_SECRET', process.env.JWT_SECRET);

  await app.register(fastifySession, {
    secret: sessionSecret,
    cookieName: 'nestjs-sid',
    cookie: {
      maxAge: 1000 * 60 * 10,
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
    },
    rolling: true,
    saveUninitialized: false,
  });

  await app.register(fastifyMultipart, {
    throwFileSizeLimit: false,
    limits: {
      fileSize: bodyLimit,
      fieldSize: 1024 * 1024,
      files: 1,
      fields: 32,
    },
  });
  await app.register(fastifyCompress);

  app.useWebSocketAdapter(new WsAdapter(app));

  const swaggerEnabled =
    process.env.SWAGGER_ENABLED === 'true' ||
    process.env.SWAGGER_ENABLED === '1' ||
    (process.env.NODE_ENV !== 'production' &&
      process.env.SWAGGER_ENABLED !== 'false' &&
      process.env.SWAGGER_ENABLED !== '0');
  if (swaggerEnabled && process.env.NODE_ENV === 'production') {
    appLogger.error('生产环境禁止开启 Swagger（SWAGGER_ENABLED）');
    process.exit(1);
  }
  if (swaggerEnabled) {
    const swaggerOptions = new DocumentBuilder()
      .setTitle('moyu系统 API 文档')
      .setDescription('moyu-system-server 系统基础模块 API')
      .setVersion('1.0')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerOptions);
    SwaggerModule.setup('/api-docs', app, document);
  }

  const PORT = appConfig?.port ?? 3000;
  const HOST = process.env.HOST?.trim() || '0.0.0.0';
  await app.listen(PORT, HOST);

  const networkInterfaces = os.networkInterfaces();
  const networks = Object.values(networkInterfaces).flat();
  const ip = networks.find((ni) => ni?.family === 'IPv4')?.address;
  console.log(`Server is running at http://localhost:${PORT}`);
  if (apiPrefix) {
    console.log(`API prefix: /${apiPrefix}  e.g. /${apiPrefix}/auth/login`);
  }
  if (HOST === '0.0.0.0') {
    console.log(`Server is listening on 0.0.0.0:${PORT} (set HOST=127.0.0.1 to bind loopback)`);
  }
  console.log(`Server is running at http://${ip}:${PORT}`);
  if (swaggerEnabled) {
    console.log(`Api-docs is running at http://${ip}:${PORT}/api-docs`);
  }
}
bootstrap().catch((error) => {
  new LoggerService('Bootstrap').error('Bootstrap error', String(error));
});