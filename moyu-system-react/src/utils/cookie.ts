//一天的毫秒数
const _MILLISECONDS_OF_DAY = 24 * 60 * 60 * 1000;

const Cookie = {
  // 获取一天毫秒数
  getMsByDay: () => {
    return _MILLISECONDS_OF_DAY;
  },

  // 获取指定名称cookie值
  get: (key: string): string | null => {
    const regex = new RegExp("(?:^| )" + key + "(?:(?:=([^;]*))|;|$)");
    const match = String(document.cookie).match(regex);
    return match ? decodeURIComponent(match[1] || "") : null;
  },

  // 设置一个指定名称的cookie值
  set: (
    key: string,
    value: string,
    expires?: number | Date,
    domain?: string,
    path?: string,
    secure?: boolean,
  ) => {
    let cookieString = `${encodeURIComponent(key)}=${encodeURIComponent(
      value,
    )}`;
    // 处理过期时间
    if (expires) {
      let expiresString = "";
      if (typeof expires === "number") {
        const date = new Date(Date.now() + expires * _MILLISECONDS_OF_DAY);
        expiresString = date.toUTCString();
      } else if (expires instanceof Date) {
        expiresString = expires.toUTCString();
      }
      cookieString += `; expires=${expiresString}`;
    }
    // 添加域
    if (domain) {
      cookieString += "; domain=" + domain;
    }
    // 添加路径
    if (path) {
      cookieString += "; path=" + path;
    }
    // 添加安全标志
    if (secure) {
      cookieString += "; secure";
    }
    document.cookie = cookieString;
  },

  // 删除cookie 设置过期日期为过去的某个时间
  remove: (
    key: string,
    domain?: string,
    path?: string,
    secure?: boolean,
  ): void => {
    Cookie.set(key, "", -1, domain, path, secure);
  },
};
export default Cookie;
