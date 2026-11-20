import { Form, Input, Modal } from "antd";
import type { FormInstance } from "antd/es/form";

export default function AreaIpModal({
  open,
  loading,
  result,
  form,
  onOk,
  onCancel,
}: {
  open: boolean;
  loading: boolean;
  result: string;
  form: FormInstance;
  onOk: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      open={open}
      title="IP 查询"
      onCancel={onCancel}
      onOk={onOk}
      confirmLoading={loading}
    >
      <Form form={form} labelCol={{ span: 6 }}>
        <Form.Item name="ip" label="IP 地址" rules={[{ required: true, message: "请输入 IP" }]}>
          <Input placeholder="例如 127.0.0.1" />
        </Form.Item>
      </Form>
      {result && <p>归属地：{result}</p>}
    </Modal>
  );
}
