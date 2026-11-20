import { Module } from '@nestjs/common';
import { JobController } from './job.controller';
import { JobCoreModule } from './job-core.module';

@Module({
  imports: [JobCoreModule],
  controllers: [JobController],
})
export class JobModule {}
