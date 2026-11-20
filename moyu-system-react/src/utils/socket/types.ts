export interface SocketConfig {
  url?: string;
  nickname?: string;
  client?: string;
  uid?: string;
  appId?: string;
}

export const ProtocolMsgType = {
  HEARTBEAT: "heartbeat",
  ACK: "ack",
  PING: "ping",
  PONG: "pong",
} as const;
export type ProtocolMsgType = (typeof ProtocolMsgType)[keyof typeof ProtocolMsgType];

export const BizMsgType = {
  CHAT: "chat",
  GIFT: "gift",
  ROOM: "room",
  AI: "ai",
} as const;
export type BizMsgType = (typeof BizMsgType)[keyof typeof BizMsgType];

export const ConnectionState = {
  DISCONNECTED: "disconnected",
  CONNECTING: "connecting",
  CONNECTED: "connected",
  RECONNECTING: "reconnecting",
} as const;
export type ConnectionState = (typeof ConnectionState)[keyof typeof ConnectionState];

export type ChatType = "singleChat" | "chatRoom";

export interface SendMessageOption {
  msg: string;
  to: string;
  from: string;
  chatType: ChatType;
  ext?: Record<string, unknown>;
}

export interface ChatMessage {
  type: string;
  messageId: string;
  msgId?: string;
  to: string;
  from: string;
  msg?: string;
  data?: unknown;
  ext?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface SocketEventMap {
  open: [event: Event];
  close: [event: CloseEvent];
  error: [error: Event];
  message: [data: unknown];
  status_change: [status: ConnectionState];
  ack: [info: { upid: string; msgId: string; data: unknown }];
  pong: [latency: number];
  dead: [];
}

export interface BusinessEventMap {
  chat: [message: unknown];
  system: [message: unknown];
  gift: [message: unknown];
  like: [message: unknown];
  customize: [message: unknown];
  retract: [message: unknown];
  robot: [message: unknown];
  cmd: [message: unknown];
  read: [message: unknown];
  detail: [message: unknown];
  members: [message: unknown];
  robot_list: [message: unknown];
  history: [message: unknown];
}
