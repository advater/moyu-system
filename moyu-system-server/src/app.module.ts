import { Module } from '@nestjs/common';

import type { NestModule, MiddlewareConsumer } from '@nestjs/common';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { TenantAsyncMiddleware } from './common/middleware/tenant.middleware';
import { LoggerService } from './plugins/logger/logger.service';
import { APP_GUARD } from '@nestjs/core';
import { JwtGuard } from './common/guard/jwt-auth.guard';
import { RoleGuard } from './common/guard/role-auth.guard';
import { PermissionGuard } from './common/guard/permission.guard';
import { TenantGuard } from './common/guard/tenant.guard';
import { CustomThrottlerGuard } from './common/guard/throttler.guard';
import { APP_FILTER } from '@nestjs/core';
import { CatchExceptionFilter } from './common/filters/catch-exception.filter';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ResponseInterceptor } from './common/interceptor/response.interceptor';
import { ConfigModule } from '@nestjs/config';
import { configYaml } from './config/yaml';
import { RouterModule } from '@nestjs/core';
import { AppRoutes } from './app.routes';
import { DatabaseModule } from './database/database.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { RedisThrottlerStorage } from './common/guard/redis-throttler.storage';
import type { RedisClientType } from 'redis';

import { FeatureModules } from './modules/index';
import { HealthModule } from './health/health.module';
import { RedisModule } from './plugins/redis/redis.module';

import { AppHttpModule } from './common/http/http.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { getBullRedisConnection } from './config/bull.config';
import { I18nModule, I18nMiddleware } from './i18n';
import { RequestMetricsModule } from './common/metrics/request-metrics.module';

const AppModules = [
  HealthModule,
  AppHttpModule,
];

const AppGuards = [
  {
    provide: APP_GUARD,
    useClass: CustomThrottlerGuard,
  },
  {
    provide: APP_GUARD,
    useClass: JwtGuard,
  },
  {
    provide: APP_GUARD,
    useClass: TenantGuard,
  },
  {
    provide: APP_GUARD,
    useClass: RoleGuard,
  },
  {
    provide: APP_GUARD,
    useClass: PermissionGuard,
  },
];

const AppInterceptors = [
  {
    provide: APP_INTERCEPTOR,
    useClass: ResponseInterceptor,
  },
];

const AppFilters = [
  {
    provide: APP_FILTER,
    useClass: CatchExceptionFilter,
  },
];

@Module({
  imports: [
    I18nModule,
    RequestMetricsModule,
    RedisModule.forRoot(),
    ConfigModule.forRoot({
      cache: true,
      envFilePath: [
        `.env.${process.env.NODE_ENV || 'development'}.local`,
        `.env.${process.env.NODE_ENV || 'development'}`,
        '.env.local',
        '.env',
      ],
      load: [configYaml],
      isGlobal: true,
    }),
    RouterModule.register(AppRoutes),
    DatabaseModule,
    // 注意：forRoot 里登记的每个 name 会对「所有路由」生效。
    // 登录等敏感接口用 @Throttle({ default: { limit, ttl } }) 单独收紧，不要再挂一个全局 login=5。
    ThrottlerModule.forRootAsync({
      inject: ['REDIS_CLIENT'],
      useFactory: (redis: RedisClientType) => ({
        throttlers: [
          {
            name: 'default',
            ttl: 60_000,
            limit: Number(process.env.THROTTLE_LIMIT || 200),
          },
        ],
        storage: new RedisThrottlerStorage(redis),
      }),
    }),
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      connection: getBullRedisConnection(),
    }),
    ...FeatureModules,
    ...AppModules,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    LoggerService,
    ...AppGuards,
    ...AppInterceptors,
    ...AppFilters,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // I18n → 租户 ALS → 日志；语言上下文需包住整条请求链
    consumer
      .apply(I18nMiddleware, TenantAsyncMiddleware, LoggerMiddleware)
      .forRoutes('*');
  }
}
