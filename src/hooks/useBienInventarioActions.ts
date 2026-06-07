import { useState } from 'react';
import { toast } from 'sonner';
import type { ApiAlmacen } from '../api/types';
import {
  fetchApiBienByCodigo,
  updateBien,
} from '../api/services/bienes.service';
import type { BienMueble } from '../types/bien';
import {
  apiBienToUpdatePayload,
  todayIsoDate,
} from '../utils/assetUpdateMappers';
import {
  formatBienResumen,
  notifyBienRetirado,
  notifyBienTransferido,
} from '../utils/assetNotify';
import { bienCodigoPk } from '../utils/bienCodigo';

export type InventarioBienActionResult =
  | { type: 'transfer'; almacenDestino: string }
  | { type: 'retire' };

type UseBienInventarioActionsParams = {
  bien: BienMueble;
  almacenes: ApiAlmacen[];
  onActionSuccess?: (result: InventarioBienActionResult) => void;
};

export function useBienInventarioActions({
  bien,
  almacenes,
  onActionSuccess,
}: UseBienInventarioActionsParams) {
  const [transferOpen, setTransferOpen] = useState(false);
  const [retireOpen, setRetireOpen] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);
  const [retireLoading, setRetireLoading] = useState(false);

  const retirado = bien.estadoUso === 'Obsoleto';
  const codigo = bienCodigoPk(bien);

  const handleTransfer = async (idAlmacen: number, nombreAlmacen: string) => {
    setTransferLoading(true);
    try {
      const apiBien = await fetchApiBienByCodigo(codigo);
      const payload = apiBienToUpdatePayload(apiBien, { id_almacen: idAlmacen });
      await updateBien(codigo, payload);
      notifyBienTransferido(bien, nombreAlmacen);
      setTransferOpen(false);
      onActionSuccess?.({ type: 'transfer', almacenDestino: nombreAlmacen });
    } catch (err) {
      toast.error('No se pudo transferir el bien', {
        description: err instanceof Error ? err.message : 'Intente nuevamente.',
      });
    } finally {
      setTransferLoading(false);
    }
  };

  const handleRetire = async () => {
    setRetireLoading(true);
    try {
      const apiBien = await fetchApiBienByCodigo(codigo);
      const payload = apiBienToUpdatePayload(apiBien, {
        estado_uso: 'Dado_de_Baja',
        fecha_egreso: todayIsoDate(),
      });
      await updateBien(codigo, payload);
      notifyBienRetirado(bien);
      setRetireOpen(false);
      onActionSuccess?.({ type: 'retire' });
    } catch (err) {
      toast.error('No se pudo retirar el bien del inventario', {
        description: err instanceof Error ? err.message : 'Intente nuevamente.',
      });
    } finally {
      setRetireLoading(false);
    }
  };

  return {
    transferOpen,
    setTransferOpen,
    retireOpen,
    setRetireOpen,
    transferLoading,
    retireLoading,
    retirado,
    handleTransfer,
    handleRetire,
    assetLabel: formatBienResumen(bien),
    sedeActual: bien.sede,
    almacenActual: bien.ubicacion,
    almacenes,
  };
}
