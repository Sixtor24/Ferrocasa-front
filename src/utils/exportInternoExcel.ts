import type { ModuleFormatKey } from '../constants/excelFormats';
import { EXCEL_FORMATS } from '../constants/excelFormats';
import { fetchAllPages } from '../api/pagination';
import { fetchBienes } from '../api/services/bienes.service';
import {
  matchesSede,
  SEDES_BIENES_ADMINISTRATIVOS,
  SEDES_CEMENTERIO,
} from '../api/services/bienes-sedes.service';
import { fetchParcelasAll } from '../api/services/parcelas.service';
import { fetchVehiculosAll } from '../api/services/vehiculos.service';
import type { BienMueble } from '../types/bien';
import type { Terreno } from '../types/terreno';
import type { Vehiculo } from '../types/vehiculo';
import { fillExcelTemplate, type ExcelTemplateLayout } from './excelWorkbookExport';
import {
  bienToInternoMueblesRow,
  terrenoToInternoParcelaRow,
  vehiculoToInternoMueblesRow,
} from './internoExportMappers';

const INTERNO_MUEBLES_LAYOUT: ExcelTemplateLayout = {
  assetPath: EXCEL_FORMATS['interno-inventario-muebles'].assetPath,
  downloadName: EXCEL_FORMATS['interno-inventario-muebles'].downloadName,
  headerRow: 8,
  dataStartRow: 9,
  minCols: 6,
};

const INTERNO_PATIO_LAYOUT: ExcelTemplateLayout = {
  assetPath: EXCEL_FORMATS['interno-area-patio'].assetPath,
  downloadName: EXCEL_FORMATS['interno-area-patio'].downloadName,
  headerRow: 8,
  dataStartRow: 9,
  minCols: 7,
};

const INTERNO_PARCELAS_LAYOUT: ExcelTemplateLayout = {
  assetPath: EXCEL_FORMATS['interno-parcelas'].assetPath,
  downloadName: EXCEL_FORMATS['interno-parcelas'].downloadName,
  sheetName: 'Prop2-Cd. Guayana (ACTUAL)',
  headerRow: 7,
  dataStartRow: 10,
  minCols: 8,
};

async function fetchAllBienesBySedeAliases(aliases: readonly string[]): Promise<BienMueble[]> {
  const all = await fetchAllPages((page, limit) => fetchBienes({ page, limit }));
  return all.filter((bien) => matchesSede(bien.sede, aliases));
}

export async function exportInternoMuebles(
  bienes: BienMueble[],
  modo: 'almacen' | 'cementerio',
  downloadName?: string,
): Promise<void> {
  const rows = bienes.map((bien) => bienToInternoMueblesRow(bien, modo));
  const layout =
    modo === 'cementerio'
      ? INTERNO_PATIO_LAYOUT
      : {
          ...INTERNO_MUEBLES_LAYOUT,
          staticCells: [
            {
              row: 6,
              col: 0,
              value: 'INVENTARIO  (EDIFICIO ADMINISTRATIVO) (MUEBLES)',
            },
          ],
        };

  await fillExcelTemplate(layout, rows, downloadName);
}

export async function exportInternoVehiculos(vehiculos: Vehiculo[]): Promise<void> {
  const rows = vehiculos.map((vehiculo) => vehiculoToInternoMueblesRow(vehiculo));
  await fillExcelTemplate(
    {
      ...INTERNO_MUEBLES_LAYOUT,
      downloadName: 'Formato_Interno_Inventario_Vehiculos.xlsx',
      staticCells: [{ row: 6, col: 0, value: 'INVENTARIO  (VEHÍCULOS) (FLOTA)' }],
    },
    rows,
  );
}

export async function exportInternoParcelas(terrenos: Terreno[]): Promise<void> {
  const rows = terrenos.map((terreno, index) => terrenoToInternoParcelaRow(index, terreno));
  await fillExcelTemplate(INTERNO_PARCELAS_LAYOUT, rows);
}

export async function exportInternoForModule(module: ModuleFormatKey): Promise<void> {
  switch (module) {
    case 'almacen': {
      const bienes = await fetchAllBienesBySedeAliases(SEDES_BIENES_ADMINISTRATIVOS);
      await exportInternoMuebles(bienes, 'almacen', 'Inventario_Interno_Almacen.xlsx');
      return;
    }
    case 'cementerio': {
      const bienes = await fetchAllBienesBySedeAliases(SEDES_CEMENTERIO);
      await exportInternoMuebles(bienes, 'cementerio', 'Inventario_Interno_Cementerio_Patio.xlsx');
      return;
    }
    case 'vehiculos': {
      const { data } = await fetchVehiculosAll();
      await exportInternoVehiculos(data);
      return;
    }
    case 'terrenos': {
      const { terrenos } = await fetchParcelasAll();
      await exportInternoParcelas(terrenos);
      return;
    }
    default:
      throw new Error('Módulo no soportado para exportación interna');
  }
}
