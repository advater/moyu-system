import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { UserPostDO } from '../entities/userPost.entity';

/**
 * 用户岗位管理仓库
 */
@Injectable()
export class UserPostRepository {
  constructor(private prisma: PrismaService) {}
}
