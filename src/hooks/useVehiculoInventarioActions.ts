import { useState } from 'react';
import { toast } from 'sonner';
import type { ApiAlmacen } from '../api/types';
import {
  fetchApiVehiculoById,
  updateVehiculo,
} from '../api/services/vehiculos.service';
import type { Vehiculo } from '../types/vehiculo';
import {
  apiVehiculoToUpdatePayload,
  todayIsoDate,
} from '../utils/assetUpdateMappers';
import {
  formatVehiculoResumen,
  notifyVehiculoRetirado,
  notifyVehiculoTransferido,
} from '../utils/assetNotify';

export type InventarioVehiculoActionResult =
  | { type: 'transfer'; almacenDestino: string }
  | { type: 'retire' };

type UseVehiculoInventarioActionsParams = {
  vehiculo: Vehiculo;
  almacenes: ApiAlmacen[];
  onActionSuccess?: (result: InventarioVehiculoActionResult) => void;
};

export function useVehiculoInventarioActions({
  vehiculo,
  almacenes,
  onActionSuccess,
}: UseVehiculoInventarioActionsParams) {
  const [transferOpen, setTransferOpen] = useState(false);
  const [retireOpen, setRetireOpen] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);
  const [retireLoading, setRetireLoading] = useState(false);

  const retirado = vehiculo.estadoUso === 'Obsoleto';

  const handleTransfer = async (idAlmacen: number, nombreAlmacen: string) => {
    setTransferLoading(true);
    try {
      const apiVehiculo = await fetchApiVehiculoById(vehiculo.id);
      const payload = apiVehiculoToUpdatePayload(apiVehiculo, { id_almacen: idAlmacen });
      await updateVehiculo(vehiculo.id, payload);
      notifyVehiculoTransferido(vehiculo, nombreAlmacen);
      setTransferOpen(false);
      onActionSuccess?.({ type: 'transfer', almacenDestino: nombreAlmacen });
    } catch (err) {
      toast.error('No se pudo transferir el vehículo', {
        description: err instanceof Error ? err.message : 'Intente nuevamente.',
      });
    } finally {
      setTransferLoading(false);
    }
  };

  const handleRetire = async () => {
    setRetireLoading(true);
    try {
      const apiVehiculo = await fetchApiVehiculoById(vehiculo.id);
      const payload = apiVehiculoToUpdatePayload(apiVehiculo, {
        estado_uso: 'Dado_de_Baja',
        fecha_egreso: todayIsoDate(),
      });
      await updateVehiculo(vehiculo.id, payload);
      notifyVehiculoRetirado(vehiculo);
      setRetireOpen(false);
      onActionSuccess?.({ type: 'retire' });
    } catch (err) {
      toast.error('No se pudo retirar el vehículo del inventario', {
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
    assetLabel: formatVehiculoResumen(vehiculo),
    sedeActual: vehiculo.sede,
    almacenActual: vehiculo.almacen,
    almacenes,
  };
}
