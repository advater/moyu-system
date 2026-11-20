// 常用的string方法

// 将字符串转换为驼峰格式
export const camelCase = function (name: string) {
  return name
    .replace(/[-_]+(.)/g, (_, letter) => letter.toUpperCase()) // 将-或_后的字母大写
    .replace(/^./, (str) => str.toLowerCase()); // 将首字母小写
};

// 从驼峰格式转换回普通格式
export const fromCamelCase = function (name: string) {
  return name.replace(/([A-Z])/g, "_$1").toLowerCase(); // 在大写字母前加_并转换为小写
};

// 判断是否json
export const isJsonFn = function (data: string) {
  if (typeof data !== "string") {
    return false;
  }
  try {
    const obj = JSON.parse(data);
    if (obj && typeof obj === "object") {
      return true;
    } else {
      return false;
    }
  } catch {
    return false;
  }
};

// JSON语法高亮
export const syntaxHighlight = function (json: any): string {
  // 检查输入是否为字符串，若不是则转换为格式化的 JSON 字符串
  if (typeof json !== "string") {
    json = JSON.stringify(json, undefined, 2);
  }
  // 防止 XSS 攻击，转义特殊字符
  json = json.replace(/&/g, "&").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return json.replace(
    // /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
    (match: string) => {
      let cls = "number";
      if (/^"/.test(match)) {
        cls = /:$/.test(match) ? "key" : "string";
      } else if (/true|false/.test(match)) {
        cls = "boolean";
      } else if (/null/.test(match)) {
        cls = "null";
      }
      return '<span class="' + cls + '">' + match + "</span>";
    },
  );
};

// text文本关键字高亮
export const textHighlight = function (text: string, keywords: string) {
  if (!keywords) {
    return text;
  }
  const regex = new RegExp(`(${keywords})`, "gi");
  const newText = text.replace(
    regex,
    `<span style="color:#479848;">${keywords}</span>`,
  );
  return newText;
};

// 长文字换行
export const formatLongStr = function (val: string, n: number) {
  let str = "";
  if (val) {
    const chars = val.split("");
    for (let i = 1; i < chars.length; i++) {
      str += chars[i];
      // 每 n 个字符后添加换行符
      if ((i + 1) % n === 0 && i !== chars.length - 1) {
        str += "\n";
      }
    }
  }
  return str;
};

// 去除字符串中的元素标签
export const removeTag = function (fragment: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(fragment, "text/html");
  return doc.body.textContent || "";
};
