import logoUrl from '../assets/imagen1-logo-exel.png';
import type { Alignment, Borders, Workbook, Worksheet } from 'exceljs';

export type ReporteMovimientoExportRow = {
  codigo: string;
  descripcion: string;
  categoria: string;
  almacen: string;
  movimiento: string;
  stock: number | string;
  estadoUso: string;
  estadoFisico: string;
};

const COLUMN_COUNT = 8;
const COLUMN_HEADERS = [
  'Código',
  'Descripción',
  'Categoría',
  'Almacén',
  'Movimiento',
  'Stock',
  'Estado de uso',
  'Estado Físico',
] as const;

const TITLE_ROW = 5;
const HEADER_ROW = 7;
const DATA_START_ROW = 8;

const COLOR_TITLE_BG = 'FFB8CCE4';
const COLOR_HEADER_BG = 'FF365F91';
const COLOR_HEADER_TEXT = 'FFFFFFFF';

const LOGO_WIDTH_CM = 9.5;
const LOGO_HEIGHT_CM = 3.1;
const LOGO_AREA_ROWS = 4;
const EMU_PER_PIXEL = 9525;

const BORDER_THIN: Partial<Borders> = {
  top: { style: 'thin', color: { argb: 'FF000000' } },
  bottom: { style: 'thin', color: { argb: 'FF000000' } },
  left: { style: 'thin', color: { argb: 'FF000000' } },
  right: { style: 'thin', color: { argb: 'FF000000' } },
};

const CENTER: Partial<Alignment> = {
  horizontal: 'center',
  vertical: 'middle',
  wrapText: true,
};

function cmToPixels(cm: number) {
  return Math.round((cm / 2.54) * 96);
}

function cmToPoints(cm: number) {
  return (cm / 2.54) * 72;
}

function columnWidthToPixels(width: number) {
  return Math.trunc(width * 7 + 5);
}

function pointsToPixels(points: number) {
  return Math.trunc((points * 96) / 72);
}

function getLogoAreaHeightPoints() {
  return cmToPoints(LOGO_HEIGHT_CM);
}

function getSheetContentWidthPixels(worksheet: Worksheet) {
  let total = 0;
  for (let column = 1; column <= COLUMN_COUNT; column += 1) {
    total += columnWidthToPixels(worksheet.getColumn(column).width ?? 8.43);
  }
  return total;
}

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

function uniqueExportFilename(date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, '0');
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const time = `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  return `Reporte_Movimientos_${day}_${time}.xlsx`;
}

async function loadLogoBase64() {
  const response = await fetch(logoUrl);
  if (!response.ok) throw new Error(`No se pudo cargar el logo (${response.status})`);
  const blob = await response.blob();

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('No se pudo procesar el logo'));
    reader.readAsDataURL(blob);
  });
}

function setRowHeights(worksheet: Worksheet) {
  const logoRowHeight = getLogoAreaHeightPoints() / LOGO_AREA_ROWS;
  for (let row = 1; row <= LOGO_AREA_ROWS; row += 1) {
    worksheet.getRow(row).height = logoRowHeight;
  }
  worksheet.getRow(TITLE_ROW).height = 28;
  worksheet.getRow(6).height = 8;
  worksheet.getRow(HEADER_ROW).height = 36;
}

function setColumnWidths(worksheet: Worksheet) {
  [14, 34, 22, 22, 14, 10, 16, 14].forEach((width, index) => {
    worksheet.getColumn(index + 1).width = width;
  });
}

function styleLogoArea(worksheet: Worksheet) {
  worksheet.mergeCells(1, 1, LOGO_AREA_ROWS, COLUMN_COUNT);
  const logoCell = worksheet.getCell(1, 1);
  logoCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFFFFF' },
  };
  logoCell.border = BORDER_THIN;
}

function styleTitle(worksheet: Worksheet) {
  worksheet.mergeCells(TITLE_ROW, 1, TITLE_ROW, COLUMN_COUNT);
  const cell = worksheet.getCell(TITLE_ROW, 1);
  cell.value = 'REPORTE DE MOVIMIENTOS';
  cell.font = { bold: true, size: 12, color: { argb: 'FF000000' } };
  cell.alignment = CENTER;
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLOR_TITLE_BG },
  };
  cell.border = BORDER_THIN;
}

function styleColumnHeaders(worksheet: Worksheet) {
  COLUMN_HEADERS.forEach((header, index) => {
    const cell = worksheet.getCell(HEADER_ROW, index + 1);
    cell.value = header;
    cell.font = { bold: true, color: { argb: COLOR_HEADER_TEXT }, size: 10 };
    cell.alignment = CENTER;
    cell.border = BORDER_THIN;
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLOR_HEADER_BG },
    };
  });
}

function rowToValues(row: ReporteMovimientoExportRow) {
  return [
    row.codigo,
    row.descripcion,
    row.categoria,
    row.almacen,
    row.movimiento,
    row.stock,
    row.estadoUso,
    row.estadoFisico,
  ];
}

function styleDataRows(worksheet: Worksheet, rows: ReporteMovimientoExportRow[]) {
  rows.forEach((row, index) => {
    const rowNumber = DATA_START_ROW + index;
    const values = rowToValues(row);

    values.forEach((value, colIndex) => {
      const colNumber = colIndex + 1;
      const cell = worksheet.getCell(rowNumber, colNumber);
      cell.value = value;
      cell.alignment =
        colNumber === 2 || colNumber === 3 || colNumber === 4
          ? { vertical: 'middle', horizontal: 'left', wrapText: true }
          : CENTER;
      cell.border = BORDER_THIN;
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: index % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC' },
      };
    });
  });
}

async function addLogo(workbook: Workbook, worksheet: Worksheet) {
  const imageId = workbook.addImage({
    base64: await loadLogoBase64(),
    extension: 'png',
  });

  const logoWidthPx = cmToPixels(LOGO_WIDTH_CM);
  const logoHeightPx = cmToPixels(LOGO_HEIGHT_CM);
  const sheetWidthPx = getSheetContentWidthPixels(worksheet);
  const logoAreaHeightPx = pointsToPixels(getLogoAreaHeightPoints());
  const offsetXPx = Math.max(0, Math.round((sheetWidthPx - logoWidthPx) / 2));
  const offsetYPx = Math.max(0, Math.round((logoAreaHeightPx - logoHeightPx) / 2));

  worksheet.addImage(imageId, {
    tl: {
      nativeCol: 0,
      nativeRow: 0,
      nativeColOff: offsetXPx * EMU_PER_PIXEL,
      nativeRowOff: offsetYPx * EMU_PER_PIXEL,
    },
    ext: { width: logoWidthPx, height: logoHeightPx },
    editAs: 'absolute',
  });
}

export async function exportInternoReporteMovimientos(rows: ReporteMovimientoExportRow[]): Promise<void> {
  const ExcelJS = await import('exceljs');
  const exportDate = new Date();
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CVG FERROCASA';
  workbook.created = exportDate;
  workbook.modified = exportDate;

  const worksheet = workbook.addWorksheet('Reporte de movimientos', {
    views: [{ state: 'frozen', ySplit: HEADER_ROW }],
    pageSetup: {
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    },
  });

  setColumnWidths(worksheet);
  setRowHeights(worksheet);
  styleLogoArea(worksheet);
  styleTitle(worksheet);
  styleColumnHeaders(worksheet);
  styleDataRows(worksheet, rows);
  await addLogo(workbook, worksheet);

  const lastDataRow = Math.max(HEADER_ROW, DATA_START_ROW + rows.length - 1);
  worksheet.autoFilter = {
    from: { row: HEADER_ROW, column: 1 },
    to: { row: lastDataRow, column: COLUMN_COUNT },
  };

  const output = await workbook.xlsx.writeBuffer();
  const blob = new Blob([output], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  triggerBlobDownload(blob, uniqueExportFilename(exportDate));
}
