import {
  asError,
  ERROR_LOG_WRITTEN_KEY,
  httpStatusOf,
  persistApiErrorLog,
} from './persist-api-error-log';

describe('persist-api-error-log', () => {
  it('httpStatusOf reads HttpException-like getStatus', () => {
    expect(httpStatusOf({ getStatus: () => 503 })).toBe(503);
    expect(httpStatusOf({ status: 400 })).toBe(400);
    expect(httpStatusOf('boom')).toBe(500);
  });

  it('asError wraps non-Error values', () => {
    expect(asError(new Error('x')).message).toBe('x');
    expect(asError('y').message).toBe('y');
  });

  it('persistApiErrorLog writes once per request', async () => {
    const created: unknown[] = [];
    const service = {
      createQuiet: async (data: unknown) => {
        created.push(data);
      },
    };
    const req: Record<string, unknown> = { method: 'GET', url: '/x' };
    persistApiErrorLog(service as never, req, new Error('fail'));
    persistApiErrorLog(service as never, req, new Error('fail-again'));
    await Promise.resolve();
    expect(req[ERROR_LOG_WRITTEN_KEY]).toBe(true);
    expect(created).toHaveLength(1);
    expect((created[0] as { exceptionMessage: string }).exceptionMessage).toBe(
      'fail',
    );
  });
});
