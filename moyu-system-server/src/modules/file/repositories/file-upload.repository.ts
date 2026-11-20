import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { Prisma } from '@/generated/prisma/client';
import { FileUploadDO, FileUploadStatus } from '../entities/file.entity';

function parseIndexes(value: unknown): number[] {
  if (Array.isArray(value)) {
    return value.map((n) => Number(n)).filter((n) => Number.isInteger(n));
  }
  return [];
}

function parseEtags(
  value: unknown,
): { etag: string; partNumber: number }[] | null {
  if (!Array.isArray(value)) return null;
  return value
    .map((item) => {
      const row = item as { etag?: string; partNumber?: number };
      return {
        etag: String(row.etag || ''),
        partNumber: Number(row.partNumber || 0),
      };
    })
    .filter((p) => p.etag && p.partNumber > 0);
}

function toDO(row: any): FileUploadDO {
  return {
    ...row,
    size: Number(row.size ?? 0),
    uploadedIndexes: parseIndexes(row.uploadedIndexes),
    partEtags: parseEtags(row.partEtags),
  } as FileUploadDO;
}

@Injectable()
export class FileUploadRepository {
  constructor(private prisma: PrismaService) {}

  async selectByUploadId(uploadId: string): Promise<FileUploadDO | null> {
    const row = await this.prisma.sysFileUpload.findUnique({
      where: { uploadId },
    });
    return row ? toDO(row) : null;
  }

  async selectActiveByHash(
    hash: string,
    creator?: string | null,
  ): Promise<FileUploadDO | null> {
    const row = await this.prisma.sysFileUpload.findFirst({
      where: {
        hash,
        status: { in: ['init', 'uploading'] },
        ...(creator ? { creator } : {}),
      },
      orderBy: { id: 'desc' },
    });
    return row ? toDO(row) : null;
  }

  async insert(data: {
    uploadId: string;
    tenantId: string;
    name: string;
    mime: string;
    ext: string;
    size: bigint | number;
    hash: string;
    hashType: string;
    chunkSize: number;
    totalChunks: number;
    uploadedIndexes: number[];
    storageKind: string;
    ossUploadId?: string | null;
    destPath: string;
    partEtags?: { etag: string; partNumber: number }[] | null;
    status: FileUploadStatus;
    expireAt: Date;
    creator?: string | null;
  }): Promise<FileUploadDO> {
    const row = await this.prisma.sysFileUpload.create({
      data: {
        ...data,
        size: BigInt(data.size),
        uploadedIndexes: data.uploadedIndexes,
        partEtags: (data.partEtags ?? undefined),
      },
    });
    return toDO(row);
  }

  async updateByUploadId(
    uploadId: string,
    data: {
      uploadedIndexes?: number[];
      partEtags?: { etag: string; partNumber: number }[] | null;
      status?: FileUploadStatus;
      ossUploadId?: string | null;
      fileId?: number | null;
    },
  ): Promise<void> {
    await this.prisma.sysFileUpload.update({
      where: { uploadId },
      data: {
        ...(data.uploadedIndexes
          ? { uploadedIndexes: data.uploadedIndexes }
          : {}),
        ...(data.partEtags !== undefined
          ? {
              partEtags:
                data.partEtags === null
                  ? Prisma.JsonNull
                  : (data.partEtags as Prisma.InputJsonValue),
            }
          : {}),
        ...(data.status ? { status: data.status } : {}),
        ...(data.ossUploadId !== undefined
          ? { ossUploadId: data.ossUploadId }
          : {}),
        ...(data.fileId !== undefined ? { fileId: data.fileId } : {}),
      },
    });
  }

  async selectExpired(
    now: Date,
    take = 200,
    afterId = 0,
  ): Promise<FileUploadDO[]> {
    const rows = await this.prisma.sysFileUpload.findMany({
      where: {
        expireAt: { lt: now },
        status: { in: ['init', 'uploading', 'merging'] },
        ...(afterId > 0 ? { id: { gt: afterId } } : {}),
      },
      orderBy: { id: 'asc' },
      take,
    });
    return rows.map(toDO);
  }

  async tryBeginMerge(uploadId: string): Promise<boolean> {
    const result = await this.prisma.sysFileUpload.updateMany({
      where: {
        uploadId,
        status: { in: ['init', 'uploading'] },
      },
      data: { status: 'merging' },
    });
    return result.count > 0;
  }
}
