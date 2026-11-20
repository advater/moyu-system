// 常用的检验方法
const validation: Record<string, (str: string) => boolean> = {};

// 校验是否为空
validation.checkNull = (str: any) => {
  if (str == null || str == undefined) {
    return true;
  }
  return str.trim() ? true : false;
};

// 国内手机号（严格11位）
validation.checkPhone = (str: string) => {
  const reg = /^(0|86|17951)?(1[3-9][0-9])\d{8}$/;
  return reg.test(str);
};

// 用户名（字母开头，5-16位））
validation.checkUserName = (str: string) => {
  const reg = /^[A-Za-z][A-Za-z0-9_]{4,15}$/;
  return reg.test(str);
};

// 邮箱地址
validation.checkEmail = (str: string) => {
  const reg = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return reg.test(str);
};

// 密码（6-18位，允许特定符号）
validation.checkPwd = (str: string) => {
  const reg = /^[A-Za-z0-9.@!$%*#]{6,18}$/;
  return reg.test(str);
};

// 密码必须包含字母和数字
validation.checkPwdVol = (str: string) => {
  const reg = /^(?=.*[A-Za-z])(?=.*\d).+$/;
  return reg.test(str);
};

// 密码强度（大小写+数字+特殊字符）
validation.checkPwdVol = (str: string) => {
  const reg = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[$@_,.])[\w$@,.]{6,12}$/;
  return reg.test(str);
};

// 国内电话（支持分机）
validation.checkTel = (str: string) => {
  const reg = /^(0\d{2,3}-)?[1-9]\d{4,7}(-\d{1,4})?$/;
  return reg.test(str);
};

// 真实姓名（中/英文）
validation.checkRealName = (str: string) => {
  const reg = /^(?:[\u4E00-\u9FA5\uF900-\uFA2D]{2,18}|[A-Za-z]{2,20})$/;
  return reg.test(str);
};

// 邮编（6位数字）
validation.checkPostCode = (str: string) => {
  return /^[1-9]\d{5}$/.test(str);
};

// URL（基础校验）
validation.checkURL = (str: string) => {
  const reg =
    /^(?:(https?|ftp):\/\/)?(?:www\.)?[A-Za-z0-9-]+(\.[A-Za-z]{2,})+(?:\/[\w-./?%&=]*)?$/;
  return reg.test(str);
};

// 验证IP
validation.checkIP = (str: string) => {
  const reg =
    /^(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)$/;
  return reg.test(str);
};

// 验证是HTML标签
validation.checkHTML = (str: string) => {
  const reg = /^<([a-z]+)([^>]+)*(?:>(.*)<\/\1>|\s+\/>)$/gim;
  return reg.test(str);
};

// 16进制颜色（#开头可选）
validation.check16 = (str: string) => {
  const reg = /^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
  return reg.test(str);
};

// 只能是半角字符 (包括空格)
validation.checkHalf = (str: string) => {
  return /^[\x20-\x7E]*$/.test(str);
};

// 中文、英文、数字、下划线
validation.checkName = (str: string) => {
  return /^[\u4E00-\u9FA5A-Za-z0-9_]+$/.test(str);
};

// 中文2-10位
validation.checkCnName = (str: string) => {
  return /[\u4e00-\u9fa5]{2,10}$/.test(str);
};

// 检测特殊字符
validation.checkCnSpecial = (str: string) => {
  const reg = /[~！￥（）——{}|【】、：；”“‘’《》？，。/`!@#$%^&*……<>]/g;
  return reg.test(str);
};

// 英文4-20位
validation.checkEnName = (str: string) => {
  return /[A-Za-z]{4,20}$/.test(str);
};

// 英文或数字（至少1位）
validation.checkEnNum = (str: string) => {
  return /[A-Za-z0-9]*$/.test(str);
};

// 编码：数字、字母、下划线（1-20位）
validation.checkCode = (str: string) => {
  return /^[A-Za-z0-9]{1,20}$/.test(str);
};

// 目录编码：数字、字母、._+-（1-100位）
validation.checkDirCode = (str: string) => {
  return /^([A-Za-z0-9._+-]){1,100}$/.test(str);
};

// 整数（包括负数）
validation.checkInt = (str: string) => {
  return Number.isInteger(str);
};

// 非负整数
validation.checkPositiveInt = (str: string) => {
  return /^\d+$/.test(str);
};

// 小数或整数（1-8位整数，可选1-2位小数）
validation.checkNumber = (str: string) => {
  return /^-?\d{1,8}(\.\d{1,2})?$/.test(str);
};

// 非负数（整数或小数）
validation.checkNonnegative = (str: string) => {
  return /^\d+(\.\d+)?$/.test(str);
};

// 验证身份证号码
validation.checkIDCard = (str: string) => {
  const reg =
    /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/;
  // 检查号码长度，格式
  if (!reg.test(str)) {
    return false;
  }
  // 校验省份
  const cityMap: Record<string, string> = {
    "11": "北京",
    "12": "天津",
    "13": "河北",
    "14": "山西",
    "15": "内蒙古",
    "21": "辽宁",
    "22": "吉林",
    "23": "黑龙江",
    "31": "上海",
    "32": "江苏",
    "33": "浙江",
    "34": "安徽",
    "35": "福建",
    "36": "江西",
    "37": "山东",
    "41": "河南",
    "42": "湖北",
    "43": "湖南",
    "44": "广东",
    "45": "广西",
    "46": "海南",
    "50": "重庆",
    "51": "四川",
    "52": "贵州",
    "53": "云南",
    "54": "西藏",
    "61": "陕西",
    "62": "甘肃",
    "63": "青海",
    "64": "宁夏",
    "65": "新疆",
    "71": "台湾",
    "81": "香港",
    "82": "澳门",
    "91": "国外",
  };
  const cityCode = str.slice(0, 2);
  if (!cityMap[cityCode]) {
    return false;
  }

  // 检查出生日期是否合法
  const checkBirthday = () => {
    const sBirthday = str.slice(6, 8);
    const year = sBirthday.slice(0, 4);
    const month = sBirthday.slice(4, 2);
    const day = sBirthday.slice(6, 2);
    const birthday = `${year}-${month}-${day}`;
    const d = new Date(birthday.replace(/-/g, "/"));
    return (
      birthday !==
      `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d
        .getDate()
        .toString()
        .padStart(2, "0")}`
    );
  };
  if (checkBirthday()) {
    return false;
  }

  // 校验位计算
  let iSum = 0;
  for (let i = 0; i < 17; i++) {
    iSum += (Math.pow(2, 17 - i) % 11) * parseInt(str.charAt(i), 10);
  }
  const checkDigit = (12 - (iSum % 11)) % 11;
  const expectedCheckDigit = checkDigit === 10 ? "X" : checkDigit.toString();

  if (str.charAt(17).toUpperCase() !== expectedCheckDigit) {
    return false;
  }

  return true; // 通过验证
};

// 工号（4-15位字母数字）
validation.checkJOBID = (str: string) => {
  return /[A-Za-z0-9]{4,15}$/.test(str);
};

// 纳税人识别号
validation.checkTpyNo = (str: string) => {
  return /^[0-9A-Za-z]{15,20}$/.test(str);
};

export default validation;
