import {
  EXCEL_DATA_CELL_STYLE,
  styleDataRange,
  styleHeaderRow,
} from './excelSheetStyles';

export type ExcelTemplateLayout = {
  assetPath: string;
  downloadName: string;
  sheetName?: string;
  headerRow: number;
  dataStartRow: number;
  minCols?: number;
  /** Actualiza celdas fijas de la plantilla antes de escribir datos. */
  staticCells?: { row: number; col: number; value: string }[];
};

type StyledSheet = Record<string, { t?: string; v?: string | number; s?: object }>;

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

function clearSheetFromRow(sheet: StyledSheet, clearFromRow: number) {
  for (const address of Object.keys(sheet)) {
    if (address.startsWith('!')) continue;
    const match = address.match(/^([A-Z]+)(\d+)$/);
    if (!match) continue;
    if (Number(match[2]) >= clearFromRow) {
      delete sheet[address];
    }
  }
}

export async function fillExcelTemplate(
  layout: ExcelTemplateLayout,
  rows: (string | number)[][],
  downloadName?: string,
): Promise<void> {
  const response = await fetch(layout.assetPath);
  if (!response.ok) {
    throw new Error(`No se encontró la plantilla (${response.status})`);
  }

  const XLSX = await import('xlsx-js-style');
  const workbook = XLSX.read(await response.arrayBuffer(), { type: 'array', cellStyles: true });
  const sheetName = layout.sheetName ?? workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName] as StyledSheet | undefined;
  if (!sheet) {
    throw new Error('La plantilla no contiene la hoja esperada');
  }

  clearSheetFromRow(sheet, layout.dataStartRow);

  for (const cell of layout.staticCells ?? []) {
    const address = XLSX.utils.encode_cell({ r: cell.row - 1, c: cell.col });
    sheet[address] = { t: 's', v: cell.value };
  }

  let maxCol = 0;
  let maxRow = layout.dataStartRow - 1;
  rows.forEach((row, rowIndex) => {
    row.forEach((value, colIndex) => {
      if (value === '' || value === null || value === undefined) return;
      const address = XLSX.utils.encode_cell({ r: layout.dataStartRow - 1 + rowIndex, c: colIndex });
      sheet[address] = {
        t: typeof value === 'number' ? 'n' : 's',
        v: typeof value === 'number' ? value : String(value),
        s: EXCEL_DATA_CELL_STYLE,
      };
      maxCol = Math.max(maxCol, colIndex);
      maxRow = Math.max(maxRow, layout.dataStartRow - 1 + rowIndex);
    });
  });

  const resolvedMaxCol = Math.max(maxCol, layout.minCols ?? 0);
  styleHeaderRow(sheet, layout.headerRow, resolvedMaxCol, XLSX.utils.encode_cell);
  if (rows.length > 0) {
    styleDataRange(
      sheet,
      layout.dataStartRow,
      maxRow + 1,
      resolvedMaxCol,
      XLSX.utils.encode_cell,
    );
  }

  sheet['!ref'] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: Math.max(maxRow, layout.headerRow - 1), c: resolvedMaxCol },
  });

  const output = XLSX.write(workbook, { bookType: 'xlsx', type: 'array', cellStyles: true });
  const blob = new Blob([output], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  triggerBlobDownload(blob, downloadName ?? layout.downloadName);
}
