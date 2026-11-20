/**
 * Token 管理
 *
 * - AccessToken：sessionStorage，请求头 Bearer
 * - RefreshToken：后端优先写 httpOnly Cookie；前端再存一份作 Body 兜底
 *   （Cookie 因 path / 跨端口没带上时，刷新接口仍能换票）
 */
import Storage from "./storage";

const AccessTokenKey = "ACCESS_TOKEN";
const RefreshTokenKey = "REFRESH_TOKEN";

const Token = {
  getToken(): string {
    return sessionStorage.getItem(AccessTokenKey) || "";
  },

  setToken(token: string) {
    if (token) sessionStorage.setItem(AccessTokenKey, token);
    else sessionStorage.removeItem(AccessTokenKey);
  },

  clearToken() {
    sessionStorage.removeItem(AccessTokenKey);
  },

  getRefreshToken(): string {
    return (
      sessionStorage.getItem(RefreshTokenKey) ||
      Storage.get<string>(RefreshTokenKey) ||
      ""
    );
  },

  setRefreshToken(token: string) {
    if (token) {
      sessionStorage.setItem(RefreshTokenKey, token);
      Storage.set(RefreshTokenKey, token);
    } else {
      Token.clearRefreshToken();
    }
  },

  clearRefreshToken() {
    sessionStorage.removeItem(RefreshTokenKey);
    Storage.remove(RefreshTokenKey);
  },
};

export default Token;
