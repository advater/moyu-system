/**
 * 协议层 - Protocol
 */
import { Transport } from "./transport";
import { ProtocolMsgType } from "./types";

export type BusinessMessageHandler = (data: Record<string, any>) => void;

export class Protocol {
  private transport: Transport;
  private businessHandler: BusinessMessageHandler | null = null;

  // 心跳
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private heartbeatInterval = 30000; // 主动ping间隔30秒
  private lastHeartbeatTime = 0;
  private heartbeatTimeout = 60000; // 60秒超时

  constructor(transport: Transport) {
    this.transport = transport;
    this.transport.on("message", (data) => this._handleSocketMessage(data));
    this.transport.on("open", () => this._startHeartbeat());
    this.transport.on("close", () => this._stopHeartbeat());
  }

  // 设置业务处理函数
  setBusinessHandler(handler: BusinessMessageHandler): void {
    this.businessHandler = handler;
  }

  /**
   * 处理收到的消息 message 原始消息
   */
  private _handleSocketMessage(message: Record<string, any>): void {
    if (!message || typeof message !== "object" || !message.type) {
      return;
    }

    if (this._isProtocolMessage(message.type)) {
      this._handleProtocolMessage(message);
      return;
    }

    this._passToBusiness(message);
  }

  private _passToBusiness(data: Record<string, any>): void {
    this.businessHandler?.(data);
  }

  private _handleProtocolMessage(message: Record<string, any>): void {
    switch (message.type) {
      case ProtocolMsgType.HEARTBEAT: // 处理被动心跳消息
        this._handleHeartbeat(message);
        break;
      case ProtocolMsgType.ACK: // 处理ACK确认消息
        this._handleAck(message);
        break;
      case ProtocolMsgType.PONG: // 处理主动心跳消息
        this._handlePong(message);
        break;
      // 其他协议消息在这扩展
      default:
        break;
    }
  }

  private _isProtocolMessage(type: string): boolean {
    return type === ProtocolMsgType.HEARTBEAT ||
      type === ProtocolMsgType.PONG ||
      type === ProtocolMsgType.ACK;
  }

  /**
   * 处理被动心跳消息
   */
  private _handleHeartbeat(_message: Record<string, any>): void {
    this.lastHeartbeatTime = Date.now();

    this.transport.send({
      type: ProtocolMsgType.HEARTBEAT,
      data: {
        timestamp: Date.now(),
      },
    });
  }

  /**
   * 处理主动心跳消息
   */
  private _handlePong(_message: Record<string, any>): void {
    const latency = Date.now() - this.lastHeartbeatTime;
    this.lastHeartbeatTime = Date.now();
    this.emit("pong", latency);
  }

  /**
   * 开启主动心跳
   */
  private _startHeartbeat(): void {
    this._stopHeartbeat();
    this.lastHeartbeatTime = Date.now();

    this.heartbeatTimer = setInterval(() => {
      if (!this.transport.isConnected()) {
        return;
      }

      // 超时检测
      const elapsed = Date.now() - this.lastHeartbeatTime;
      if (elapsed > this.heartbeatTimeout) {
        console.warn("心跳超时，触发重连");
        this._stopHeartbeat();
        this.transport.resetReconnect();
        this.transport.connect();
        return;
      }

      this.transport.send({
        type: ProtocolMsgType.PING,
        payload: "ping",
        timestamp: Date.now(),
      });
    }, this.heartbeatInterval);
  }

  /**
   * 停止主动心跳 
   */
  private _stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * 处理ACK确认消息
   */
  private _handleAck(message: Record<string, any>): void {
    const { upid, msgId } = message;
    this.emit("updateMessageSendStatus", {
      id: upid,
      status: 1,
      msgId,
    });
  }

  /**
   * 发送消息（经过协议层处理）
   */
  send(data: Record<string, unknown>): string {
    return this.transport.send(data);
  }

  on(event: string, callback: (data: any) => void): void {
    return this.transport.on(event, callback);
  }

  off(event: string, callback?: (data: any) => void): void {
    return this.transport.off(event, callback);
  }

  emit(event: string, data?: any): void {
   return this.transport.emit(event, data);
  }
}