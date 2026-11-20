import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule.forRoot()],
  exports: [PrismaModule],
})
export class DatabaseModule {}