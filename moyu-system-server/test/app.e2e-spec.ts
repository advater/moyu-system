/**
 * Jest e2e 占位：Nest 12 ESM 无法在 Jest 29 CJS 下 `createTestingModule(AppModule)`。
 *
 * 真实 HTTP 契约（租户隔离 / dataScope / 401·403 / 强制下线 / 删部门 / 会话与改密）
 * 由独立 runner 覆盖：`npm run test:e2e` → `test/http-contract/http-contract.test.ts`
 */
describe('App e2e placeholder', () => {
  it('defers HTTP contracts to test/http-contract (npm run test:e2e)', () => {
    expect(true).toBe(true);
  });
});
