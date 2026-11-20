// 订阅发布者 (事件总线)
class EventBus {
  private events: Record<string, Array<(...args: any[]) => void>>;
  constructor() {
    this.events = {}; // 订阅者列表
  }
  // 订阅事件
  on(eventName: string, callback: (...args: any[]) => void) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);
  }
  // 发布事件
  emit(eventName: string, ...args: any[]) {
    this.events[eventName]?.forEach((item) => {
      item.apply(this, args);
    });
  }
  // 移除订阅
  off(eventName: string, callback: (...args: any[]) => void) {
    if (!this.events[eventName]) return;
    this.events[eventName] = this.events[eventName].filter(
      (item) => item !== callback,
    );
  }
  // 执行一次
  once(eventName: string, callback: (...args: any[]) => void) {
    const onceCallback = (...args: any[]) => {
      callback.apply(this, args);
      // 执行后移除
      this.off(eventName, onceCallback);
    };
    // 订阅
    this.on(eventName, onceCallback);
  }
}

// 实例化事件总线
export const bus = new EventBus();

// // 示例：订阅消息
// bus.on('post', (...args) => {
//   console.log('1111---',args)
// })

// // 示例：发布消息
// bus.emit('post', 'Hello, buss!')
// bus.emit('post', 'Hello, buss1111!')
// bus.emit('post',2222,3333, 'Hello, buss22222!')
