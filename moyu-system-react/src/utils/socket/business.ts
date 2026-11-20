import { Protocol } from "./protocol";
import { BizMsgType } from "./types";
import { setBusinessSender } from "./sender";

export class Business {
  private protocol: Protocol;

  constructor(protocol: Protocol) {
    this.protocol = protocol;
    this.protocol.setBusinessHandler((data) => this.handleMessage(data));
    setBusinessSender(this);
  }

  send(data: Record<string, unknown>): string {
    return this.protocol.send(data);
  }

  /** 按 type 路由；chat/room/gift/ai slice 未迁入本后台，仅保留路由与日志 */
  handleMessage(data: Record<string, unknown>): void {
    const type = data.type as string;
    if (!type) return;

    switch (type) {
      case BizMsgType.CHAT:
      case BizMsgType.GIFT:
      case BizMsgType.ROOM:
      case BizMsgType.AI:
        console.debug(`[socket] business message (${type})`, data);
        break;
      default:
        console.warn(`Unhandled message type: ${type}`, data);
    }
  }
}
