import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FileService } from './file.service';

@Injectable()
export class FileCleanupService {
  private readonly logger = new Logger(FileCleanupService.name);

  constructor(private readonly fileService: FileService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async sweepExpiredUploads() {
    try {
      const count = await this.fileService.cleanupExpiredSessions();
      if (count > 0) {
        this.logger.log(`cleaned ${count} expired file upload session(s)`);
      }
    } catch (err) {
      this.logger.warn(`sweep expired uploads failed: ${err}`);
    }
  }
}
