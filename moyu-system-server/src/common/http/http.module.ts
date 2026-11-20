import { Global, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

/**
 * 全局 HTTP 客户端模块
 *
 * 基于 @nestjs/axios 提供 HTTP 请求能力，
 * 配置超时时间、最大重定向次数和响应类型。
 * 所有模块均可注入 HttpService 使用。
 */
@Global()
@Module({
  imports: [
    HttpModule.register({
      timeout: 30000, // 请求超时 30 秒
      maxRedirects: 5, // 最大重定向 5 次
      responseType: 'json', // 自动推断响应类型
    }),
  ],
  exports: [HttpModule], // 全局导出，其他模块可直接使用
})
export class AppHttpModule {}