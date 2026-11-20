/**
 * jsonp 获取跨域数据 不用携带callback函数名称name 自动化处理
 * @param {string} url 完整的jsonp请求地址
 */
export function jsonpFn(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const callbackName = `_callback${Date.now()}`;
    const script = document.createElement("script");

    // 公共清理函数
    function cleanup() {
      document.body.removeChild(script);
      delete (window as any)[callbackName];
    }

    // 超时处理
    const timeoutId = setTimeout(() => {
      reject({ code: 408, message: "请求超时" });
      cleanup();
    }, 12000);

    // 全局回调函数
    (window as any)[callbackName] = function (res: any) {
      clearTimeout(timeoutId);
      cleanup();
      if (res.status === 0) {
        resolve(res);
      } else {
        reject(res);
      }
    };

    // 错误处理
    script.onerror = function () {
      reject({ code: 500, message: "请求失败" });
      cleanup();
    };

    // 拼接回调参数
    const finalUrl = url.includes("?")
      ? `${url}&callback=${callbackName}`
      : `${url}?callback=${callbackName}`;

    script.src = finalUrl;
    document.body.append(script);
  });
}
