/**
 * 函数防抖  在一段时间间隔内没有再次调用时，才会执行
 * @param {Function} fn 防抖的函数
 * @param {number} delay 延迟的时间
 * @param {boolean} immediate 是否立即执行
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay = 300,
  immediate = false,
): (...args: any[]) => T | undefined {
  // 定时器
  let timer: ReturnType<typeof setTimeout> | null = null;
  // 函数执行结果
  let result: T | undefined;
  return function (this: any, ...args: any[]): T | undefined {
    if (timer) {
      clearTimeout(timer); // 清除上一次的定时器
    }
    if (immediate) {
      // 是否立即执行函数的标志
      const callNow = !timer; // 检查当前是否是第一次调用
      timer = setTimeout(() => {
        timer = null; // 清空定时器
      }, delay);
      // 立即执行函数
      if (callNow) {
        result = fn.apply(this, args); // 立即执行函数
      }
    } else {
      // 延迟执行
      timer = setTimeout(() => {
        result = fn.apply(this, args); // 执行函数
      }, delay);
    }
    return result; // 返回函数执行结果
  };
}

/**
 * 节流函数 控制函数执行频率 确保函数在一定时间内只执行一次
 * @param {Function} fn 节流的函数
 * @param {number} wait 等待的时间
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  wait = 300,
): (...args: any[]) => T | void {
  // 定时器
  let timer: ReturnType<typeof setTimeout> | null = null;
  // 上一次执行时间
  let lastTime: number = 0;
  // 函数执行结果
  let result: T | undefined;

  return function (this: any, ...args: any[]): T | void {
    const now = Date.now(); // 当前时间
    const remaining = wait - (now - lastTime); // 计算剩余时间

    if (remaining <= 0) {
      // 不处于节流状态
      if (timer) {
        clearTimeout(timer); // 清除上一个定时器
        timer = null; // 清空定时器
      }
      result = fn.apply(this, args); // 执行函数
      lastTime = now; // 更新上一次执行时间
      return result;
    } else if (!timer) {
      // 如果处于节流状态且没有定时器
      timer = setTimeout(() => {
        result = fn.apply(this, args); // 执行函数
        lastTime = Date.now(); // 更新上一次执行时间
        timer = null; // 清空定时器
      }, remaining); // 使用剩余时间
    }
  };
}

/**
 * 图片懒加载
 */
export function lazyImages() {
  // 使用 IntersectionObserver 如果浏览器支持
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const realSrc = img.dataset.src;
            if (realSrc) {
              img.src = realSrc;
              img.dataset.src = "";
              observer.unobserve(img);
            }
          }
        });
      },
      { rootMargin: "200px" }, // 扩大检测区域
    );
    const images = document.querySelectorAll("img[data-src]");
    images.forEach((img) => {
      observer.observe(img);
    });
  } else {
    function handleLazyLoad(): void {
      const images =
        document.querySelectorAll<HTMLImageElement>("img[data-src]");
      for (const img of images) {
        const realSrc = img.dataset.src;
        if (realSrc && isVisible(img)) {
          img.src = realSrc;
          img.dataset.src = "";
        }
      }
    }
    function isVisible(el: HTMLElement): boolean {
      const position = el.getBoundingClientRect();

      // 顶部、底部边缘可见
      const windowHeight = document.documentElement.clientHeight;
      const topVisible = position.top > 0 && position.top < windowHeight;
      const bottomVisible =
        position.bottom < windowHeight && position.bottom > 0;

      // 左侧、右侧边缘可见
      const windowWidth = document.documentElement.clientWidth;
      const leftVisible = position.left > 0 && position.left < windowWidth;
      const rightVisible = position.right < windowWidth && position.right > 0;

      return topVisible && bottomVisible && leftVisible && rightVisible;
    }
    let scrollTimeout: ReturnType<typeof setTimeout>;
    function onScroll(): void {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(handleLazyLoad, 100);
    }
    (window as Window).addEventListener("load", handleLazyLoad);
    (window as Window).addEventListener("scroll", onScroll);
    (window as Window).addEventListener("resize", onScroll);
  }
}

/**
 * resize 函数
 */
export function onResize() {
  const map = new WeakMap();
  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const handler = map.get(entry.target);
      if (handler) {
        handler(entry);
      }
    }
  });
  const handleSizeChange = (target: any, cb: any) => {
    resizeObserver.observe(target);
    map.set(target, cb);
  };
  const stopObserve = (target: any) => {
    resizeObserver.unobserve(target);
    map.delete(target);
  };
  return {
    handleSizeChange,
    stopObserve,
  };
}

/**
 * 缓存memoize函数
 * func 需要进行cache的函数
 * resolver 可选函数,设置cache的key
 * return memoized函数
 */
export function memoize<T, R>(
  func: (...args: any[]) => T,
  resolver?: (...args: any[]) => R,
) {
  // 定义memoized的函数
  const memoized = function (this: any, ...args: any[]) {
    // 计算缓存的key
    const key = resolver
      ? resolver.apply(this, args)
      : JSON.stringify(args) || args[0];
    // 检查cache是否已经存在key
    if (memoized.cache.has(key)) {
      // 返回缓存的结果
      return memoized.cache.get(key);
    }
    // 则调用原始函数并获取结果
    const result = func.apply(this, args);
    // 将结果存储到cache
    memoized.cache.set(key, result);
    return result;
  };
  // 初始化cache
  memoized.cache = new Map();

  // 清空缓存的方法
  memoized.clear = () => {
    memoized.cache.clear();
  };

  // 返回新的memoized
  return memoized;
}
