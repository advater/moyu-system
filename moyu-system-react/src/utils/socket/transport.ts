/**
 * 传输层 - Transport
 * 原生 WebSocket，纯连接管理
 */
import type { SocketConfig } from "./types";

const getUUID = (): string => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * 独立的Socket 工具类
 */
export class Transport {
  // WebSocket 实例
  instance: WebSocket | null = null;

  // 连接参数
  private params: SocketConfig = {
    url: "",
    nickname: "",
    client: "web",
    uid: "",
    appId: "",
  };

  // 状态
  duplicateFlag: boolean = false;
  reconnectTime: number = 0;
  maxReconnectTime: number = 5;
  dead: boolean = false;
  supportSocket: boolean = typeof window !== "undefined" && !!window.WebSocket;

  // 指数退避配置
  minReconnectDelay: number = 1000;    // 最小重连延迟 1秒
  maxReconnectDelay: number = 30000;   // 最大重连延迟 30秒

  // 事件监听器集合
  listeners: Map<string, Array<(data: any) => void>> = new Map();

  // 回调函数
  onNotSupportSocket: (() => void) | null = null;

  constructor() {}

  /**
   * 设置连接参数
   */
  setParam(params: SocketConfig): void {
    Object.assign(this.params, params);
  }

  /**
   * 初始化WebSocket连接
   */
  init(options: Record<string, any> = {}): WebSocket | undefined {
    const { url, nickname, client, uid, appId, onNotSupportSocket } = options;

    this.setParam({ url, nickname, client, uid, appId });
    this.onNotSupportSocket = onNotSupportSocket;

    return this.connect();
  }

  /**
   * 建立WebSocket连接
   */
  connect(): WebSocket | undefined {
    try {
      if (!this.supportSocket) {
        console.error("当前浏览器不支持WebSocket");
        this.onNotSupportSocket?.();
        this.emit("status_change", WebSocket.CLOSED);
        return;
      }

      this.reconnectTime += 1;
      // 已有连接且非关闭状态
      if (this.instance) {
        const socketStatus = this.instance.readyState;
        if (socketStatus === WebSocket.CLOSED) {
          console.log("socket已关闭 准备重连");
          if (this.reconnectTime > this.maxReconnectTime) {
            this._reconnectMax();
            return;
          }
        } else {
          console.log("socket已连接中", socketStatus);
          return;
        }
      } else {
        // 超过最大重连次数
        if (this.reconnectTime > this.maxReconnectTime) {
          this._reconnectMax();
          return;
        }
      }

      const urlExt = this._wsUrl();
      const socket = new WebSocket(urlExt);
      this.instance = socket;

      socket.onopen = (e) => {
        this._handleOpen(e, socket);
      };

      socket.onclose = (e) => {
        this._handleClose(e, socket);
      };

      socket.onmessage = (res) => {
        this._handleMessage(res, socket);
      };

      socket.onerror = (error) => {
        this._handleError(error, socket);
      };

      return socket;
    } catch (error) {
      console.error("WebSocket 连接失败:", error);
    }
  }

  private _reconnectMax() {
    console.warn("达到最大重连次数", this.maxReconnectTime);
    this.dead = true;
    this.emit("dead");
    this.emit("status_change", WebSocket.CLOSED);
  }

  // 拼接 URL
  private _wsUrl(): string {
    let wsDomain;
    const { url, nickname, client, uid, appId } = this.params;

    if (import.meta.env.DEV) {
      wsDomain = "ws://" + url;
    } else {
      wsDomain = "wss://" + url;
    }

    const wsid = getUUID();
    return `${wsDomain}?wsid=${wsid}&nickname=${encodeURIComponent(nickname || "")}&client=${encodeURIComponent(client || "")}&uid=${encodeURIComponent(uid || "")}&appId=${encodeURIComponent(appId || "")}`;
  }

  private _handleOpen(e: Event, socket: WebSocket) {
    this.reconnectTime = 0;
    this.dead = false;
    this.emit("open", e);
    this.emit("status_change", socket.readyState);
  }

  private _handleClose(event: CloseEvent, _socket: WebSocket) {
    this.instance = null;

    if (this.duplicateFlag) {
      this.emit("status_change", 3);
      return;
    }
    // 第一次关闭就上报提醒
    if (this.reconnectTime === 1) {
      const errorMsg = `WebSocket连接已关闭，错误码：${event.code}，错误原因：${event.reason}`;
      console.error(errorMsg);
    }

    if (this.maxReconnectTime <= this.reconnectTime || this.dead) {
      this.emit("close", event);
      this.emit("status_change", WebSocket.CLOSED);
    } else {
      this.emit("status_change", 99);
      // 使用指数退避计算重连延迟
      const delay = this._calculateReconnectDelay();
      console.log(`WebSocket 重连延迟: ${Math.round(delay)}ms (第 ${this.reconnectTime} 次重连)`);
      
      const timer = setTimeout(() => {
        clearTimeout(timer);
        this.connect();
      }, delay);
    }
  }

  private _handleMessage(res: MessageEvent<any>, socket: WebSocket) {
    if (!res) return;
    const { data } = res;

    try {
      const parsedData = typeof data === "string" ? JSON.parse(data) : data;
      // 其他消息透传给协议层
      this.emit("message", parsedData);
      this.emit("status_change", socket.readyState);
    } catch (parseError) {
      console.error("WebSocket 消息解析失败:", parseError);
    }
  }

  private _handleError(error: Event, _socket: WebSocket) {
    console.error("WebSocket 连接错误:", error);
    this.instance = null;
    this.emit("error", error);
  }

  /**
   * 计算指数退避延迟时间
   */
  private _calculateReconnectDelay(): number {
    const baseDelay = this.minReconnectDelay * Math.pow(2, this.reconnectTime - 1);
    const jitter = Math.random() * 1000; // 添加0-1秒的随机抖动
    const delay = baseDelay + jitter;
    
    return Math.min(delay, this.maxReconnectDelay);
  }

  /**
   * 关闭连接
   */
  close(): void {
    this.dead = true;
    this.instance?.close(1000, "normal close");
    this.instance = null;
    this.emit("dead");
    this.emit("status_change", WebSocket.CLOSED);
  }

  /**
   * 发送消息（自动 JSON.stringify）
   */
  send(data: Record<string, unknown>): string {
    const packet = {
      msgId: getUUID(),
      ...data,
    };

    const socket = this.instance;
    if (!socket) {
      console.error("WebSocket not connected");
      return packet.msgId;
    }

    if (socket.readyState === WebSocket.OPEN) {
      try {
        socket.send(JSON.stringify(packet));
      } catch (error) {
        console.error("WebSocket 发送失败:", error);
      }
    } else if (socket.readyState === WebSocket.CONNECTING) {
      // 连接中 延迟发送
      const timer = setTimeout(() => {
        clearTimeout(timer);
        this.send(packet);
      }, 1000);
    } else {
      console.error("WebSocket 连接未建立，消息发送失败", packet);
    }

    return packet.msgId;
  }

  /**
   * 设置重复标记
   */
  setDuplicateFlag(): void {
    this.duplicateFlag = true;
  }

  /**
   * 获取当前连接状态
   */
  getState(): number {
    return this.instance?.readyState ?? WebSocket.CLOSED;
  }

  /**
   * 检查是否已连接
   */
  isConnected(): boolean {
    return this.instance?.readyState === WebSocket.OPEN;
  }

  /**
   * 重置重连次数
   */
  resetReconnect(): void {
    this.reconnectTime = 0;
    this.dead = false;
  }

  /**
   * 订阅事件 event 事件名称 callback 回调函数
   */
  on(event: string, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  /**
   * 取消订阅 event 事件名称 callback 回调函数
   */
  off(event: string, callback?: (data: any) => void): void {
    const callbacks = this.listeners.get(event);
    if (!callbacks) return;

    if (callback) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    } else {
      this.listeners.set(event, []);
    }
  }

  /**
   * 触发事件 event 事件名称 data 事件数据
   */
  emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event);
    if (!callbacks) return;

    for (const callback of callbacks) {
      try {
        callback(data);
      } catch (error) {
        console.error(`Event handler error [${event}]:`, error);
      }
    }
  }
}
