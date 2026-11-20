import { NotImplementedException } from '@nestjs/common';

/**
 * 未完成功能统一抛出 501，避免静默成功误导调用方
 */
export function notImplemented(feature: string): never {
  throw new NotImplementedException(`${feature}尚未接入`);
}

/** Excel 导出占位 */
export function excelExportNotReady(moduleName: string): never {
  return notImplemented(`${moduleName} Excel 导出`);
}
