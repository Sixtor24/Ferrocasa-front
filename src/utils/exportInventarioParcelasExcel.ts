import logoUrl from '../assets/logo.png';
import type { Terreno } from '../types/terreno';
import type { Alignment, Borders, Workbook, Worksheet } from 'exceljs';

type CellValue = string | number;

const COLUMN_COUNT = 13;
const COLUMN_HEADERS = [
  'Código',
  'Identificación',
  'Nro de Propiedad',
  'Ubicación',
  'Lote',
  'Área de documento',
  'Área Desincorporada',
  'Área Comprometida',
  'Área Disponible',
  'Zonificación',
  'Levantamiento Topográfico',
  'Acreditación Técnica Ambiental',
  'Observaciones',
] as const;

const HEADER_ROW = 7;
const DATA_START_ROW = 8;

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

function dashToEmpty(value: string | null | undefined) {
  return value && value !== '—' ? value : '';
}

/** API `levantamiento_topografico`: Si | Solicitar */
function formatLevantamientoExport(terreno: Terreno): string {
  const api = terreno.levantamientoTopograficoApi;
  if (api === 'Si') return 'Sí';
  if (api === 'Solicitar') return 'En trámite';
  if (terreno.levantamientoTopografico === 'Sí') return 'Sí';
  if (terreno.levantamientoTopografico === 'No') return 'No';
  return 'En trámite';
}

/** API `acreditacion_ambiental`: Si_posee | No_posee — solo Sí o No */
function formatAcreditacionExport(terreno: Terreno): string {
  const api = terreno.acreditacionAmbientalApi;
  if (api === 'Si_posee') return 'Sí';
  if (api === 'No_posee') return 'No';
  return terreno.acreditacionTecnicaAmbiental === 'Sí' ? 'Sí' : 'No';
}

function terrenoToInventarioParcelaRow(terreno: Terreno): CellValue[] {
  return [
    dashToEmpty(terreno.codigo),
    dashToEmpty(terreno.identificacion),
    dashToEmpty(terreno.nroPropiedad),
    dashToEmpty(terreno.ubicacion),
    dashToEmpty(terreno.zona),
    terreno.areaDocumento ?? 0,
    terreno.areaDesincorporada ?? 0,
    terreno.areaComprometida ?? 0,
    terreno.areaDisponible ?? 0,
    dashToEmpty(terreno.zonificacion),
    formatLevantamientoExport(terreno),
    formatAcreditacionExport(terreno),
    dashToEmpty(terreno.observacion),
  ];
}

function filenameForToday() {
  return `Inventario_Parcelas_${new Date().toISOString().slice(0, 10)}.xlsx`;
}

/** Formato referencia: April-24 → mes y día de exportación (mes en español). */
function exportMonthDayLabel(date = new Date()) {
  const monthRaw = date.toLocaleString('es-VE', { month: 'long' });
  const month = monthRaw.charAt(0).toUpperCase() + monthRaw.slice(1);
  const day = date.getDate();
  return `${month}-${day}`;
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
  worksheet.getRow(1).height = 28;
  worksheet.getRow(2).height = 28;
  worksheet.getRow(3).height = 28;
  worksheet.getRow(4).height = 22;
  worksheet.getRow(5).height = 22;
  worksheet.getRow(6).height = 10;
  worksheet.getRow(HEADER_ROW).height = 44;
}

function setColumnWidths(worksheet: Worksheet) {
  [14, 28, 16, 32, 28, 16, 18, 18, 16, 18, 22, 14, 36].forEach((width, index) => {
    worksheet.getColumn(index + 1).width = width;
  });
}

function styleHeader(worksheet: Worksheet, exportDate: Date) {
  worksheet.mergeCells('A1:B3');
  worksheet.mergeCells('C1:I2');
  worksheet.mergeCells('J1:M1');
  worksheet.mergeCells('J2:M2');
  worksheet.mergeCells('C4:M4');
  worksheet.mergeCells('C5:M5');

  worksheet.getCell('A1').value = '';
  worksheet.getCell('A1').fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFFFFF' },
  };

  worksheet.getCell('C1').value = 'RESULTADO DE REUNIONES DEL INVENTARIO DE TIERRA';
  worksheet.getCell('C1').font = { bold: true, size: 12, color: { argb: 'FF000000' } };
  worksheet.getCell('C1').alignment = CENTER;

  worksheet.getCell('J1').value = 'REVISION  N°';
  worksheet.getCell('J1').font = { bold: true, size: 10, color: { argb: 'FF000000' } };
  worksheet.getCell('J1').alignment = CENTER;

  worksheet.getCell('J2').value = exportMonthDayLabel(exportDate);
  worksheet.getCell('J2').font = { bold: true, size: 10, color: { argb: 'FF0000FF' } };
  worksheet.getCell('J2').alignment = CENTER;

  worksheet.getCell('C4').value = 'BANCO  DE  TERRENOS  PROPIEDAD  DE  C.V.G. FERROCASA';
  worksheet.getCell('C4').font = { bold: true, size: 11, color: { argb: 'FF0000FF' } };
  worksheet.getCell('C4').alignment = { ...CENTER, horizontal: 'right' };

  worksheet.getCell('C5').value = 'PROPIEDAD VARIAS - CIUDAD GUAYANA';
  worksheet.getCell('C5').font = { bold: true, size: 11, color: { argb: 'FFC00000' } };
  worksheet.getCell('C5').alignment = { ...CENTER, horizontal: 'right' };
}

function styleColumnHeaders(worksheet: Worksheet) {
  COLUMN_HEADERS.forEach((header, index) => {
    const cell = worksheet.getCell(HEADER_ROW, index + 1);
    cell.value = header;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    cell.alignment = CENTER;
    cell.border = BORDER_THIN;
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A8A' },
    };
  });
}

function styleDataRows(worksheet: Worksheet, terrenos: Terreno[]) {
  terrenos.forEach((terreno, index) => {
    const rowNumber = DATA_START_ROW + index;
    const values = terrenoToInventarioParcelaRow(terreno);

    values.forEach((value, colIndex) => {
      const colNumber = colIndex + 1;
      const cell = worksheet.getCell(rowNumber, colNumber);
      cell.value = value;

      const isAreaCol = colNumber >= 6 && colNumber <= 9;
      const isLongTextCol = colNumber === 2 || colNumber === 4 || colNumber === 5 || colNumber === 13;

      cell.alignment = isAreaCol
        ? { ...CENTER, horizontal: 'right' }
        : isLongTextCol
          ? { vertical: 'middle', horizontal: 'left', wrapText: true }
          : CENTER;
      cell.border = BORDER_THIN;
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: index % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC' },
      };
      if (isAreaCol) cell.numFmt = '#,##0.00';
    });
  });
}

async function addLogo(workbook: Workbook, worksheet: Worksheet) {
  const imageId = workbook.addImage({
    base64: await loadLogoBase64(),
    extension: 'png',
  });

  worksheet.addImage(imageId, {
    tl: { col: 0, row: 0 },
    br: { col: 2, row: 3 },
    editAs: 'oneCell',
  });
}

export async function exportInventarioParcelas(terrenos: Terreno[]) {
  const ExcelJS = await import('exceljs');
  const exportDate = new Date();
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CVG FERROCASA';
  workbook.created = exportDate;
  workbook.modified = exportDate;

  const worksheet = workbook.addWorksheet('Inventario de Parcelas', {
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
  styleHeader(worksheet, exportDate);
  styleColumnHeaders(worksheet);
  styleDataRows(worksheet, terrenos);
  await addLogo(workbook, worksheet);

  const lastDataRow = Math.max(HEADER_ROW, DATA_START_ROW + terrenos.length - 1);
  worksheet.autoFilter = {
    from: { row: HEADER_ROW, column: 1 },
    to: { row: lastDataRow, column: COLUMN_COUNT },
  };

  const output = await workbook.xlsx.writeBuffer();
  const blob = new Blob([output], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  triggerBlobDownload(blob, filenameForToday());
}
