import { request, systemUrl } from "@/utils/request";
import type { PageParam } from "@/utils/request";
import type { FileVO } from "./types";
import { downloadBlob, downloadResumable, downloadStream, clearDownloadResume, formatBytes } from "@/utils/file/down";
import { resolveFileApiBase } from "@/config/env";
export type { FileVO };

export const getFilePage = (params: PageParam) => {
  return request.get<{ list: FileVO[]; total: number }>({ url: "/file/page", params });
};

export const getFile = (id: number) => {
  return request.get<FileVO>({ url: "/file/get", params: { id } });
};

export const deleteFile = (id: number) => {
  return request.delete({ url: "/file/delete", params: { id } });
};

export const deleteFileList = (ids: number[]) => {
  return request.delete({ url: "/file/delete-list", params: { ids: ids.join(",") } });
};

export const updateFile = (data: FormData) => {
  return request.upload({ url: "/file/upload", data });
};

export const uploadFile = (file: File) => {
  const data = new FormData();
  data.append("file", file);
  return updateFile(data);
};

export const previewFileUrl = (id: number) => `${systemUrl("/file/preview")}?id=${id}`;
export const downloadFileUrl = (id: number) =>
  `${resolveFileApiBase()}/file/download?id=${id}`;
export const previewMediaUrl = (id: number, ticket: string) =>
  `${resolveFileApiBase()}/file/preview-media?id=${id}&ticket=${encodeURIComponent(ticket)}`;

export function getPreviewTicket(id: number) {
  return request.get<{ ticket: string; expiresIn: number; fileId: number }>({
    url: "/file/preview-ticket",
    params: { id },
  });
}

export async function fetchFileBytes(
  id: number,
  kind: "preview" | "download" = "download",
  onProgress?: (percent: number) => void,
) {
  const url = kind === "preview" ? previewFileUrl(id) : downloadFileUrl(id);
  return downloadStream(url, {
    onProgress: onProgress || (() => undefined),
    onSuccess: () => undefined,
  });
}

export async function downloadFile(
  row: FileVO,
  onProgress?: (percent: number, received: number, total: number) => void,
  signal?: AbortSignal,
) {
  const blob = await downloadResumable({
    url: downloadFileUrl(row.id),
    fileId: row.id,
    fileName: row.name,
    mime: row.type,
    expectedSize: row.size,
    onProgress,
    signal,
  });
  if (blob) downloadBlob(row.name, blob);
}

export { clearDownloadResume, formatBytes };
