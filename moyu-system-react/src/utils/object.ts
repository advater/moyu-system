export const omitData = function <
  T extends Record<string, any>,
  K extends keyof T,
>(data: T, ...props: K[]): Omit<T, K> {
  if (!data) {
    return {} as Omit<T, K>;
  }
  const clone = { ...data };
  props.forEach((key) => {
    if (key in clone) delete clone[key];
  });
  return clone as Omit<T, K>;
};
