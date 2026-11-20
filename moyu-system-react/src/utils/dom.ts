/**
 * 常用的 DOM 操作
 */

// 转换nodeList成Array
export const nodeListToArray = function (nodes: NodeList) {
  try {
    return Array.from(nodes);
  } catch {
    const array = [];
    for (let i = 0; i < nodes.length; i++) {
      array.push(nodes[0]);
    }
    return array;
  }
};

// 任意位置点击是否在指定元素内部
export function getClickInside(elSelector: string) {
  document.addEventListener("click", (e) => {
    //获取弹窗对象
    const element = document.querySelector(elSelector) as HTMLElement;
    //判断弹窗对象中是否包含点击对象
    if (element && !element.contains(e.target as Node)) {
      return true;
    } else {
      return false;
    }
  });
}

// 监听 Esc 键关闭弹窗
export function closeOnEsc(elSelector: string) {
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const element = document.querySelector(elSelector) as HTMLElement;
      if (element) {
        element.style.display = "none"; // 或其他关闭逻辑
      }
    }
  });
}

// 动态加载脚本
export function loadScript(src: string, callback: () => void) {
  const script = document.createElement("script");
  script.src = src;
  script.onload = () => {
    if (callback) callback();
  };
  document.head.appendChild(script);
}

// 监听窗口大小变化
export function onWindowResize(
  callback: ({ w, h }: { w: number; h: number }) => void,
) {
  window.addEventListener("resize", () => {
    callback({ w: window.innerWidth, h: window.innerHeight });
  });
}

// 平滑滚动到指定元素
export function smoothScrollTo(elSelector: string) {
  const element = document.querySelector(elSelector) as HTMLElement;
  if (element) {
    element.scrollIntoView({ behavior: "smooth" });
  }
}

// 复制文本到剪贴板
export function copyToClipboard(text: string) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text);
  } else {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }
}
