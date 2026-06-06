import type { ExcelFormatDefinition, ExcelFormatId } from '../constants/excelFormats';
import { EXCEL_FORMATS } from '../constants/excelFormats';

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function clearSheetFromRow(sheet: Record<string, unknown>, clearFromRow: number) {
  const cellAddresses = Object.keys(sheet).filter((address) => !address.startsWith('!'));
  for (const address of cellAddresses) {
    const match = address.match(/^([A-Z]+)(\d+)$/);
    if (!match) continue;
    const row = Number(match[2]);
    if (row >= clearFromRow) {
      delete sheet[address];
    }
  }
}

async function prepareWorkbook(definition: ExcelFormatDefinition) {
  const response = await fetch(definition.assetPath);
  if (!response.ok) {
    throw new Error(`No se encontró la plantilla (${response.status})`);
  }

  const XLSX = await import('xlsx');
  const buffer = await response.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  if (definition.sheets?.length) {
    for (const sheetConfig of definition.sheets) {
      const sheetName = sheetConfig.name ?? workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) continue;
      clearSheetFromRow(sheet as Record<string, unknown>, sheetConfig.clearFromRow);
    }
  }

  return { XLSX, workbook };
}

export async function downloadExcelFormat(formatId: ExcelFormatId): Promise<void> {
  const definition = EXCEL_FORMATS[formatId];
  const { XLSX, workbook } = await prepareWorkbook(definition);
  const output = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([output], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  triggerBlobDownload(blob, definition.downloadName);
}
