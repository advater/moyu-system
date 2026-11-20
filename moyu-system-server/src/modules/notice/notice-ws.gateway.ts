import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { WebSocket, Server as WsServer } from 'ws';
import { NoticeResDTO } from './dto/NoticeRes.dto';
import { OAuth2TokenService } from '@/modules/oauth2/oauth2Token/oauth2Token.service';
import { extractWsAccessToken } from '@/utils/ws-token';

type AuthedSocket = WebSocket & {
  loginUser?: { id: number; tenantId: string };
};

/**
 * 通知 / 站内信 WebSocket 网关
 *
 * 事件：
 * - notice:push
 * - notify:unread-count { count }
 */
@WebSocketGateway()
export class NoticeWsGateway implements OnGatewayInit, OnGatewayConnection {
  private readonly logger = new Logger(NoticeWsGateway.name);

  @WebSocketServer()
  private server!: WsServer;

  constructor(private readonly oauth2TokenService: OAuth2TokenService) {}

  afterInit(): void {
    this.logger.log('通知 WebSocket 网关初始化完成');
  }

  async handleConnection(client: AuthedSocket, ...args: any[]): Promise<void> {
    const req = args?.[0];
    const url: string = client.url || req?.url || '';
    const token = extractWsAccessToken(url, req?.headers);
    if (!token) {
      this.logger.warn('WS 拒绝连接：缺少 token');
      client.close(4401, 'Unauthorized');
      return;
    }
    const tokenRecord =
      await this.oauth2TokenService.validateAccessToken(token);
    if (!tokenRecord) {
      this.logger.warn('WS 拒绝连接：token 无效');
      client.close(4401, 'Unauthorized');
      return;
    }
    client.loginUser = {
      id: tokenRecord.userId,
      tenantId: tokenRecord.tenantId ?? '0',
    };
  }

  /**
   * 广播公告；userIds 有值时仅推送给列表内用户
   */
  broadcastNotice(
    data: NoticeResDTO,
    tenantId?: string,
    userIds?: number[],
  ): void {
    if (!this.server) return;
    const allow = userIds?.length ? new Set(userIds) : null;
    const message = JSON.stringify({ event: 'notice:push', data });
    let sent = 0;
    this.server.clients.forEach((raw) => {
      const client = raw as AuthedSocket;
      if (client.readyState !== client.OPEN) return;
      if (!client.loginUser?.id) return;
      if (tenantId && client.loginUser.tenantId !== tenantId) return;
      if (allow && !allow.has(client.loginUser.id)) return;
      client.send(message);
      sent += 1;
    });
    this.logger.debug(`公告已推送至 ${sent} 个客户端`);
  }

  /** 向指定用户推送未读站内信数量 */
  pushUnreadCount(
    userId: number,
    tenantId: string,
    count: number,
  ): void {
    if (!this.server) return;
    const message = JSON.stringify({
      event: 'notify:unread-count',
      data: { count },
    });
    this.server.clients.forEach((raw) => {
      const client = raw as AuthedSocket;
      if (client.readyState !== client.OPEN) return;
      if (client.loginUser?.id !== userId) return;
      if (client.loginUser.tenantId !== tenantId) return;
      client.send(message);
    });
  }
}
