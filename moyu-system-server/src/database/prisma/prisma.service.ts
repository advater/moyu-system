import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@/generated/prisma/client';
import {
  TenantContext,
  TENANT_SCOPED_MODELS,
} from '@/common/tenant/tenant.context';

/**
 * 无软删字段（deletedAt）的模型：扩展层不得注入 deletedAt 条件。
 * 与 schema 对齐：SysJobLog / SysApiAccessLog / SysApiErrorLog。
 */
const NO_SOFT_DELETE_MODELS = new Set([
  'SysJobLog',
  'SysApiAccessLog',
  'SysApiErrorLog',
]);

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const adapter = new PrismaMariaDb(process.env.DATABASE_URL ?? '');
    super({ adapter });

    const client = this;

    const extended = this.$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            const a = (args ?? {}) as Record<string, any>;
            if (typeof model !== 'string' || model.length === 0) {
              return query(args);
            }

            // 软删除：读 / 批量写默认排除已删（仅对含 deletedAt 的模型）
            if (
              [
                'findFirst',
                'findFirstOrThrow',
                'findUnique',
                'findUniqueOrThrow',
                'findMany',
                'count',
                'aggregate',
                'groupBy',
                'updateMany',
                'deleteMany',
              ].includes(operation)
            ) {
              applySoftDelete(model, a);
            }

            const applyTenant = shouldApplyTenant(model);
            assertTenantWriteContext(model, operation);

            // findUnique* 不能把 tenantId 塞进唯一 where → 转为 findFirst*
            if (
              applyTenant &&
              (operation === 'findUnique' || operation === 'findUniqueOrThrow')
            ) {
              const tenantId = TenantContext.getTenantId()!;
              const delegate = (client as any)[toDelegate(model)];
              const method =
                operation === 'findUniqueOrThrow'
                  ? 'findFirstOrThrow'
                  : 'findFirst';
              return delegate[method]({
                ...a,
                where: mergeWhere(a.where, {
                  tenantId,
                  ...softDeleteExtra(model),
                }),
              });
            }

            if (applyTenant) {
              const tenantId = TenantContext.getTenantId()!;

              if (
                [
                  'findFirst',
                  'findFirstOrThrow',
                  'findMany',
                  'count',
                  'aggregate',
                  'groupBy',
                  'updateMany',
                  'deleteMany',
                ].includes(operation)
              ) {
                a.where = mergeWhere(a.where, { tenantId });
              }

              if (operation === 'create' && a.data) {
                a.data.tenantId = tenantId;
              }

              if (operation === 'createMany' && a.data) {
                if (Array.isArray(a.data)) {
                  a.data = a.data.map((row: Record<string, unknown>) => ({
                    ...row,
                    tenantId,
                  }));
                } else {
                  a.data.tenantId = tenantId;
                }
              }

              if (operation === 'upsert' && a.create) {
                a.create.tenantId = tenantId;
              }

              // update/delete：唯一 where 无法加 tenantId，先校验归属再执行
              if (operation === 'update' || operation === 'delete') {
                const delegate = (client as any)[toDelegate(model)];
                const existing = await delegate.findFirst({
                  where: mergeWhere(a.where, {
                    tenantId,
                    ...softDeleteExtra(model),
                  }),
                  select: { id: true },
                });
                if (!existing) {
                  throw Object.assign(
                    new Error(
                      operation === 'update'
                        ? 'Record to update not found.'
                        : 'Record to delete does not exist.',
                    ),
                    { code: 'P2025' },
                  );
                }
              }
            }

            return query(a);
          },
        },
      },
    });

    Object.assign(this, extended);
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

function shouldApplyTenant(model: string | undefined): boolean {
  if (!model || !TENANT_SCOPED_MODELS.has(model)) return false;
  if (TenantContext.isIgnored()) return false;
  return !!TenantContext.getTenantId();
}

/** 租户表写操作：无 ignore 且无租户上下文时拒绝（禁止静默写入错误租户） */
function assertTenantWriteContext(
  model: string | undefined,
  operation: string,
): void {
  if (!model || !TENANT_SCOPED_MODELS.has(model)) return;
  if (TenantContext.isIgnored()) return;
  const writeOps = new Set([
    'create',
    'createMany',
    'upsert',
    'update',
    'updateMany',
    'delete',
    'deleteMany',
  ]);
  if (!writeOps.has(operation)) return;
  if (!TenantContext.getTenantId()) {
    throw new Error(
      `租户隔离写入缺少租户上下文: ${model}.${operation}`,
    );
  }
}

function hasSoftDelete(model: string | undefined): boolean {
  return !!model && !NO_SOFT_DELETE_MODELS.has(model);
}

function softDeleteExtra(
  model: string | undefined,
): Record<string, unknown> {
  return hasSoftDelete(model) ? { deletedAt: null } : {};
}

function applySoftDelete(
  model: string | undefined,
  args: { where?: Record<string, unknown> },
) {
  if (!hasSoftDelete(model)) return;
  if (!args.where) args.where = {};
  if (!Object.prototype.hasOwnProperty.call(args.where, 'deletedAt')) {
    args.where.deletedAt = null;
  }
}

function mergeWhere(
  where: Record<string, unknown> | undefined,
  extra: Record<string, unknown>,
): Record<string, unknown> {
  if (!where || Object.keys(where).length === 0) {
    return { ...extra };
  }
  return { AND: [where, extra] };
}

function toDelegate(model: string): string {
  return model.charAt(0).toLowerCase() + model.slice(1);
}
