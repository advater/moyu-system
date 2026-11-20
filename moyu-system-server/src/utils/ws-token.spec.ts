import { extractWsAccessToken } from './ws-token';

describe('extractWsAccessToken', () => {
  it('从 Authorization Bearer 提取', () => {
    expect(
      extractWsAccessToken('/ws', { authorization: 'Bearer abc123' }),
    ).toBe('abc123');
  });

  it('从 Sec-WebSocket-Protocol bearer. 提取', () => {
    expect(
      extractWsAccessToken('/ws', {
        'sec-websocket-protocol': 'bearer.tok-xyz',
      }),
    ).toBe('tok-xyz');
  });

  it('从 access_token, <token> 双协议提取', () => {
    expect(
      extractWsAccessToken('/ws', {
        'sec-websocket-protocol': 'access_token, my-token',
      }),
    ).toBe('my-token');
  });

  it('忽略 URL Query 中的 token', () => {
    expect(
      extractWsAccessToken('/ws?token=leaked&accessToken=also', {}),
    ).toBe('');
  });
});
