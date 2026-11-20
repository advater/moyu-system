import { IsArray, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 用户导入
 */
export class UserImportResDTO {
  @ApiProperty({ description: '创建成功的用户名数组', required: true })
  @IsArray()
  createUsernames: string[];

  @ApiProperty({ description: '更新成功的用户名数组', required: true })
  @IsArray()
  updateUsernames: string[];

  @ApiProperty({ description: '导入失败的用户集合，key 为用户名，value 为失败原因', required: true })
  @IsObject()
  failureUsernames: Record<string, string>;

}
