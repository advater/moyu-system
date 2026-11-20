import { Alert, Avatar, Button, Card, Form, Input, Tabs, Upload } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { useProfile } from "./useProfile";
import ProfileForm from "./ProfileForm";

export default function ProfilePage() {
  const p = useProfile();

  return (
    <div className="user-profile-page" style={{ padding: 16 }}>
      {p.messageHolder}
      {p.forcePwd ? (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="管理员已重置您的密码，请先修改后再继续使用系统"
        />
      ) : null}
      <Card>
        <Tabs
          activeKey={p.tab}
          onChange={p.setTab}
          items={[
            {
              key: "info",
              label: "基本信息",
              disabled: p.forcePwd,
              children: (
                <ProfileForm form={p.form} loading={p.loading} onSubmit={p.handleSubmit} />
              ),
            },
            {
              key: "password",
              label: "修改密码",
              children: (
                <Form form={p.pwdForm} labelCol={{ span: 4 }} wrapperCol={{ span: 10 }} style={{ maxWidth: 640 }}>
                  <Form.Item
                    label="旧密码"
                    name="oldPassword"
                    rules={[{ required: true, message: "请输入旧密码" }]}
                  >
                    <Input.Password />
                  </Form.Item>
                  <Form.Item
                    label="新密码"
                    name="newPassword"
                    rules={[
                      { required: true, message: "请输入新密码" },
                      { min: 6, max: 32, message: "密码长度为 6-32 位" },
                    ]}
                  >
                    <Input.Password />
                  </Form.Item>
                  <Form.Item
                    label="确认密码"
                    name="confirmPassword"
                    dependencies={["newPassword"]}
                    rules={[
                      { required: true, message: "请再次输入新密码" },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue("newPassword") === value) return Promise.resolve();
                          return Promise.reject(new Error("两次输入的密码不一致"));
                        },
                      }),
                    ]}
                  >
                    <Input.Password />
                  </Form.Item>
                  <Form.Item wrapperCol={{ offset: 4 }}>
                    <Button type="primary" loading={p.pwdLoading} onClick={p.handlePassword}>
                      保存密码
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
            {
              key: "avatar",
              label: "头像",
              disabled: p.forcePwd,
              children: (
                <div style={{ padding: "8px 0 24px" }}>
                  <Avatar size={96} src={p.avatar} icon={<UserOutlined />} />
                  <div style={{ marginTop: 16 }}>
                    <Upload
                      accept="image/*"
                      showUploadList={false}
                      beforeUpload={(file) => {
                        void p.handleAvatar(file);
                        return false;
                      }}
                    >
                      <Button>上传头像</Button>
                    </Upload>
                  </div>
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
