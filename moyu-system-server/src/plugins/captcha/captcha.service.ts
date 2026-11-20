/**
 * 验证码生成工具
 */
import * as svgCaptcha from 'svg-captcha';

/** 验证码生成配置 */
const options = {
  charPreset: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', // 字符集
  size: 4,           // 验证码长度
  fontSize: 50,      // 字体大小
  width: 100,        // 图像宽度
  height: 32,        // 图像高度
  noise: 2,          // 干扰线数量
  background: '#ffffff', // 背景颜色
  color: true,       // 彩色文字
  rotate: 15,        // 文字倾斜度
  letterSpacing: 0,  // 字符间距
  noiseColor: '#000000', // 噪点颜色
  opacity: 0.1,      // 噪点透明度
  pointSize: 1,      // 噪点大小
  pointStyle: 'circle',  // 噪点样式：'circle' 或 'line'
  pointRadius: 2,    // 噪点半径
  pointPosition: 'random', // 噪点位置
};

/** 生成数学运算验证码（如 1+2=?） */
export function createMath() {
  return svgCaptcha.createMathExpr({
    ...options,
    mathMin: 1,
    mathMax: 50,
    mathOperator: '+',
  });
}

/** 生成文本验证码（随机字符） */
export function createText() {
  return svgCaptcha.create(options);
}