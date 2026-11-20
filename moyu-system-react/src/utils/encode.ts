//将字符串转unicode编码
export function StrToUnicode(str: string) {
  let unid = "\\u";
  for (let i = 0, len = str.length; i < len; i++) {
    if (i < len - 1) {
      unid += str.charCodeAt(i).toString(16) + "\\u";
    } else if (i === len - 1) {
      unid += str.charCodeAt(i).toString(16);
    }
  }
  return unid;
}

//将unicode转字符串解码
export function UnicodeToStr(unicode: string) {
  const result = [];
  const strArr = unicode.split("\\u");
  for (let i = 0, len = strArr.length; i < len; i++) {
    if (strArr[i]) {
      result.push(String.fromCharCode(parseInt(strArr[i], 16)));
    }
  }
  return result.join("");
}

// 强制转换为UTF-8编码
export function isEncodingConsistent(str: string) {
  try {
    const encoder = new TextEncoder(); // 默认编码为UTF-8
    const decoder = new TextDecoder("utf-8");
    const encoded = encoder.encode(str);
    const decoded = decoder.decode(encoded);
    return decoded === str; // 判断转换前后是否一致
  } catch {
    return false; // 转换失败说明编码不一致
  }
}

// 正则表达式检测中文
export function isChineseValid(str: string) {
  return /^[\u4E00-\u9FA5]+$/.test(str);
}

// 检查乱码字符 返回false表示无乱码‌
export function hasGarbageCharacter(str: string) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  try {
    const bytes = encoder.encode(str);
    decoder.decode(bytes);
    return false;
  } catch {
    return true; // 解码失败说明存在乱码
  }
}

// 检查编码是否有效
export function checkChineseStability(str: string) {
  // 步骤1：验证是否为有效中文
  if (!isChineseValid(str)) return "包含非中文字符或乱码";

  // 步骤2：检查编码一致性
  if (!isEncodingConsistent(str)) return "编码转换导致差异";

  // // 步骤3：多编码环境验证（需引入第三方库）
  // if (!checkMultiEncoding(str)) return "存在多编码兼容性问题";

  return `字符${str}编码无差异`;
}
