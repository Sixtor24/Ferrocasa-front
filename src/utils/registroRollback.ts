import { deleteBien } from '../api/services/bienes.service';
import { deleteDocumento } from '../api/services/documentos.service';
import { deleteVehiculo } from '../api/services/vehiculos.service';

async function rollbackCodigos(codigos: number[], eliminar: (codigo: number) => Promise<void>) {
  for (const codigo of [...codigos].reverse()) {
    try {
      await eliminar(codigo);
    } catch {
      // Reversión best-effort: si falla el delete, el error original sigue siendo el relevante.
    }
  }
}

export async function rollbackRegistroBienes(params: {
  idDoc: number | null;
  codigosBien: number[];
}) {
  await rollbackCodigos(params.codigosBien, deleteBien);
  if (params.idDoc == null) return;
  try {
    await deleteDocumento(params.idDoc);
  } catch {
    // Sin permisos o documento ya vinculado: no bloquear el mensaje de error principal.
  }
}

export async function rollbackRegistroVehiculos(params: {
  idDoc: number | null;
  codigosVehiculo: number[];
}) {
  await rollbackCodigos(params.codigosVehiculo, deleteVehiculo);
  if (params.idDoc == null) return;
  try {
    await deleteDocumento(params.idDoc);
  } catch {
    // best-effort
  }
}
