import { message as staticMessage } from "antd";
import type { MessageInstance } from "antd/es/message/interface";
import Storage from "./storage";

let messageApi: MessageInstance | null = null;

/** 由 ThemeProvider 注入，请求拦截器等非 React 环境也能弹出 antd 提示 */
export function bindMessageApi(api: MessageInstance) {
  messageApi = api;
}

export function ssoMessage(msg: string) {
  const text = String(msg ?? "").trim();
  if (!text) return;
  console.error(text);
  (messageApi ?? staticMessage).error(text);
}


// 生成随机码
export function randomCode(len = 3) {
  const result = [];
  for (let i = 0; i < len; i++) {
    // 生成一个0到25的数字
    const ranNum = Math.ceil(Math.random() * 25);
    // 大写字母'A'的ASCII是65,A~Z的ASCII码就是65 + 0~25;
    // 然后调用String.fromCharCode()传入ASCII值返回相应的字符并push进数组里
    result.push(String.fromCharCode(65 + ranNum));
  }
  return result.join("");
}

// 生成deviceId
export function getDeviceId() {
  let deviceId = Storage.get<string>("deviceId");
  if (!deviceId || deviceId.indexOf("PC") === -1) {
    const date = new Date().getTime();
    const id = date + randomCode() + "PC";
    Storage.set("deviceId", id);
    deviceId = id;
  }
  return deviceId;
}

// 加载更多
export function loadMore(
  cls: string = ".loading",
  more: (fn: () => void) => void
) {
  let isLoading: boolean;
  const loadingDom = document.querySelector(cls) as HTMLElement;
  const ob = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (!entry.isIntersecting) {
        return;
      }
      if (isLoading) {
        return;
      }
      isLoading = true;
      more(() => {
        isLoading = false;
      });
    },
    {
      root: null,
      threshold: 0,
    }
  );

  ob.observe(loadingDom);
}

// 复制到剪贴板
export async function copyToClipboard(text: string) {
  try {
    if ((window as any).__TAURI__) {
      (window as any).__TAURI__.writeText(text);
    } else {
      await navigator.clipboard.writeText(text);
    }

    ssoMessage("Copy Success");
  } catch (error) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand("copy");
      ssoMessage("Copy Success");
    } catch (error) {
      ssoMessage("Copy Failed");
    }
    document.body.removeChild(textArea);
  }
}