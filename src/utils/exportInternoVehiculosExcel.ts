import logoUrl from '../assets/imagen1-logo-exel.png';
import type { Vehiculo } from '../types/vehiculo';
import type { Alignment, Borders, IAnchor, Workbook, Worksheet } from 'exceljs';
import { vehiculoToInternoInventarioRow } from './internoExportMappers';

const COLUMN_COUNT = 12;
const COLUMN_HEADERS = [
  'Código',
  'Descripción',
  'Placa',
  'Marca',
  'Modelo',
  'Color',
  'Almacén',
  'Sede',
  'Fecha de adquisición',
  'Estado de uso',
  'Condición Física',
  'Observaciones',
] as const;

const TITLE = 'INVENTARIO VEHICULOS Y MAQUINARIAS';
const TITLE_ROW = 5;
const HEADER_ROW = 7;
const DATA_START_ROW = 8;

const COLOR_TITLE_BG = 'FFB8CCE4';
const COLOR_HEADER_BG = 'FF365F91';
const COLOR_HEADER_TEXT = 'FFFFFFFF';

const LOGO_HEIGHT_CM = 3.1;
const LOGO_AREA_ROWS = 4;
const LOGO_WIDTH_PX = 359;
const LOGO_HEIGHT_PX = 117;
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

function cmToPoints(cm: number) {
  return (cm / 2.54) * 72;
}

function getLogoAreaHeightPoints() {
  return cmToPoints(LOGO_HEIGHT_CM);
}

function columnWidthToPixels(width: number) {
  return Math.trunc(width * 7 + 5);
}

function pointsToPixels(points: number) {
  return Math.trunc((points * 96) / 72);
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
  [12, 28, 12, 14, 14, 10, 18, 22, 18, 14, 14, 32].forEach((width, index) => {
    worksheet.getColumn(index + 1).width = width;
  });
}

function styleLogoArea(worksheet: Worksheet) {
  worksheet.mergeCells(1, 1, 4, COLUMN_COUNT);
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

function styleDataRows(worksheet: Worksheet, vehiculos: Vehiculo[]) {
  vehiculos.forEach((vehiculo, index) => {
    const rowNumber = DATA_START_ROW + index;
    const values = vehiculoToInternoInventarioRow(vehiculo);

    values.forEach((value, colIndex) => {
      const colNumber = colIndex + 1;
      const cell = worksheet.getCell(rowNumber, colNumber);
      cell.value = value;

      const isLongTextCol = colNumber === 2 || colNumber === 7 || colNumber === 8 || colNumber === 12;
      cell.alignment = isLongTextCol
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

  const sheetWidthPx = getSheetContentWidthPixels(worksheet);
  const logoAreaHeightPx = pointsToPixels(getLogoAreaHeightPoints());
  const offsetXPx = Math.max(0, Math.round((sheetWidthPx - LOGO_WIDTH_PX) / 2));
  const offsetYPx = Math.max(0, Math.round((logoAreaHeightPx - LOGO_HEIGHT_PX) / 2));

  worksheet.addImage(imageId, {
    tl: {
      nativeCol: 0,
      nativeRow: 0,
      nativeColOff: offsetXPx * EMU_PER_PIXEL,
      nativeRowOff: offsetYPx * EMU_PER_PIXEL,
    } as IAnchor,
    ext: { width: LOGO_WIDTH_PX, height: LOGO_HEIGHT_PX },
    editAs: 'absolute',
  });
}

function uniqueExportFilename(date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, '0');
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const time = `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  return `Inventario_Vehiculos_Maquinaria_${day}_${time}.xlsx`;
}

export async function exportInternoVehiculosMaquinaria(vehiculos: Vehiculo[]): Promise<void> {
  const ExcelJS = await import('exceljs');
  const exportDate = new Date();
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CVG FERROCASA';
  workbook.created = exportDate;
  workbook.modified = exportDate;

  const worksheet = workbook.addWorksheet('Vehículos y maquinaria', {
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
  styleDataRows(worksheet, vehiculos);
  await addLogo(workbook, worksheet);

  const lastDataRow = Math.max(HEADER_ROW, DATA_START_ROW + vehiculos.length - 1);
  if (vehiculos.length > 0) {
    worksheet.autoFilter = {
      from: { row: HEADER_ROW, column: 1 },
      to: { row: lastDataRow, column: COLUMN_COUNT },
    };
  }

  const output = await workbook.xlsx.writeBuffer();
  const blob = new Blob([output], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  triggerBlobDownload(blob, uniqueExportFilename(exportDate));
}
