/**
 * 雪花算法 ID 生成器
 */
export class SnowFlake {
  /** 纪元时间戳（2025-01-01 00:00:00 UTC），用于计算相对时间 */
  epoch = BigInt(1735660800000);

  /** 数据中心 ID 占用位数 */
  dataCenterIdBits = 5;
  /** 机器 ID 占用位数 */
  workerIdBits = 5;
  /** 自增序列号占用位数 */
  sequenceBits = 12;

  /** 数据中心 ID 最大值 = 2^5 - 1 = 31 */
  maxDataCenterId = (BigInt(1) << BigInt(this.workerIdBits)) - BigInt(1);
  /** 机器 ID 最大值 = 2^5 - 1 = 31 */
  maxWorkerId = (BigInt(1) << BigInt(this.workerIdBits)) - BigInt(1);

  /** 时间戳左移位数 = dataCenterIdBits + workerIdBits + sequenceBits */
  timestampShift = BigInt(
    this.dataCenterIdBits + this.workerIdBits + this.sequenceBits,
  );
  /** 数据中心 ID 左移位数 */
  dataCenterIdShift = BigInt(this.workerIdBits + this.sequenceBits);
  /** 机器 ID 左移位数 */
  workerIdShift = BigInt(this.sequenceBits);
  /** 序列号掩码 = 2^12 - 1 = 4095 */
  sequenceMask = (BigInt(1) << BigInt(this.sequenceBits)) - BigInt(1);
  /** 上次生成 ID 的时间戳（用于检测时钟回拨和同毫秒序列递增） */
  lastTimestamp = BigInt(-1);
  /** 数据中心 ID */
  dataCenterId = BigInt(0);
  /** 机器 ID */
  workerId = BigInt(0);
  /** 当前毫秒内的序列号 */
  sequence = BigInt(0);

  /**
   * @param dataCenterId 数据中心 ID（0-31）
   * @param workerId     机器 ID（0-31）
   */
  constructor(dataCenterId: number, workerId: number) {
    // 校验数据中心 ID 和工作节点 ID 的范围
    if (dataCenterId > this.maxDataCenterId || dataCenterId < 0) {
      throw new Error(
        `Data center ID must be between 0 and ${this.maxDataCenterId}`,
      );
    }

    if (workerId > this.maxWorkerId || workerId < 0) {
      throw new Error(`Worker ID must be between 0 and ${this.maxWorkerId}`);
    }

    this.dataCenterId = BigInt(dataCenterId);
    this.workerId = BigInt(workerId);
  }

  /**
   * 生成下一个唯一 ID
   *
   * 逻辑：
   * 1. 检测时钟回拨，若发现则抛出异常
   * 2. 同一毫秒内递增序列号（防冲突）
   * 3. 序列号溢出时等待下一毫秒
   * 4. 不同毫秒重置序列号
   * 5. 按位组合时间戳 + 数据中心ID + 机器ID + 序列号
   */
  nextId() {
    let timestamp = BigInt(Date.now());
    // 如果上一次生成id的时间戳比下一次生成的还大，说明服务器时间有问题，出现了回退，这时候再生成id，可能会生成重复的id，所以直接抛出异常。
    if (timestamp < this.lastTimestamp) {
      // 时钟回拨，抛出异常并拒绝生成 ID
      throw new Error('Clock moved backwards. Refusing to generate ID.');
    }

    // 如果当前时间戳和上一次的时间戳相等，序列号加一
    if (timestamp === this.lastTimestamp) {
      // 同一毫秒内生成多个 ID，递增序列号，防止冲突
      this.sequence = (this.sequence + BigInt(1)) & this.sequenceMask;
      if (this.sequence === BigInt(0)) {
        // 序列号溢出，等待下一毫秒
        timestamp = this.waitNextMillis(this.lastTimestamp);
      }
    } else {
      // 不同毫秒，重置序列号
      this.sequence = BigInt(0);
    }

    this.lastTimestamp = timestamp;

    // 组合各部分生成最终的 ID，可以理解为把64位二进制转换位十进制数字
    const id =
      ((timestamp - this.epoch) << this.timestampShift) |
      (this.dataCenterId << this.dataCenterIdShift) |
      (this.workerId << this.workerIdShift) |
      this.sequence;

    return id.toString();
  }

  /** 等待直到当前时间超过上次记录的时间戳（自旋等待） */
  waitNextMillis(lastTimestamp) {
    let timestamp = BigInt(Date.now());
    while (timestamp <= lastTimestamp) {
      // 主动等待，直到当前时间超过上次记录的时间戳
      timestamp = BigInt(Date.now());
    }
    return timestamp;
  }
}
