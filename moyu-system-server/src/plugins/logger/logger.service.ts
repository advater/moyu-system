import { ConsoleLogger, Injectable, OnModuleInit, Optional } from '@nestjs/common';
import type { ConsoleLoggerOptions } from '@nestjs/common';
import * as log4js from 'log4js';
import { configYaml } from '@/config/yaml';

@Injectable()
export class LoggerService extends ConsoleLogger implements OnModuleInit {
  private requestLogger!: log4js.Logger;
  private errorLogger!: log4js.Logger;
  private consoleLogger!: log4js.Logger;
  private initialized = false;

  constructor(
    @Optional() contextOrOptions?: string | ConsoleLoggerOptions,
    @Optional() options?: ConsoleLoggerOptions,
  ) {
    super(contextOrOptions as string, options as ConsoleLoggerOptions);
  }

  onModuleInit() {
    this.initLog4js();
  }

  private initLog4js() {
    if (this.initialized) return;
    this.initialized = true;

    const yamlConfig = configYaml();
    const logLevel = yamlConfig.log?.level || 'info';
    const errorFile = yamlConfig.log?.errorFile || 'logs/errors.log';
    const requestFile = yamlConfig.log?.requestFile || 'logs/requests.log';

    log4js.configure({
      appenders: {
        console: { type: 'console' },
        requestFile: {
          type: 'dateFile',
          filename: requestFile,
          async: true,
          pattern: 'yyyy-MM-dd',
          keepFileExt: true,
          layout: { type: 'basic' },
        },
        errorFile: {
          type: 'dateFile',
          filename: errorFile,
          async: true,
          pattern: 'yyyy-MM-dd',
          keepFileExt: true,
          layout: { type: 'basic' },
        },
      },
      categories: {
        default: { appenders: ['console'], level: 'off' },
        request: { appenders: ['requestFile'], level: logLevel },
        error: { appenders: ['errorFile'], level: 'error' },
        console: { appenders: ['console'], level: logLevel },
      },
    });

    this.requestLogger = log4js.getLogger('request');
    this.errorLogger = log4js.getLogger('error');
    this.consoleLogger = log4js.getLogger('console');
  }

  log(message: any) {
    super.log(`[EXTENDED] ${message}`);
  }

  info(message: any) {
    if (!this.initialized) this.initLog4js();
    this.requestLogger?.info(message);
  }

  warn(message: any) {
    if (!this.initialized) this.initLog4js();
    this.consoleLogger?.warn(message);
    super.warn(this.stringifyLog(message));
  }

  error(message: any, stack?: string) {
    if (!this.initialized) this.initLog4js();
    const text = this.stringifyLog(message);
    if (stack) {
      this.errorLogger?.error(`${text}\n${stack}`);
      super.error(text, stack);
    } else {
      this.errorLogger?.error(text);
      super.error(text);
    }
  }

  /** 避免覆盖 ConsoleLogger.formatMessage（基类为非 private） */
  private stringifyLog(message: any): string {
    if (typeof message === 'string') return message;
    try {
      return JSON.stringify(message);
    } catch {
      return String(message);
    }
  }
}