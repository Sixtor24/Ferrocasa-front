import type { ModuleFormatKey } from '../constants/excelFormats';
import { getStoredUser } from '../api/auth/session';
import { fetchAllPages } from '../api/pagination';
import { fetchBienes } from '../api/services/bienes.service';
import {
  matchesSede,
  SEDES_BIENES_ADMINISTRATIVOS,
  SEDES_CEMENTERIO,
} from '../api/services/bienes-sedes.service';
import { fetchVehiculosAll } from '../api/services/vehiculos.service';
import type { BienMueble } from '../types/bien';
import type { Vehiculo } from '../types/vehiculo';
import { fillExcelTemplate } from './excelWorkbookExport';
import { SUDEBIP_HEADER_ROW } from './excelSheetStyles';
import { exportSudebipBienesMuebles } from './exportSudebipBienesMueblesExcel';
import {
  sudebipFechaEmision,
  vehiculoToSudebipReportRow,
} from './sudebipExportMappers';

const SUDEBIP_VEHICULOS_LAYOUT = {
  assetPath: '/formats/sudebip-vehiculos-report.xlsx',
  downloadName: 'Inventario_Vehiculos_SUDEBIP.xlsx',
  headerRow: SUDEBIP_HEADER_ROW,
  dataStartRow: 9,
  minCols: 23,
};

function sudebipMetaCells() {
  const rol = getStoredUser()?.rol.nombre_rol;
  return [{ row: 6, col: 0, value: sudebipFechaEmision(new Date(), rol) }];
}

async function fetchAllBienesBySedeAliases(aliases: readonly string[]): Promise<BienMueble[]> {
  const all = await fetchAllPages((page, limit) => fetchBienes({ page, limit }));
  return all.filter((bien) => matchesSede(bien.sede, aliases));
}

export async function exportSudebipMuebles(
  bienes: BienMueble[],
  scope?: string,
): Promise<void> {
  await exportSudebipBienesMuebles(bienes, scope);
}

export async function exportSudebipVehiculos(
  vehiculos: Vehiculo[],
  downloadName?: string,
): Promise<void> {
  const rows = vehiculos.map((vehiculo, index) => vehiculoToSudebipReportRow(index, vehiculo));
  await fillExcelTemplate(
    { ...SUDEBIP_VEHICULOS_LAYOUT, staticCells: sudebipMetaCells() },
    rows,
    downloadName,
  );
}

export async function exportSudebipForModule(module: ModuleFormatKey): Promise<void> {
  switch (module) {
    case 'almacen': {
      const bienes = await fetchAllBienesBySedeAliases(SEDES_BIENES_ADMINISTRATIVOS);
      await exportSudebipMuebles(bienes, 'Administrativos');
      return;
    }
    case 'cementerio': {
      const bienes = await fetchAllBienesBySedeAliases(SEDES_CEMENTERIO);
      await exportSudebipMuebles(bienes, 'Cementerio');
      return;
    }
    case 'vehiculos': {
      const { data } = await fetchVehiculosAll();
      await exportSudebipVehiculos(data);
      return;
    }
    default:
      throw new Error('Módulo no soportado para exportación SUDEBIP');
  }
}
