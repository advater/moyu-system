import { unlink } from 'node:fs/promises';

/** 安全删除文件，失败时不抛异常 */
export async function safeUnlink(filePath: string): Promise<void> {
  try {
    await unlink(filePath);
  } catch {
    /* 文件清理失败不影响主流程 */
  }
}
