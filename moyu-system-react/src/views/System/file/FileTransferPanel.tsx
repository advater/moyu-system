import { Button, Progress, Space, Typography } from "antd";

export type TransferKind = "upload" | "download";

export type TransferTask = {
  kind: TransferKind;
  name: string;
  percent: number;
  phase: string;
  hint?: string;
};

const PHASE_LABEL: Record<string, string> = {
  hashing: "校验分片",
  uploading: "上传分片",
  merging: "合并校验",
  downloading: "下载",
  paused: "已暂停",
  error: "失败",
  success: "完成",
};

export default function FileTransferPanel({
  task,
  onPause,
  onResume,
  onCancel,
}: {
  task: TransferTask | null;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
}) {
  if (!task) return null;
  const paused = task.phase === "paused";
  const busy = task.phase === "hashing" || task.phase === "uploading" || task.phase === "merging" || task.phase === "downloading";
  return (
    <div style={{ margin: "0 0 12px", padding: "12px 16px", background: "var(--ant-color-fill-quaternary, #fafafa)", borderRadius: "var(--ds-radius-small, 10px)" }}>
      <Space direction="vertical" style={{ width: "100%" }} size={8}>
        <Space style={{ width: "100%", justifyContent: "space-between" }}>
          <Typography.Text ellipsis style={{ maxWidth: 420 }}>
            {task.kind === "upload" ? "上传" : "下载"} · {task.name}
          </Typography.Text>
          <Space>
            {busy ? <Button size="small" onClick={onPause}>暂停</Button> : null}
            {paused || task.phase === "error" ? (
              <Button size="small" type="primary" onClick={onResume}>
                继续
              </Button>
            ) : null}
            <Button size="small" danger onClick={onCancel}>取消</Button>
          </Space>
        </Space>
        <Progress percent={task.percent} status={task.phase === "error" ? "exception" : paused ? "normal" : "active"} />
        <Typography.Text type="secondary">
          {PHASE_LABEL[task.phase] || task.phase}
          {task.hint ? ` · ${task.hint}` : ""}
        </Typography.Text>
      </Space>
    </div>
  );
}
