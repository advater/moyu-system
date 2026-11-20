import { useRef, useState } from "react";
import { Modal, message } from "antd";
import { useCrudList } from "@/hooks/useCrudList";
import * as FileApi from "@/api/system/file";
import type { FileVO } from "@/api/system/file";
import { uploadBySize, type TransferPhase } from "@/utils/file/upload";
import { isAbortError } from "@/utils/file/chunk";
import { formatBytes, clearDownloadResume } from "@/utils/file/down";
import type { TransferTask } from "./FileTransferPanel";

export function useFilePage() {
  const crud = useCrudList<FileVO>(FileApi.getFilePage);
  const [modal, modalHolder] = Modal.useModal();
  const [messageApi, messageHolder] = message.useMessage();
  const uploadAbort = useRef<AbortController | null>(null);
  const downloadAbort = useRef<AbortController | null>(null);
  const pendingFile = useRef<File | null>(null);
  const pendingDownload = useRef<FileVO | null>(null);
  const [previewRow, setPreviewRow] = useState<FileVO | null>(null);
  const [transfer, setTransfer] = useState<TransferTask | null>(null);

  const runUpload = async (file: File) => {
    pendingFile.current = file;
    uploadAbort.current = new AbortController();
    setTransfer({
      kind: "upload",
      name: file.name,
      percent: 0,
      phase: "hashing",
      hint: "主线程切片，Worker 计算 hash",
    });
    try {
      await uploadBySize(
        file,
        (percent, status, phase) => {
          const nextPhase: TransferPhase =
            phase || (status === "success" ? "success" : status === "error" ? "error" : "uploading");
          const hint =
            nextPhase === "hashing"
              ? "主线程切片，Worker 计算 hash"
              : nextPhase === "uploading"
                ? "按序批量并发上传，可断点续传"
                : nextPhase === "merging"
                  ? "服务端校验完整性，缺片将自动补传"
                  : undefined;
          setTransfer({
            kind: "upload",
            name: file.name,
            percent,
            phase: nextPhase,
            hint,
          });
        },
        uploadAbort.current.signal,
      );
      messageApi.success("上传成功");
      pendingFile.current = null;
      setTransfer(null);
      crud.getList();
    } catch (err: any) {
      if (isAbortError(err) || err?.code === "ERR_CANCELED") {
        setTransfer((cur) => (cur ? { ...cur, phase: "paused", hint: "已暂停，可继续上传未完成分片" } : cur));
        return;
      }
      messageApi.error(err?.message || "上传失败");
      setTransfer((cur) => (cur ? { ...cur, phase: "error", hint: err?.message } : cur));
    }
  };

  const handleUpload = async (file: File) => {
    if (transfer && transfer.phase !== "error" && transfer.phase !== "paused" && transfer.phase !== "success") {
      messageApi.warning("请等待当前传输结束");
      return;
    }
    await runUpload(file);
  };

  const handlePause = () => {
    if (transfer?.kind === "download") {
      downloadAbort.current?.abort();
      return;
    }
    uploadAbort.current?.abort();
  };

  const handleAbortUpload = handlePause;

  const handleResume = () => {
    if (transfer?.kind === "upload" && pendingFile.current) {
      void runUpload(pendingFile.current);
      return;
    }
    if (transfer?.kind === "download" && pendingDownload.current) {
      void runDownload(pendingDownload.current);
    }
  };

  const handleCancelTransfer = () => {
    uploadAbort.current?.abort();
    downloadAbort.current?.abort("discard");
    const dl = pendingDownload.current;
    if (dl?.id) void clearDownloadResume(dl.id);
    pendingFile.current = null;
    pendingDownload.current = null;
    setTransfer(null);
  };

  const runDownload = async (row: FileVO) => {
    pendingDownload.current = row;
    downloadAbort.current = new AbortController();
    setTransfer({
      kind: "download",
      name: row.name,
      percent: 0,
      phase: "downloading",
      hint: "Range 断点续传，暂停后从已收字节继续",
    });
    try {
      await FileApi.downloadFile(
        row,
        (percent, received, total) => {
          setTransfer({
            kind: "download",
            name: row.name,
            percent: Math.round(percent),
            phase: "downloading",
            hint:
              total > 0
                ? `${formatBytes(received)} / ${formatBytes(total)}`
                : `${formatBytes(received)} 已接收`,
          });
        },
        downloadAbort.current.signal,
      );
      messageApi.success("下载完成");
      pendingDownload.current = null;
      setTransfer(null);
    } catch (err: any) {
      if (err?.name === "AbortError") {
        setTransfer((cur) => (cur ? { ...cur, phase: "paused", hint: "已暂停，继续将按 Range 从断点拉取" } : cur));
        return;
      }
      messageApi.error(err?.message || "下载失败");
      setTransfer((cur) => (cur ? { ...cur, phase: "error", hint: err?.message } : cur));
    }
  };

  const handleDelete = (id: number) => {
    modal.confirm({
      title: "提示",
      content: "确认删除该文件？",
      onOk: async () => {
        await FileApi.deleteFile(id);
        messageApi.success("删除成功");
        crud.getList();
      },
    });
  };

  const handleDeleteBatch = () => {
    modal.confirm({
      title: "提示",
      content: `确认删除选中的 ${crud.selectedIds.length} 个文件？`,
      onOk: async () => {
        await FileApi.deleteFileList(crud.selectedIds);
        crud.setSelectedIds([]);
        messageApi.success("删除成功");
        crud.getList();
      },
    });
  };

  const handlePreview = (row: FileVO) => {
    setPreviewRow(row);
  };

  const handleDownload = async (row: FileVO) => {
    if (transfer && transfer.phase !== "error" && transfer.phase !== "paused" && transfer.phase !== "success") {
      messageApi.warning("请等待当前传输结束");
      return;
    }
    await runDownload(row);
  };

  return {
    ...crud,
    modalHolder,
    messageHolder,
    transfer,
    handleUpload,
    handlePause,
    handleAbortUpload,
    handleResume,
    handleCancelTransfer,
    handleDelete,
    handleDeleteBatch,
    previewRow,
    closePreview: () => setPreviewRow(null),
    handlePreview,
    handleDownload,
  };
}
