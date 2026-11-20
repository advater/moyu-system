import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { CommonError, ValidationError } from '@/config/error-messages';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 部门创建参数
 */
export class DeptSaveReqDTO {
  @ApiProperty({
    description: '部门编号',
    required: true,
    example: 1024,
  })
  @IsNotEmpty({ message: ValidationError.DEPT_ID_REQUIRED })
  @IsNumber()
  id: number;

  @ApiProperty({
    description: '部门名称',
    required: true,
    example: 'moyu',
  })
  @IsNotEmpty({ message: ValidationError.DEPT_NAME_REQUIRED })
  @IsString()
  @MaxLength(30, { message: ValidationError.DEPT_NAME_MAX })
  name: string;

  @ApiProperty({
    description: '父部门 ID',
    required: false,
    example: 0,
  })
  @IsNotEmpty({ message: ValidationError.DEPT_PARENT_REQUIRED })
  @IsNumber()
  parentId: number;

  @ApiProperty({
    description: '显示顺序',
    required: false,
    default: 1,
    example: 1024,
  })
  @IsNotEmpty({ message: ValidationError.SORT_REQUIRED })
  @IsNumber()
  sort?: number;

  @ApiProperty({
    description: '负责人的用户编号',
    required: false,
    example: 2048,
  })
  @IsOptional()
  @IsNumber()
  leaderUserId?: number;

  @ApiProperty({
    description: '联系电话',
    required: false,
    example: '18055556666',
  })
  @IsOptional()
  @IsString()
  @MaxLength(11, { message: ValidationError.PHONE_MAX })
  phone?: string;

  @ApiProperty({
    description: '邮箱',
    required: false,
    example: 'moyu@qq.com',
  })
  @IsOptional()
  @IsEmail({}, { message: CommonError.EMAIL_INVALID })
  @MaxLength(50, { message: ValidationError.EMAIL_MAX })
  email?: string;

  @ApiProperty({
    description: '状态',
    required: false,
    example: 1,
  })
  @IsNotEmpty({ message: ValidationError.STATUS_REQUIRED })
  @IsNumber()
  status: number;
}
