import type { ModuleFormatKey } from '../constants/excelFormats';
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
import { exportSudebipBienesMuebles } from './exportSudebipBienesMueblesExcel';
import { exportSudebipVehiculosReport } from './exportSudebipVehiculosExcel';

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
  await exportSudebipVehiculosReport(vehiculos, downloadName);
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
