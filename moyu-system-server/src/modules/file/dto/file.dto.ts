import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { FileCreateReqDTO } from './FileCreateReq.dto';
import { FilePageReqDTO } from './FilePageReq.dto';
import { FileResDTO } from './FileRes.dto';
import { FileUploadResDTO } from './FileUploadRes.dto';

export { FileCreateReqDTO, FilePageReqDTO, FileResDTO, FileUploadResDTO };

export class FileUploadInitReqDTO {
  @ApiProperty()
  @IsString()
  @MaxLength(256)
  name: string;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  size: number;

  @ApiProperty()
  @IsString()
  @MaxLength(64)
  hash: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  mime?: string;

  @ApiProperty({ required: false, enum: ['chunk_medium', 'chunk_large'] })
  @IsOptional()
  @IsString()
  hashType?: string;

  @ApiProperty({
    required: false,
    type: [String],
    description: '未传或空数组表示允许所有类型',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value == null || value === '') return undefined;
    if (Array.isArray(value)) {
      const list = value.map((s) => String(s).trim()).filter(Boolean);
      return list.length ? list : undefined;
    }
    if (typeof value === 'string') {
      const t = value.trim();
      if (!t) return undefined;
      if (t.startsWith('[')) {
        try {
          const parsed = JSON.parse(t);
          return Array.isArray(parsed)
            ? parsed.map((s) => String(s).trim()).filter(Boolean)
            : undefined;
        } catch {
          return t.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
        }
      }
      const list = t.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
      return list.length ? list : undefined;
    }
    return undefined;
  })
  @IsArray()
  @IsString({ each: true })
  allowedTypes?: string[];
}

export class FileUploadInitResDTO {
  @ApiProperty({ required: false })
  fileId?: number;

  @ApiProperty({ required: false })
  url?: string;

  @ApiProperty({ required: false })
  name?: string;

  @ApiProperty({ required: false })
  type?: string;

  @ApiProperty({ required: false })
  size?: number;

  @ApiProperty({ required: false })
  uploadId?: string;

  @ApiProperty()
  chunkSize: number;

  @ApiProperty()
  totalChunks: number;

  @ApiProperty({ type: [Number] })
  uploadedIndexes: number[];

  @ApiProperty({ required: false, type: [Number] })
  missingIndexes?: number[];

  @ApiProperty({ required: false, type: [String] })
  partUrls?: string[];

  @ApiProperty()
  hashType: string;

  @ApiProperty({ required: false })
  readyToMerge?: boolean;
}

export class FileUploadMergeReqDTO {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  uploadId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  fileHash?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  hashType?: string;

  @ApiProperty({ required: false, type: 'array' })
  @IsOptional()
  parts?: { etag: string; partNumber: number }[];
}

export class FileUploadStatusReqDTO {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  uploadId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  hash?: string;
}

export class FileUploadStatusResDTO {
  @ApiProperty()
  uploadId: string;

  @ApiProperty({ type: [Number] })
  uploadedIndexes: number[];

  @ApiProperty({ type: [Number] })
  missingIndexes: number[];

  @ApiProperty()
  totalChunks: number;

  @ApiProperty()
  chunkSize: number;

  @ApiProperty()
  readyToMerge: boolean;
}

export class FileUploadCompleteResDTO extends FileUploadResDTO {
  @ApiProperty({ required: false })
  incomplete?: boolean;

  @ApiProperty({ required: false })
  uploadId?: string;

  @ApiProperty({ required: false, type: [Number] })
  missingIndexes?: number[];

  @ApiProperty({ required: false, type: [Number] })
  uploadedIndexes?: number[];

  @ApiProperty({ required: false })
  totalChunks?: number;
}

export class FileUploadBase64ReqDTO {
  @ApiProperty({ description: 'data URL，如 data:image/png;base64,...' })
  @IsString()
  base64: string;

  @ApiProperty()
  @IsString()
  @MaxLength(256)
  fileName: string;
}

export class FileUploadAbortReqDTO {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  uploadId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  fileHash?: string;
}
