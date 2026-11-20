// 常用的number方法

// 金钱格式化
export const formatMoney = function (amount: number): string {
  // 检查输入是否为有效数字
  if (isNaN(amount)) {
    throw new Error("Invalid input: not a number");
  }

  // 将金额转换为字符串
  let [whole, decimal] = amount.toString().split(".");

  // 添加千位分隔符
  whole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  // 如果有小数部分，则添加小数部分
  if (decimal) {
    decimal = decimal.substring(0, 2); // 保留两位小数
    return `${whole}.${decimal}`;
  }

  return `${whole}.00`; // 没有小数部分时，默认为两位小数
};

// 字节数转大小
export const bytesToSize = function (bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024; // or 1024
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toPrecision(3)) + " " + sizes[i];
};

// 大整数相加 超出整数存储范围的 传入string 类型
export const sumBigInt = function (a: string, b: string) {
  // 最大安全整数
  const max = Number.MAX_SAFE_INTEGER;
  if (Number(a) < max && Number(b) < max) {
    return Number(a) + Number(b);
  }
  // 取两个数的最大长度
  const len = Math.max(a.length, b.length);
  // 补全位数以便循环
  a = a.padStart(len, "0");
  b = b.padStart(len, "0");
  // 相加结果
  let result = "";
  // 每一位相加后进位结果
  let carry = 0;
  // 倒序循环
  for (let i = len - 1; i >= 0; i--) {
    const sum = Number(a[i]) + Number(b[i]) + carry;
    result = (sum % 10) + result;
    carry = sum > 9 ? 1 : 0;
  }
  // 最高位有进位则最高位为1
  if (carry) {
    return carry + result;
  }
  return result;
};
