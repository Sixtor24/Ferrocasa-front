import logoUrl from '../assets/imagen1-logo-exel.png';
import type { AuditoriaRegistroView } from '../types/auditoria';
import { accionAuditoriaLabel } from './auditoriaFormat';
import type { Alignment, Borders, IAnchor, Workbook, Worksheet } from 'exceljs';

const COLUMN_COUNT = 7;
const COLUMN_HEADERS = [
  'Fecha / Hora',
  'Usuario',
  'Tabla',
  'ID',
  'Modulo',
  'Descripción',
  'IP',
] as const;

const TITLE = 'REPORTE DE AUDITORÍA DEL SISTEMA';
const TITLE_ROW = 5;
const HEADER_ROW = 7;
const DATA_START_ROW = 8;

const COLOR_TITLE_BG = 'FFB8CCE4';
const COLOR_HEADER_BG = 'FF365F91';
const COLOR_HEADER_TEXT = 'FFFFFFFF';

const LOGO_HEIGHT_CM = 3.1;
const LOGO_AREA_ROWS = 4;
const COLUMN_WIDTHS = [20, 24, 22, 10, 14, 52, 16] as const;
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

function auditoriaToRow(registro: AuditoriaRegistroView): (string | number)[] {
  return [
    registro.fecha,
    registro.usuario,
    registro.tablaLabel,
    registro.idRegistro,
    accionAuditoriaLabel(registro.accion),
    registro.descripcion,
    registro.ip,
  ];
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
  COLUMN_WIDTHS.forEach((width, index) => {
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

function styleDataRows(worksheet: Worksheet, registros: AuditoriaRegistroView[]) {
  registros.forEach((registro, index) => {
    const rowNumber = DATA_START_ROW + index;
    const values = auditoriaToRow(registro);

    values.forEach((value, colIndex) => {
      const colNumber = colIndex + 1;
      const cell = worksheet.getCell(rowNumber, colNumber);
      cell.value = value;

      const isLongTextCol = colNumber === 2 || colNumber === 6;
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

  // Usar nativeCol/nativeRow: si se pasa `col`, ExcelJS ignora nativeColOff y queda en A1.
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
  return `Auditoria_${day}_${time}.xlsx`;
}

export async function exportAuditoriaExcel(registros: AuditoriaRegistroView[]): Promise<void> {
  const ExcelJS = await import('exceljs');
  const exportDate = new Date();
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CVG FERROCASA';
  workbook.created = exportDate;
  workbook.modified = exportDate;

  const worksheet = workbook.addWorksheet('Auditoría', {
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
  styleDataRows(worksheet, registros);
  await addLogo(workbook, worksheet);

  const lastDataRow = Math.max(HEADER_ROW, DATA_START_ROW + registros.length - 1);
  if (registros.length > 0) {
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
