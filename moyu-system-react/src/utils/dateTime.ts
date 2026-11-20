/**
 * 时间相关函数
 */

// 时间格式转化
// 2014-12-03T03:01:00.000Z => 2014-12-03 03:01:00   或时间戳=> 2014-12-03 03:01:00
export const formatDateTime = function (dateTime: string | number) {
  if (!dateTime) {
    return dateTime;
  }

  // 创建日期对象
  const date = new Date(dateTime);

  // 返回无效的原始输入
  if (isNaN(date.getTime())) {
    return dateTime;
  }

  // 使用UTC方法获取各个时间部分
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

/** 本地时区日期时间（列表展示） */
export function formatLocalDateTime(dateTime?: string | number | Date | null) {
  if (dateTime == null || dateTime === "") return "-";
  const date = new Date(dateTime);
  if (isNaN(date.getTime())) return String(dateTime);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

// 时间格式转化,type='date','month' 'year'
// 2014-12-03T03:01:00.000Z => 2014-12-03
export const formatDate = function (dateTime: string, type = "date") {
  const date = new Date(dateTime);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  if (type === "year") {
    return year;
  } else if (type === "month") {
    return year + "-" + month;
  } else if (type === "date") {
    return year + "-" + month + "-" + day;
  } else {
    return year + "-" + month + "-" + day;
  }
};

// 获取某个日期在当前年第几天
export const getDayOfYear = function (dateTime: string) {
  const date = new Date(dateTime);
  if (isNaN(date.getTime())) {
    throw new Error("Invalid date string");
  }
  // 使用当年的1月1日作为起始点
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const diffTime = date.getTime() - startOfYear.getTime();
  // 将差值转换为天数并加1（1月1日为第1天）
  return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

// 获取某个日期在当前年第几周
export const getWeek = function (dateTime: string) {
  const date = new Date(dateTime);
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  // 判断是否为闰年，针对2月的天数进行计算
  if ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) {
    days[1] = 29;
  } else {
    days[1] = 28;
  }

  let totalDays = 0;
  for (let count = 0; count < month; count++) {
    totalDays += days[count];
  }
  totalDays += day;
  // 得到第几周
  return Math.ceil(totalDays / 7);
};

// 获取当前月的第一天和最后一天
export const getMonthStartEnd = function () {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth();
  const days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  const day = days[month];
  const start =
    year + "/" + String(month + 1).padStart(2, "0") + "/01" + " 00:00:01";
  const end =
    year + "/" + String(month + 1).padStart(2, "0") + "/" + day + " 23:59:59";
  return {
    start,
    end,
  };
};
