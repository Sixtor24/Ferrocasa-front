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
import { exportInternoBienesAdministrativos, exportInternoCementerio } from './exportInternoBienesAdministrativosExcel';
import { exportInternoVehiculosMaquinaria } from './exportInternoVehiculosExcel';

async function fetchAllBienesBySedeAliases(aliases: readonly string[]): Promise<BienMueble[]> {
  const all = await fetchAllPages((page, limit) => fetchBienes({ page, limit }));
  return all.filter((bien) => matchesSede(bien.sede, aliases));
}

export async function exportInternoForModule(module: ModuleFormatKey): Promise<void> {
  switch (module) {
    case 'almacen': {
      const bienes = await fetchAllBienesBySedeAliases(SEDES_BIENES_ADMINISTRATIVOS);
      await exportInternoBienesAdministrativos(bienes);
      return;
    }
    case 'cementerio': {
      const bienes = await fetchAllBienesBySedeAliases(SEDES_CEMENTERIO);
      await exportInternoCementerio(bienes);
      return;
    }
    case 'vehiculos': {
      const { data } = await fetchVehiculosAll();
      await exportInternoVehiculosMaquinaria(data);
      return;
    }
    default:
      throw new Error('Módulo no soportado para exportación interna');
  }
}
