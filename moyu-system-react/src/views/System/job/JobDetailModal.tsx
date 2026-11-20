import { Form, Modal } from "antd";
import type { JobVO } from "@/api/system/job";

export default function JobDetailModal({
  detail,
  onClose,
}: {
  detail: JobVO | null;
  onClose: () => void;
}) {
  return (
    <Modal open={!!detail} title="任务详情" footer={null} onCancel={onClose}>
      {detail && (
        <Form labelCol={{ span: 8 }} wrapperCol={{ span: 14 }}>
          <Form.Item label="任务名称"><span>{detail.name}</span></Form.Item>
          <Form.Item label="处理器名字"><span>{detail.handlerName}</span></Form.Item>
          <Form.Item label="处理器参数"><span>{detail.handlerParam || "-"}</span></Form.Item>
          <Form.Item label="CRON 表达式"><span>{detail.cronExpression}</span></Form.Item>
          <Form.Item label="重试次数"><span>{detail.retryCount}</span></Form.Item>
          <Form.Item label="重试间隔"><span>{detail.retryInterval} 秒</span></Form.Item>
          <Form.Item label="监控超时"><span>{detail.monitorTimeout} 秒</span></Form.Item>
        </Form>
      )}
    </Modal>
  );
}
