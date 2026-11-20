const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function isHexColor(color: string) {
  return HEX.test(color);
}

export function hexToRGB(hex: string, opacity?: number) {
  let sHex = hex.toLowerCase();
  if (!isHexColor(hex)) return hex;
  if (sHex.length === 4) {
    sHex = `#${sHex[1]}${sHex[1]}${sHex[2]}${sHex[2]}${sHex[3]}${sHex[3]}`;
  }
  const rgb = [1, 3, 5].map((i) => parseInt(sHex.slice(i, i + 2), 16));
  return opacity != null ? `rgba(${rgb.join(",")},${opacity})` : `rgb(${rgb.join(",")})`;
}

export function colorIsDark(color: string) {
  if (!isHexColor(color)) return false;
  const [r, g, b] = hexToRGB(color)
    .replace(/(?:\(|\)|rgb|RGB)*/g, "")
    .split(",")
    .map(Number);
  return r * 0.299 + g * 0.578 + b * 0.114 < 192;
}

function addLight(color: string, amount: number) {
  const c = Math.min(255, parseInt(color, 16) + amount);
  return c.toString(16).padStart(2, "0");
}

export function lighten(color: string, amount: number) {
  const hex = color.replace("#", "");
  const delta = Math.trunc((255 * amount) / 100);
  return `#${addLight(hex.slice(0, 2), delta)}${addLight(hex.slice(2, 4), delta)}${addLight(hex.slice(4, 6), delta)}`;
}

export function mix(color1: string, color2: string, weight = 0.5) {
  let out = "#";
  for (let i = 0; i <= 2; i++) {
    const c1 = parseInt(color1.substring(1 + i * 2, 3 + i * 2), 16);
    const c2 = parseInt(color2.substring(1 + i * 2, 3 + i * 2), 16);
    out += Math.round(c1 * weight + c2 * (1 - weight)).toString(16).padStart(2, "0");
  }
  return out;
}


// 生成随机HEX色值
export const RandomColor = function () {
  return (
    "#" +
    Math.floor(Math.random() * 0xffffff)
      .toString(16)
      .padEnd(6, "0")
  );
};

//将rgb颜色灰度化
export const gray = function (r: number, g: number, b: number) {
  // 确保输入值在0到255之间
  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));

  // 基于光感加权平衡计算灰度值
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};