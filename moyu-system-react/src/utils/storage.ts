// 本地缓存方法
type TSetVal = string | number | boolean | Record<string, any> | any[];

type TExpire = number | "permanent";

// permanent 永不过期
const PERMANENT = "permanent";

/**
 * 本地缓存方法
 * 实现 set get remove clear 四个方法
 */
const Storage = {
  /**
   * 添加缓存
   * @param {string} key 缓存名称
   * @param {*} value 缓存名值
   * @param {*} expire 过期时间
   */
  set(key: string, value: TSetVal, expire: TExpire = PERMANENT) {
    const strData = JSON.stringify({
      value,
      ["_expire_"]: expire,
    });
    localStorage.setItem(key, strData);
  },
  /**
   * 查询缓存
   * @param {string} key 缓存名称
   */
  get<T = any>(key: string): T | null {
    const strData = localStorage.getItem(key);
    if (strData) {
      const data = JSON.parse(strData);
      const now = Date.now();
      const expire = data["_expire_"];
      // 永不过期或还未过期
      if (expire === PERMANENT || now < expire) {
        return data.value;
      } else {
        console.log(`${key} has expired!`);
        Storage.remove(key);
        return null;
      }
    } else {
      return null;
    }
  },
  /**
   * 移除缓存
   * @param {string} key 缓存名称
   */
  remove(key: string) {
    localStorage.removeItem(key);
  },
  /**
   * 清除所有缓存
   */
  clear() {
    localStorage.clear();
  },
};

export default Storage;
