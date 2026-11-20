import { Module } from '@nestjs/common';
import { FileController, FileUploadController } from './file.controller';
import { FileService } from './file.service';
import { FileCleanupService } from './file-cleanup.service';
import { FileRepository } from './repositories/file.repository';
import { FileUploadRepository } from './repositories/file-upload.repository';
import { TenantPolicyModule } from '@/modules/tenant/policy/tenant-policy.module';

@Module({
  imports: [TenantPolicyModule],
  controllers: [FileController, FileUploadController],
  providers: [
    FileService,
    FileCleanupService,
    FileRepository,
    FileUploadRepository,
  ],
  exports: [FileService],
})
export class FileModule {}
