/**
 * 文件元数据实体（sys_file）
 */
export class FileDO {
  id: number;
  tenantId: string;
  name: string;
  path: string;
  url: string;
  type: string | null;
  size: number | bigint;
  hash: string | null;
  storageKind: string | null;
  creator: string | null;
  updater: string | null;
  createTime: Date;
  updateTime: Date;
  deleted: boolean;
  deletedAt: Date | null;
}

export type FileUploadStatus =
  | 'init'
  | 'uploading'
  | 'merging'
  | 'completed'
  | 'aborted'
  | 'expired';

export class FileUploadDO {
  id: number;
  uploadId: string;
  tenantId: string;
  name: string;
  mime: string;
  ext: string;
  size: number | bigint;
  hash: string;
  hashType: string;
  chunkSize: number;
  totalChunks: number;
  uploadedIndexes: number[];
  storageKind: string;
  ossUploadId: string | null;
  destPath: string;
  partEtags: { etag: string; partNumber: number }[] | null;
  fileId: number | null;
  status: FileUploadStatus;
  expireAt: Date;
  creator: string | null;
  updater: string | null;
  createTime: Date;
  updateTime: Date;
  deleted: boolean;
  deletedAt: Date | null;
}
