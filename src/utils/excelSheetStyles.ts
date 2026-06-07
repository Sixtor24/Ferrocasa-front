/** Estilos compartidos para exportaciones Excel (xlsx-js-style). */

export const SUDEBIP_HEADER_ROW = 8;

const CENTER_ALIGNMENT = {
  horizontal: 'center' as const,
  vertical: 'center' as const,
  wrapText: true,
};

/** Azul institucional para encabezados de columnas. */
export const EXCEL_HEADER_CELL_STYLE = {
  fill: {
    patternType: 'solid' as const,
    fgColor: { rgb: '1E3A8A' },
  },
  font: {
    bold: true,
    color: { rgb: 'FFFFFF' },
    sz: 11,
  },
  alignment: CENTER_ALIGNMENT,
  border: {
    top: { style: 'thin' as const, color: { rgb: 'CBD5E1' } },
    bottom: { style: 'thin' as const, color: { rgb: 'CBD5E1' } },
    left: { style: 'thin' as const, color: { rgb: 'CBD5E1' } },
    right: { style: 'thin' as const, color: { rgb: 'CBD5E1' } },
  },
};

export const EXCEL_DATA_CELL_STYLE = {
  alignment: CENTER_ALIGNMENT,
  border: {
    top: { style: 'thin' as const, color: { rgb: 'E2E8F0' } },
    bottom: { style: 'thin' as const, color: { rgb: 'E2E8F0' } },
    left: { style: 'thin' as const, color: { rgb: 'E2E8F0' } },
    right: { style: 'thin' as const, color: { rgb: 'E2E8F0' } },
  },
};

type StyledCell = {
  t?: string;
  v?: string | number;
  s?: typeof EXCEL_HEADER_CELL_STYLE | typeof EXCEL_DATA_CELL_STYLE;
};

type EncodeCell = (coord: { r: number; c: number }) => string;

export function styleHeaderRow(
  sheet: Record<string, StyledCell>,
  headerRow: number,
  maxCol: number,
  encodeCell: EncodeCell,
) {
  for (let col = 0; col <= maxCol; col += 1) {
    const address = encodeCell({ r: headerRow - 1, c: col });
    const cell = sheet[address];
    if (!cell?.v && cell?.v !== 0) continue;
    sheet[address] = { ...cell, s: EXCEL_HEADER_CELL_STYLE };
  }
}

export function styleDataRange(
  sheet: Record<string, StyledCell>,
  startRow: number,
  endRow: number,
  maxCol: number,
  encodeCell: EncodeCell,
) {
  for (let row = startRow; row <= endRow; row += 1) {
    for (let col = 0; col <= maxCol; col += 1) {
      const address = encodeCell({ r: row - 1, c: col });
      const cell = sheet[address];
      if (!cell?.v && cell?.v !== 0) continue;
      sheet[address] = { ...cell, s: EXCEL_DATA_CELL_STYLE };
    }
  }
}
