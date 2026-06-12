export type ExcelFormatId =
  | 'sudebip-muebles'
  | 'sudebip-vehiculos'
  | 'sudebip-inmuebles'
  | 'interno-inventario-muebles'
  | 'interno-area-patio'
  | 'interno-parcelas';

export type ModuleFormatKey = 'almacen' | 'vehiculos' | 'cementerio';

/** Submódulos que exponen descarga SUDEBIP y formato interno. */
export const EXCEL_FORMAT_MODULE_KEYS: readonly ModuleFormatKey[] = [
  'almacen',
  'vehiculos',
  'cementerio',
] as const;

export const EXCEL_FORMAT_MODULE_LABELS: Record<ModuleFormatKey, string> = {
  almacen: 'Bienes administrativos',
  vehiculos: 'Vehículos',
  cementerio: 'Cementerio',
};

type SheetCleanup = {
  /** Nombre de hoja. Si se omite, usa la primera hoja del libro. */
  name?: string;
  /** Fila 1-based desde la cual se borra el contenido (conserva encabezados anteriores). */
  clearFromRow: number;
};

export type ExcelFormatDefinition = {
  assetPath: string;
  downloadName: string;
  sheets?: SheetCleanup[];
};

export const EXCEL_FORMATS: Record<ExcelFormatId, ExcelFormatDefinition> = {
  'sudebip-muebles': {
    assetPath: '/formats/sudebip-muebles.xlsx',
    downloadName: 'Formato_SUDEBIP_Muebles.xlsx',
  },
  'sudebip-vehiculos': {
    assetPath: '/formats/sudebip-vehiculos.xlsx',
    downloadName: 'Formato_SUDEBIP_Vehiculos.xlsx',
  },
  'sudebip-inmuebles': {
    assetPath: '/formats/sudebip-inmuebles.xlsx',
    downloadName: 'Formato_SUDEBIP_Inmuebles.xlsx',
  },
  'interno-inventario-muebles': {
    assetPath: '/formats/interno-inventario-muebles.xlsx',
    downloadName: 'Formato_Interno_Inventario_Muebles.xlsx',
    sheets: [{ clearFromRow: 9 }],
  },
  'interno-area-patio': {
    assetPath: '/formats/interno-area-patio.xlsx',
    downloadName: 'Formato_Interno_Area_Patio.xlsx',
    sheets: [{ clearFromRow: 9 }],
  },
  'interno-parcelas': {
    assetPath: '/formats/interno-parcelas.xlsx',
    downloadName: 'Formato_Interno_Parcelas.xlsx',
    sheets: [{ name: 'Prop2-Cd. Guayana (ACTUAL)', clearFromRow: 10 }],
  },
};

export const MODULE_EXCEL_FORMATS: Record<
  ModuleFormatKey,
  { sudebip: ExcelFormatId; interno: ExcelFormatId; internoLabel?: string }
> = {
  almacen: {
    sudebip: 'sudebip-muebles',
    interno: 'interno-inventario-muebles',
  },
  vehiculos: {
    sudebip: 'sudebip-vehiculos',
    interno: 'interno-inventario-muebles',
  },
  cementerio: {
    sudebip: 'sudebip-muebles',
    interno: 'interno-area-patio',
    internoLabel: 'Formato Interno',
  },
};
