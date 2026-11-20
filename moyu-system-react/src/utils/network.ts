interface NetworkInformation {
  effectiveType?: string; // 网络的有效类型，如 "4g", "3g", "2g", "slow-2g"
  type?: string; // 网络连接类型，如 "wifi", "cellular", "none"
  downlink?: number; // 估计的下行带宽（以 Mbps 为单位）
  rtt?: number; // 估计的往返时间（以毫秒为单位）
  saveData?: boolean; // 指示用户是否启用了省数据模式
  addEventListener: (event: string, listener: () => void) => void;
}

type TCallback = (e: any) => void;
interface TNavigator extends Navigator {
  connection: NetworkInformation;
  mozConnection: NetworkInformation;
  webkitConnection: NetworkInformation;
}

/**
 * 持续获取网络状态
 * @param {Function} callback
 */
export function getNetworkType(callback: TCallback) {
  // 检查是否在线
  const isOnline = navigator.onLine;

  // 获取网络连接类型
  const connection =
    (navigator as TNavigator).connection ||
    (navigator as TNavigator).mozConnection ||
    (navigator as TNavigator).webkitConnection;
  if (connection) {
    const { effectiveType } = connection;
    let connectionType: string;
    switch (effectiveType) {
      case "2g":
      case "3g":
      case "4g":
        connectionType = effectiveType;
        break;
      default:
        connectionType = "highSpeed";
        break;
    }
    const networkStatus = {
      isOnline,
      connectionType,
    };
    callback(networkStatus);

    const handleNetworkChange = () => {
      networkStatus.isOnline = navigator.onLine;
      networkStatus.connectionType =
        (navigator as TNavigator).connection.effectiveType || "unknown";
      callback(networkStatus);
    };

    // 监听网络状态变化事件
    window.addEventListener("online", handleNetworkChange);
    window.addEventListener("offline", handleNetworkChange);
    if (connection) {
      connection.addEventListener("change", handleNetworkChange);
    }
    // 持续检测网络状态
    const checkNetworkStatus = () => {
      requestIdleCallback(() => {
        handleNetworkChange();
        requestIdleCallback(checkNetworkStatus, { timeout: 5000 });
      });
    };

    checkNetworkStatus();
  }
}
