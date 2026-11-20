type TMethod = "get" | "GET";

/**
 * 同步请求
 * 用于第一次加载页面时，获取配置数据
 * @param {String} url 请求的路径
 * @param {String} method 请求的方式
 * @param {Object} async 是否异步执行请求
 * */

function xhrRequest({
  url,
  method = "GET",
  async = false,
  success = () => {},
  fail = () => {},
}: {
  url: string;
  method?: TMethod;
  async?: boolean;
  success?: (res: any) => void;
  fail?: (err: any) => void;
}) {
  //创建一个 XMLHttpRequest 对象
  const xhr = new XMLHttpRequest();

  //设置请求方法、URL 和是否异步
  xhr.open(method, url, async);

  //设置响应处理函数
  xhr.onreadystatechange = function () {
    // 判断请求是否完成
    if (xhr.readyState === XMLHttpRequest.DONE) {
      // 判断请求是否成功
      if (xhr.status === 200) {
        success(xhr.response);
      } else {
        fail(xhr.statusText);
      }
    }
  };

  xhr.onerror = () => {
    fail("Network Error");
  };

  xhr.send();
}

export default xhrRequest;
