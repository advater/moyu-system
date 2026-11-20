import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { AreaNodeResDTO } from './dto/AreaNodeRes.dto';

/** 静态地区数据节点（与 static/area.json 结构一致） */
interface AreaRawNode {
  id: number;
  pid: number;
  name: string;
  level: number;
}

type Ip2RegionResult = {
  country?: string;
  province?: string;
  city?: string;
  isp?: string;
} | null;

/**
 * IP 区域管理 Service
 *
 * - getAreaTree：基于 static/area.json 组装省/市/区三级地区树
 * - getAreaByIp：本机/内网快速判断；公网走 ip2region 库
 */
@Injectable()
export class IpService implements OnModuleInit {
  private readonly logger = new Logger(IpService.name);
  private areaTreeCache: AreaNodeResDTO[] | null = null;
  private ipSearcher: { search: (ip: string) => Ip2RegionResult } | null =
    null;

  onModuleInit() {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require('ip2region') as {
        default?: new (opts?: object) => {
          search: (ip: string) => Ip2RegionResult;
        };
      };
      const IP2Region = mod.default ?? (mod as unknown as new (opts?: object) => {
        search: (ip: string) => Ip2RegionResult;
      });
      this.ipSearcher = new IP2Region({
        disableIpv6: process.env.IP2REGION_DISABLE_IPV6 === 'true',
      });
      this.logger.log('ip2region 已加载');
    } catch (err) {
      this.logger.warn(
        `ip2region 加载失败，公网 IP 归属不可用: ${(err as Error).message}`,
      );
    }
  }

  async getAreaTree(): Promise<AreaNodeResDTO[]> {
    if (this.areaTreeCache) {
      return this.areaTreeCache;
    }
    const list = await this.loadAreas();
    const nodeMap = new Map<number, AreaNodeResDTO>();
    list.forEach((item) => {
      nodeMap.set(item.id, { id: item.id, name: item.name, children: [] });
    });
    const roots: AreaNodeResDTO[] = [];
    list.forEach((item) => {
      const node = nodeMap.get(item.id)!;
      if (item.pid === 0) {
        roots.push(node);
      } else {
        const parent = nodeMap.get(item.pid);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(node);
        } else {
          roots.push(node);
        }
      }
    });
    this.areaTreeCache = roots;
    return roots;
  }

  /**
   * 根据 IP 查询所在地区名称（省市区简写）
   */
  getAreaByIp(ip: string): string {
    const clean = this.normalizeIp(ip);
    if (!clean) {
      return '';
    }
    if (clean.includes(':')) {
      if (clean === '::1' || clean === '0:0:0:0:0:0:0:1') {
        return '本地';
      }
      return this.formatIp2Region(this.ipSearcher?.search(clean) ?? null);
    }
    const parts = clean.split('.');
    if (parts.length !== 4 || parts.some((p) => !/^\d{1,3}$/.test(p))) {
      return '';
    }
    const nums = parts.map(Number);
    if (nums.some((n) => n < 0 || n > 255)) {
      return '';
    }
    const [a, b] = nums;
    if (a === 127) {
      return '本地';
    }
    if (
      a === 10 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168)
    ) {
      return '内网';
    }
    return this.formatIp2Region(this.ipSearcher?.search(clean) ?? null);
  }

  /** 去掉 IPv4-mapped IPv6 前缀等 */
  private normalizeIp(ip: string): string {
    let clean = (ip || '').trim();
    if (clean.startsWith('::ffff:')) {
      clean = clean.slice(7);
    }
    // X-Forwarded-For 可能带端口
    if (clean.includes(',') ) {
      clean = clean.split(',')[0].trim();
    }
    return clean;
  }

  private formatIp2Region(res: Ip2RegionResult): string {
    if (!res) return '';
    const parts = [res.country, res.province, res.city]
      .map((s) => (s || '').trim())
      .filter((s) => s && s !== '0');
    // 去重相邻相同段（如 中国 中国）
    const uniq: string[] = [];
    for (const p of parts) {
      if (uniq[uniq.length - 1] !== p) uniq.push(p);
    }
    const region = uniq.join(' ');
    const isp = (res.isp || '').trim();
    if (region && isp && isp !== '0') {
      return `${region} ${isp}`.slice(0, 128);
    }
    return region.slice(0, 128);
  }

  private async loadAreas(): Promise<AreaRawNode[]> {
    try {
      const file = join(__dirname, '..', '..', '..', 'static', 'area.json');
      const raw = await readFile(file, 'utf-8');
      return JSON.parse(raw) as AreaRawNode[];
    } catch (err) {
      this.logger.warn(`读取地区数据失败: ${(err as Error).message}`);
      return [];
    }
  }
}
