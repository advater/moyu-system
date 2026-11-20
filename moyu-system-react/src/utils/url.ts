// 解析指定url中的参数
export const getParseQuery = function (url: string): Record<string, string> {
  const query: Record<string, string> = {};
  const regex = /([^?&=]+)=([^&]+)/g;
  url.replace(regex, (_, k, v) => (query[k] = v));
  return query;
};

// 获取当前URL查询参数
export const getQueryObj = function (): URLSearchParams {
  return new URLSearchParams(location.search);
};

// 获取当前URL参数
export const getUrlQuery = function (key: string): string | null {
  if (encodeURIComponent) {
    const reg = new RegExp(`[?&]${encodeURIComponent(key)}=([^&]*)`);
    const match = location.search.match(reg);
    return match ? decodeURIComponent(match[1]) : null;
  } else {
    const reg = new RegExp("(^|&)" + key + "=([^&]*)(&|$)");
    const r = location.search.substr(1).match(reg);
    return r != null ? unescape(r[2]) : null;
  }
};
