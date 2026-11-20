import { Modal, Typography } from "antd";
import { useEffect, useState } from "react";
import type { FileVO } from "@/api/system/file";
import { getPreviewTicket, previewMediaUrl } from "@/api/system/file";
import Token from "@/utils/token";
import { getTenantId } from "@/utils/auth";

type Kind = "video" | "audio" | "image" | "pdf" | "text" | "other";

function extOf(name?: string) {
  const i = (name || "").lastIndexOf(".");
  return i >= 0 ? name!.slice(i + 1).toLowerCase() : "";
}

export function previewKind(row: FileVO): Kind {
  const mime = (row.type || "").toLowerCase();
  const ext = extOf(row.name);
  if (mime.startsWith("video/") || ["mp4", "webm", "ogg", "mov", "m4v"].includes(ext)) return "video";
  if (mime.startsWith("audio/") || ["mp3", "wav", "ogg", "m4a", "aac", "flac"].includes(ext)) return "audio";
  if (mime.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(ext)) return "image";
  if (mime === "application/pdf" || ext === "pdf") return "pdf";
  if (
    mime.startsWith("text/") ||
    ["json", "xml", "javascript"].some((t) => mime.includes(t)) ||
    ["txt", "csv", "json", "xml", "md", "log"].includes(ext)
  ) {
    return "text";
  }
  return "other";
}

const TEXT_BYTES = 256 * 1024;

async function readTextHead(url: string): Promise<string> {
  const headers: Record<string, string> = { Range: `bytes=0-${TEXT_BYTES - 1}` };
  const token = Token.getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const tenantId = getTenantId();
  if (tenantId) headers["tenant-id"] = tenantId;
  const res = await fetch(url, { credentials: "include", headers });
  if (!res.ok && res.status !== 206) throw new Error(`HTTP ${res.status}`);
  const buf = await res.arrayBuffer();
  const text = new TextDecoder("utf-8", { fatal: false }).decode(buf);
  const truncated = buf.byteLength >= TEXT_BYTES;
  return truncated ? `${text}\n\n… 仅预览前 ${TEXT_BYTES / 1024}KB，完整内容请下载` : text;
}

export default function FilePreview({
  row,
  onClose,
}: {
  row: FileVO | null;
  onClose: () => void;
}) {
  const kind = row ? previewKind(row) : "other";
  const rowId = row?.id ?? null;
  const [view, setView] = useState<{
    rowId: number | null;
    mediaUrl?: string;
    text?: string;
    error?: string;
    loading: boolean;
  }>({ rowId: null, loading: false });

  if (rowId !== view.rowId) {
    setView({
      rowId,
      mediaUrl: undefined,
      text: undefined,
      error: undefined,
      loading: Boolean(row) && kind !== "other",
    });
  }

  useEffect(() => {
    if (!row || kind === "other") return;
    let cancelled = false;
    (async () => {
      try {
        const issued = await getPreviewTicket(row.id);
        if (cancelled) return;
        const url = previewMediaUrl(row.id, issued.ticket);
        if (kind === "text") {
          const text = await readTextHead(url);
          if (!cancelled) {
            setView((current) =>
              current.rowId === row.id ? { ...current, text, loading: false } : current,
            );
          }
        } else if (!cancelled) {
          setView((current) =>
            current.rowId === row.id ? { ...current, mediaUrl: url, loading: false } : current,
          );
        }
      } catch (err: any) {
        if (!cancelled) {
          setView((current) =>
            current.rowId === row.id
              ? { ...current, error: err?.message || "无法预览", loading: false }
              : current,
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [row, kind]);

  const { mediaUrl, text, error, loading } = view;

  return (
    <Modal
      open={!!row}
      title={row ? `预览 · ${row.name}` : "预览"}
      onCancel={onClose}
      footer={null}
      width={kind === "video" || kind === "pdf" ? 900 : 720}
      destroyOnClose
    >
      {loading ? <Typography.Text type="secondary">准备流式预览…</Typography.Text> : null}
      {error ? <Typography.Text type="danger">{error}</Typography.Text> : null}
      {kind === "other" && row ? (
        <Typography.Paragraph>
          该类型不支持浏览器内流式预览（HLS/m3u8 需要服务端 ffmpeg 转码，当前未接入）。请使用下载。
        </Typography.Paragraph>
      ) : null}
      {kind === "video" && mediaUrl ? (
        <video
          key={mediaUrl}
          src={mediaUrl}
          controls
          preload="metadata"
          style={{ width: "100%", maxHeight: 520, background: "#000" }}
        />
      ) : null}
      {kind === "audio" && mediaUrl ? (
        <audio key={mediaUrl} src={mediaUrl} controls preload="metadata" style={{ width: "100%" }} />
      ) : null}
      {kind === "image" && mediaUrl ? (
        <img src={mediaUrl} alt={row?.name} style={{ maxWidth: "100%", maxHeight: 520 }} />
      ) : null}
      {kind === "pdf" && mediaUrl ? (
        <iframe title={row?.name} src={mediaUrl} style={{ width: "100%", height: 640, border: 0 }} />
      ) : null}
      {kind === "text" && text != null ? (
        <pre style={{ maxHeight: 480, overflow: "auto", whiteSpace: "pre-wrap", fontSize: 12 }}>{text}</pre>
      ) : null}
      {kind === "video" ? (
        <Typography.Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
          按 HTTP Range 分段加载，不整包进内存。若进度条无法拖动，多半是 MP4 索引在文件尾部，完整转 HLS 需后续接入 ffmpeg。
        </Typography.Paragraph>
      ) : null}
    </Modal>
  );
}
