import request from "@/utils/request/xhr";

/**
 * 同步获取config配置
 * 无须打包 动态获取外部config输入的常量
 * 获取外部的serverconfig.json文件的配置存储于session
 */
export function getConfigJson(callback: (...args: any[]) => void) {
  request({
    url: "./serverConfig.json?v=" + new Date(),
    success: (response) => {
      sessionStorage.setItem("GLOBAL_CONFIG", JSON.stringify(response));
      callback(response);
    },
    fail: (error) => {
      console.log("获取config配置失败 ---", error);
    },
  });
}
