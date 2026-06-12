import { getStoredUser } from '../api/auth/session';
import logoUrl from '../assets/imagen2-logo-exel.png';
import type { BienMueble } from '../types/bien';
import type { Alignment, Borders, Workbook, Worksheet } from 'exceljs';
import { bienToSudebipReportRow, sudebipFechaEmision } from './sudebipExportMappers';

const COLUMN_COUNT = 21;
const COLUMN_HEADERS = [
  'N°',
  'Sede',
  'Unidad Administrativa',
  'Código',
  'Descripción',
  'Forma de Adquisición',
  'Fecha de Adquisición',
  'N° Documento',
  'Moneda',
  'Valor de Adquisición',
  'Condición Física',
  'Estado de Uso',
  'Marca',
  'Modelo',
  'Color',
  'Serial',
  'Categoría General',
  'Sub Categoría',
  'Categoría Específica',
  'Código Categoría',
  'Estatus de Carga',
] as const;

const TITLE = 'Reporte Bienes muebles';
const TITLE_ROW = 5;
const META_ROW = 6;
const HEADER_ROW = 8;
const DATA_START_ROW = 9;

const COLOR_TITLE_BG = 'FFB8CCE4';
const COLOR_HEADER_BG = 'FF365F91';
const COLOR_HEADER_TEXT = 'FFFFFFFF';

const LOGO_WIDTH_CM = 9.5;
const LOGO_HEIGHT_CM = 3.1;
const LOGO_AREA_ROWS = 4;
const EMU_PER_PIXEL = 9525;

const LONG_TEXT_COLUMNS = new Set([2, 3, 5, 17, 18, 19]);

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

const SUDEBIP_FILENAME_BY_SCOPE: Record<string, string> = {
  Administrativos: 'Bienes_Administrativos_SUDEBIP',
  Cementerio: 'Bienes_Cementerio_SUDEBIP',
};

function uniqueExportFilename(scope?: string, date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, '0');
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const time = `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  const baseName = (scope && SUDEBIP_FILENAME_BY_SCOPE[scope]) || 'Bienes_Administrativos_SUDEBIP';
  return `${baseName}_${day}_${time}.xlsx`;
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
  worksheet.getRow(META_ROW).height = 22;
  worksheet.getRow(7).height = 8;
  worksheet.getRow(HEADER_ROW).height = 36;
}

function setColumnWidths(worksheet: Worksheet) {
  [6, 22, 24, 14, 30, 18, 14, 14, 12, 16, 14, 14, 12, 12, 10, 16, 18, 16, 18, 14, 16].forEach(
    (width, index) => {
      worksheet.getColumn(index + 1).width = width;
    },
  );
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
  cell.value = TITLE;
  cell.font = { bold: true, size: 12, color: { argb: 'FF000000' } };
  cell.alignment = CENTER;
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLOR_TITLE_BG },
  };
  cell.border = BORDER_THIN;
}

function styleMetaRow(worksheet: Worksheet, exportDate: Date, rol: string) {
  worksheet.mergeCells(META_ROW, 1, META_ROW, COLUMN_COUNT);
  const cell = worksheet.getCell(META_ROW, 1);
  cell.value = sudebipFechaEmision(exportDate, rol);
  cell.font = { size: 10, color: { argb: 'FF000000' } };
  cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFFFFF' },
  };
  cell.border = BORDER_THIN;
}

function styleColumnHeaders(worksheet: Worksheet) {
  COLUMN_HEADERS.forEach((header, index) => {
    const cell = worksheet.getCell(HEADER_ROW, index + 1);
    cell.value = header;
    cell.font = { bold: true, color: { argb: COLOR_HEADER_TEXT }, size: 9 };
    cell.alignment = CENTER;
    cell.border = BORDER_THIN;
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLOR_HEADER_BG },
    };
  });
}

function styleDataRows(worksheet: Worksheet, bienes: BienMueble[]) {
  bienes.forEach((bien, index) => {
    const rowNumber = DATA_START_ROW + index;
    const values = bienToSudebipReportRow(index, bien);

    values.forEach((value, colIndex) => {
      const colNumber = colIndex + 1;
      const cell = worksheet.getCell(rowNumber, colNumber);
      cell.value = value;
      cell.alignment = LONG_TEXT_COLUMNS.has(colNumber)
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

export async function exportSudebipBienesMuebles(
  bienes: BienMueble[],
  scope?: string,
): Promise<void> {
  const ExcelJS = await import('exceljs');
  const exportDate = new Date();
  const rol = getStoredUser()?.rol.nombre_rol ?? 'Usuario';
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CVG FERROCASA';
  workbook.created = exportDate;
  workbook.modified = exportDate;

  const worksheet = workbook.addWorksheet('Reporte Bienes muebles', {
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
  styleMetaRow(worksheet, exportDate, rol);
  styleColumnHeaders(worksheet);
  styleDataRows(worksheet, bienes);
  await addLogo(workbook, worksheet);

  const lastDataRow = Math.max(HEADER_ROW, DATA_START_ROW + bienes.length - 1);
  worksheet.autoFilter = {
    from: { row: HEADER_ROW, column: 1 },
    to: { row: lastDataRow, column: COLUMN_COUNT },
  };

  const output = await workbook.xlsx.writeBuffer();
  const blob = new Blob([output], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  triggerBlobDownload(blob, uniqueExportFilename(scope, exportDate));
}
