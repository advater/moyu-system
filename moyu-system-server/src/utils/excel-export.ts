import ExcelJS from 'exceljs';

export type ExcelColumn = {
  header: string;
  key: string;
  width?: number;
};

export type ExcelExportResult = {
  filename: string;
  buffer: Buffer;
  contentType: string;
};

/** 导出上限，防止 OOM */
export const EXCEL_MAX_ROWS = 10_000;

/**
 * 将行列数据构建为 xlsx Buffer
 */
export async function buildExcelExport(options: {
  sheetName: string;
  filename: string;
  columns: ExcelColumn[];
  rows: Record<string, unknown>[];
}): Promise<ExcelExportResult> {
  const rows = options.rows.slice(0, EXCEL_MAX_ROWS);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'moyu-system-server';
  workbook.created = new Date();
  const sheet = workbook.addWorksheet(options.sheetName);
  sheet.columns = options.columns.map((col) => ({
    header: col.header,
    key: col.key,
    width: col.width ?? 16,
  }));
  for (const row of rows) {
    sheet.addRow(row);
  }
  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return {
    filename: options.filename.endsWith('.xlsx')
      ? options.filename
      : `${options.filename}.xlsx`,
    buffer: Buffer.from(arrayBuffer),
    contentType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
}
/** 把 Excel 单元格值转成纯文本，避免对象被 stringify 成 [object Object] */
export function excelCellToString(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : '';
  }
  if (typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }
  if (value instanceof Date) return value.toISOString();
  if (typeof value !== 'object') return '';

  const cell = value as {
    text?: unknown;
    result?: unknown;
    richText?: unknown;
    error?: unknown;
  };
  if (Array.isArray(cell.richText)) {
    return cell.richText
      .map((part) =>
        part && typeof part === 'object' && 'text' in part
          ? excelCellToString((part as { text?: unknown }).text)
          : '',
      )
      .join('');
  }
  if ('result' in cell && cell.result !== undefined) {
    return excelCellToString(cell.result);
  }
  if (typeof cell.text === 'string') {
    return cell.text;
  }
  return '';
}
