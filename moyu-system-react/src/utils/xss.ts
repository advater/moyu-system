/**
 * xss输入内容过滤
 */
import validation from "./validation";

// HTML符号 转义
export function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// 检查并清理输入内容
export function sanitizeInput(input: string): string {
  return escapeHtml(input); // 对用户输入进行 HTML 转义
}

// 检查用户名是否合法
export function nameFilter(name: string, min: number = 0, max: number) {
  if (validation.checkCnName(name)) {
    return {
      data: false,
      msg: "用户名不能含有中文, 且长度在2 - 10位",
    };
  } else if (validation.checkCnSpecial(name)) {
    return {
      data: false,
      msg: "用户名不能含有中文",
    };
  } else if (name.length < min || name.length > max) {
    return {
      data: false,
      msg: "用户名长度为" + min + "-" + max + "个字符",
    };
  } else {
    return {
      data: true,
      msg: "",
    };
  }
}

// 检查一般输入内容的长度是否在指定范围内
export function lengthFilter(value: string, min: number, max: number) {
  if (value.length < min || value.length > max) {
    return false;
  } else {
    return true;
  }
}

// 检查手机号码是否合法
export function mobileFilter(mobile: string) {
  if (validation.checkPhone(mobile)) {
    return true;
  } else {
    return false;
  }
}

// 检查邮箱地址是否合法
export function emailFilter(email: string) {
  if (validation.checkEmail(email)) {
    return true;
  } else {
    return false;
  }
}

// 检查邮政编码是否合法
export function postCodeFilter(postCode: string) {
  if (validation.checkPostCode(postCode)) {
    return true;
  } else {
    return false;
  }
}
