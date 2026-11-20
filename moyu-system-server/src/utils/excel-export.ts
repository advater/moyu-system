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
