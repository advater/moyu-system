import { Descriptions, Modal } from "antd";
import DictTag from "@/components/DictTag";
import { DICT_TYPE } from "@/utils/dict";
import { formatLocalDateTime } from "@/utils/dateTime";
import type { JobLogVO } from "@/api/system/jobLog";

export default function JobLogDetailModal({
  detail,
  onClose,
}: {
  detail: JobLogVO | null;
  onClose: () => void;
}) {
  return (
    <Modal open={!!detail} title="调度日志详情" footer={null} onCancel={onClose} width={720}>
      {detail && (
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="日志编号">{detail.id}</Descriptions.Item>
          <Descriptions.Item label="任务编号">{detail.jobId}</Descriptions.Item>
          <Descriptions.Item label="处理器名字">{detail.handlerName}</Descriptions.Item>
          <Descriptions.Item label="处理器参数">{detail.handlerParam || "-"}</Descriptions.Item>
          <Descriptions.Item label="开始时间">{formatLocalDateTime(detail.beginTime)}</Descriptions.Item>
          <Descriptions.Item label="结束时间">{formatLocalDateTime(detail.endTime)}</Descriptions.Item>
          <Descriptions.Item label="执行时长">{detail.duration} ms</Descriptions.Item>
          <Descriptions.Item label="状态"><DictTag type={DICT_TYPE.INFRA_JOB_LOG_STATUS} value={detail.status} /></Descriptions.Item>
          <Descriptions.Item label="执行结果"><pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{detail.result || "-"}</pre></Descriptions.Item>
        </Descriptions>
      )}
    </Modal>
  );
}
