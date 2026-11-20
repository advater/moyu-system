import { useEffect, useState } from "react";
import { Badge, Button, Empty, Popover } from "antd";
import { BellOutlined, MailOutlined, NotificationOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/stores/app";
import * as NotifyMessageApi from "@/api/system/notify/message";
import type { NotifyMessageVO } from "@/api/system/notify/message";
import { formatLocalDateTime } from "@/utils/dateTime";
import Token from "@/utils/token";
import "./MessageBell.scss";

export default function MessageBell() {
  const navigate = useNavigate();
  const { message } = useAppStore();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [list, setList] = useState<NotifyMessageVO[]>([]);

  const loadCount = async () => {
    if (!Token.getToken()) {
      setUnreadCount(0);
      return;
    }
    try {
      const count = await NotifyMessageApi.getUnreadNotifyMessageCount();
      setUnreadCount(Number(count) || 0);
    } catch {
      setUnreadCount(0);
    }
  };

  const loadList = async () => {
    try {
      const rows = await NotifyMessageApi.getUnreadNotifyMessageList();
      setList(rows || []);
      setUnreadCount(0);
    } catch {
      setList([]);
    }
  };

  useEffect(() => {
    if (!message) return;
    void loadCount();
    const timer = window.setInterval(() => void loadCount(), 120000);
    return () => window.clearInterval(timer);
  }, [message]);

  if (!message) return null;

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  const content = (
    <div className="message-bell-panel">
      <div className="message-bell-entries">
        <button type="button" className="message-bell-entry" onClick={() => go("/admin/user/notify-message")}>
          <MailOutlined />
          <span>我的站内信</span>
        </button>
        <button type="button" className="message-bell-entry" onClick={() => go("/admin/messages/notice")}>
          <NotificationOutlined />
          <span>通知公告</span>
        </button>
      </div>
      <div className="message-bell-list">
        {list.length ? (
          list.map((item) => (
            <button
              key={item.id}
              type="button"
              className="message-bell-item"
              onClick={() => go("/admin/user/notify-message")}
            >
              <span className="message-bell-item-title">
                {item.templateNickname ? `${item.templateNickname}：` : ""}
                {item.templateContent}
              </span>
              <span className="message-bell-item-date">{formatLocalDateTime(item.createTime)}</span>
            </button>
          ))
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无未读消息" />
        )}
      </div>
      <div className="message-bell-footer">
        <Button type="link" size="small" onClick={() => go("/admin/user/notify-message")}>
          查看全部
        </Button>
      </div>
    </div>
  );

  return (
    <Popover
      trigger="click"
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) void loadList();
      }}
      placement="bottomRight"
      arrow={false}
      content={content}
      styles={{ content: { padding: 0 } }}
    >
      <span className="message-bell">
        <Badge dot={unreadCount > 0} offset={[-2, 4]}>
          <button type="button" className="header-icon-btn">
            <BellOutlined />
          </button>
        </Badge>
      </span>
    </Popover>
  );
}
