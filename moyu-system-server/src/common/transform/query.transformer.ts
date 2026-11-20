import { Transform } from 'class-transformer';
import { toIntArray } from '@/utils/to-positive-int';

/**
 * 查询参数空串 / null → undefined，配合 @IsOptional 使用。
 * 前端常传 `?userId=&clientId=`，若不转换会触发 @IsNumber / @IsString 失败。
 */
export function EmptyToUndefined() {
  return Transform(({ value }) => {
    if (value === '' || value === null) return undefined;
    return value;
  });
}

/**
 * 可选数字查询参数：空串跳过，其余转 Number。
 * 避免 `@Type(() => Number)` 把 `""` 转成 `0`。
 */
export function ToOptionalNumber() {
  return Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined;
    const n = Number(value);
    return Number.isFinite(n) ? n : value;
  });
}

/**
 * JSON / MySQL tinyint 常把布尔做成 0/1。enableImplicitConversion 对可选 boolean
 * 不一定按 Boolean 转换，导致 @IsBoolean 在 update 上回 400。
 */
export function ToBoolean() {
  return Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (value === true || value === 1 || value === '1' || value === 'true') {
      return true;
    }
    if (value === false || value === 0 || value === '0' || value === 'false') {
      return false;
    }
    return value;
  });
}

/** Query `ids=1,2` / `ids=1` → number[]，避免 Prisma `in` 接到字符串。 */
export function ToIntArray() {
  return Transform(({ value }) => toIntArray(value));
}
