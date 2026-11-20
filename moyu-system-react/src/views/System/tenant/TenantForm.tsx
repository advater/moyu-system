import { useEffect, useState } from "react";
import { Form, Input, InputNumber, Modal, Radio, Select, message } from "antd";
import * as TenantApi from "@/api/system/tenant";
import * as TenantPackageApi from "@/api/system/tenantPackage";
import { DICT_TYPE, getIntDictOptions } from "@/utils/dict";
import { CommonStatusEnum } from "@/utils/constants";

export default function TenantForm({
  open, type, id, onClose, onSuccess,
}: { open: boolean; type: "create" | "update"; id?: number; onClose: () => void; onSuccess: () => void }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [packageList, setPackageList] = useState<TenantPackageApi.TenantPackageVO[]>([]);

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    TenantPackageApi.getTenantPackageList().then(setPackageList).catch(() => setPackageList([]));
    if (type === "update" && id) {
      setLoading(true);
      TenantApi.getTenant(id).then((data) => {
        form.setFieldsValue({
          ...data,
          expireTime: data.expireTime
            ? String(data.expireTime).replace("T", " ").slice(0, 19)
            : undefined,
        });
      }).finally(() => setLoading(false));
    } else {
      form.setFieldsValue({ status: CommonStatusEnum.ENABLE, accountCount: 0 });
    }
  }, [open, type, id]);

  const submit = async () => {
    const values = await form.validateFields();
    const payload = {
      ...values,
      id,
      expireTime: values.expireTime,
      websites: Array.isArray(values.websites)
        ? values.websites
        : typeof values.websites === "string"
          ? values.websites.split(/[,，\s]+/).filter(Boolean)
          : values.websites,
    };
    setLoading(true);
    try {
      if (type === "create") {
        await TenantApi.createTenant(payload);
        message.success("新增成功");
      } else {
        await TenantApi.updateTenant(payload);
        message.success("修改成功");
      }
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} title={type === "create" ? "新增租户" : "修改租户"} onCancel={onClose} onOk={submit} confirmLoading={loading} destroyOnHidden width={640}>
      <Form form={form} labelCol={{ span: 6 }} wrapperCol={{ span: 16 }}>
        <Form.Item name="name" label="租户名" rules={[{ required: true, message: "租户名不能为空" }]}>
          <Input placeholder="请输入租户名" />
        </Form.Item>
        <Form.Item name="packageId" label="租户套餐" rules={[{ required: true, message: "租户套餐不能为空" }]}>
          <Select placeholder="请选择租户套餐" options={packageList.map((p) => ({ label: p.name, value: p.id }))} />
        </Form.Item>
        <Form.Item name="contactName" label="联系人" rules={[{ required: true, message: "联系人不能为空" }]}>
          <Input placeholder="请输入联系人" />
        </Form.Item>
        <Form.Item name="contactMobile" label="联系手机">
          <Input placeholder="请输入联系手机" />
        </Form.Item>
        {type === "create" && (
          <>
            <Form.Item name="username" label="用户名称" rules={[{ required: true, message: "用户名称不能为空" }]}>
              <Input placeholder="请输入用户名称" />
            </Form.Item>
            <Form.Item name="password" label="用户密码" rules={[{ required: true, message: "用户密码不能为空" }]}>
              <Input.Password placeholder="请输入用户密码" />
            </Form.Item>
          </>
        )}
        <Form.Item name="accountCount" label="账号额度" rules={[{ required: true, message: "账号额度不能为空" }]}>
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="expireTime" label="过期时间" rules={[{ required: true, message: "过期时间不能为空" }]}>
          <Input placeholder="例如 2026-12-31 23:59:59" />
        </Form.Item>
        <Form.Item name="websites" label="绑定域名">
          <Select mode="tags" placeholder="请输入绑定域名，回车添加" />
        </Form.Item>
        <Form.Item name="status" label="租户状态" rules={[{ required: true, message: "租户状态不能为空" }]}>
          <Radio.Group options={getIntDictOptions(DICT_TYPE.COMMON_STATUS)} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
