| 功能点                  | XHR      | Fetch    |
| ----------------------- | -------- | -------- |
| 基本的请求能力          | yes      | yes      |
| 基本的获取响应能力      | yes      | yes      |
| 监控请求进度            | yes      | no       |
| 监控响应进度            | yes      | yes      |
| service worker 是否可用 | no       | yes      |
| 控制 cookie 的携带      | no       | yes      |
| 控制重定向              | no       | yes      |
| 请求取消                | yes      | yes      |
| 自定义 referer          | no       | yes      |
| 流                      | no       | yes      |
| api 风格                | Event    | Promise  |
| 活跃度                  | 停止更新 | 不断更新 |

Axios and Fetch
axios 的实现依赖于 XMLHttpRequest，而xhr不会再向前演化
fetch 还可以继续向前演化，如果 Node 同步演化的话，fetch 在两端都会持续获得新功能。
fetch 可以在 service worker 中运行，而 xhr 仅在渲染进程中运行
fetch 在引入时已经做好了跟其它前端内建类型的兼容，
axios 底层的 XMLHttpRequest 不支持。
axios 可以在封装的时候加入支持，但 fetch 的支持是原生的。
这包括为 fetch 引入的 Header、Request、Response 类型，
也包括 fetch 之外的内建类型如 URL、Blob、BufferArray、FormData、URLSearchParams、ReadableStream、WritableStream 等。
这些内建类型还有机会继续演化，fetch 可能会跟着进行兼容性演化。
前端的 axios 如同被智子锁定了科技一样，fetch 支持的流式（stream）请求和响应都没办法做。
理论上 axios 最终可以在不改变 API 的前提下切换到 fetch 上面去，但如果 axios 变成了一个 fetch 的封装，那等 Node 有了 fetch 之后为什么不直接用 fetch 呢？

| 网络模型 | TCP/IP | HTTP | SSL/TLS/HTTPS | HTTP2 |
| AJAX | 文件上传 | 文件下载 | 分片传输 |
| 网络性能优化 | 缓存协议 | JWT | cookie | session |
| 跨域及解决方案 | 域名与 DNS | CSRF | XSS |
| WEBSOCKET | SSE | Postman |

跨域及解决方案
├── 能改服务器吗
│   ├── 不能 ── 代理服务器
│   │
│   │
│   └── 能 ── 浏览器支持CORS吗 ── 不支持 ── JSONP
│  │ 
│   │ 
│  └── 支持 ── CORS

sso 单点登录 转token
