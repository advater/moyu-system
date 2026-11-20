import { useState } from "react";
import { Tabs } from "antd";
import LoginLog from "./loginlog";
import OperateLog from "./operatelog";

export default function Page() {
  const [activeTab, setActiveTab] = useState("login");

  const items = [
    {
      key: "login",
      label: "登录日志",
      children: <LoginLog />,
    },
    {
      key: "operate",
      label: "操作日志",
      children: <OperateLog />,
    },
  ];

  return (
    <div className="log-page">
      <Tabs activeKey={activeTab} items={items} onChange={setActiveTab} />
    </div>
  );
}