import { RequestMethod } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { getAppConfig } from '@/config/file.config';
import { HttpContractModule } from './http-contract.module';

export async function createHttpContractApp(): Promise<NestFastifyApplication> {
  const app = await NestFactory.create<NestFastifyApplication>(
    HttpContractModule,
    new FastifyAdapter(),
    { logger: false },
  );

  const apiPrefix = String(getAppConfig().apiPrefix || '')
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

  await app.init();
  await app.getHttpAdapter().getInstance().ready();
  return app;
}
