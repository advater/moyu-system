import { useState } from "react";
import { Checkbox, Modal, Upload, message } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import * as UserApi from "@/api/system/user";
import { downloadExcel } from "@/utils/file/down";

export default function ImportForm({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [updateSupport, setUpdateSupport] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!file) {
      message.error("请上传文件");
      return;
    }
    setLoading(true);
    try {
      await UserApi.importUser(file, updateSupport);
      message.success("导入成功");
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = async () => {
    const blob = await UserApi.importUserTemplate();
    downloadExcel(blob, "用户导入模板.xls");
  };

  return (
    <Modal
      open={open}
      title="用户导入"
      onCancel={onClose}
      onOk={submit}
      confirmLoading={loading}
      destroyOnHidden
      afterClose={() => {
        setFile(null);
        setUpdateSupport(false);
      }}
    >
      <Upload.Dragger
        accept=".xlsx,.xls"
        maxCount={1}
        beforeUpload={(f) => {
          setFile(f);
          return false;
        }}
        onRemove={() => setFile(null)}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">将文件拖到此处，或点击上传</p>
      </Upload.Dragger>
      <div style={{ marginTop: 12 }}>
        <Checkbox checked={updateSupport} onChange={(e) => setUpdateSupport(e.target.checked)}>
          是否更新已经存在的用户数据
        </Checkbox>
        <div style={{ marginTop: 8, color: "#999" }}>
          仅允许导入 xls、xlsx 格式文件。
          <a onClick={downloadTemplate}>下载模板</a>
        </div>
      </div>
    </Modal>
  );
}
