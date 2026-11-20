/**
 * 对象操作工具 — 属性排除与挑选
 */

/**
 * 排除对象中的指定属性，返回浅拷贝
 *
 * @param data  源对象
 * @param props 要排除的属性名列表
 *
 * @example
 *   omitData({ a: 1, b: 2, c: 3 }, 'b', 'c') // => { a: 1 }
 */
export const omitData = <T extends Record<string, any>, K extends keyof T>(
  data: T,
  ...props: K[]
): Omit<T, K> => {
  if (!data) {
    return {} as Omit<T, K>;
  }
  const clone = { ...data };
  props.forEach((key) => delete clone[key]);
  return clone;
};

/**
 * 挑选对象中的指定属性，返回新对象
 *
 * @param data  源对象
 * @param keys  要挑选的属性名列表
 *
 * @example
 *   pickData({ a: 1, b: 2, c: 3 }, 'a', 'c') // => { a: 1, c: 3 }
 */
export const pickData = <T extends Record<string, any>, K extends keyof T>(
  data: T,
  ...keys: K[]
): Pick<T, K> => {
  if (!data) {
    return {} as Pick<T, K>;
  }
  return keys.reduce(
    (obj, key) => {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        obj[key] = data[key];
      }
      return obj;
    },
    {} as Pick<T, K>,
  );
};
