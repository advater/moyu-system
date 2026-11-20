import { useEffect, useState } from "react";
import { Form, message } from "antd";
import {
  getUserProfile,
  updateUserProfile,
  updateUserPassword,
  updateUserProfileAvatar,
} from "@/api/system/user/profile";
import { getMustChangePassword, setMustChangePassword } from "@/utils/mustChangePassword";

export function useProfile() {
  const [form] = Form.useForm();
  const [pwdForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [avatar, setAvatar] = useState<string>();
  const [forcePwd, setForcePwd] = useState(getMustChangePassword());
  const [tab, setTab] = useState(forcePwd ? "password" : "info");
  const [messageApi, messageHolder] = message.useMessage();

  const loadProfile = async () => {
    try {
      const data: any = await getUserProfile();
      form.setFieldsValue({
        username: data.username,
        nickname: data.nickname,
        email: data.email,
        mobile: data.mobile,
        sex: data.sex,
      });
      setAvatar(data.avatar);
    } catch {
      messageApi.error("获取用户信息失败");
    }
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    setLoading(true);
    try {
      await updateUserProfile({
        nickname: values.nickname,
        email: values.email,
        mobile: values.mobile,
        sex: values.sex,
      });
      messageApi.success("信息更新成功");
    } catch (error: any) {
      messageApi.error(error?.message || "更新失败");
    } finally {
      setLoading(false);
    }
  };

  const handlePassword = async () => {
    const values = await pwdForm.validateFields();
    setPwdLoading(true);
    try {
      await updateUserPassword(values.oldPassword, values.newPassword);
      setMustChangePassword(false);
      setForcePwd(false);
      pwdForm.resetFields();
      messageApi.success("密码修改成功");
    } catch (error: any) {
      messageApi.error(error?.message || "修改失败");
    } finally {
      setPwdLoading(false);
    }
  };

  const handleAvatar = async (file: File) => {
    try {
      const url = await updateUserProfileAvatar(file);
      setAvatar(url);
      messageApi.success("头像已更新");
    } catch (error: any) {
      messageApi.error(error?.message || "头像上传失败");
    }
    return false;
  };

  useEffect(() => {
    loadProfile();
  }, []);

  return {
    form,
    pwdForm,
    loading,
    pwdLoading,
    avatar,
    tab,
    setTab,
    forcePwd,
    messageHolder,
    handleSubmit,
    handlePassword,
    handleAvatar,
  };
}
