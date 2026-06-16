import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { toApiDateTime, toIsoDate } from '../../api/mappers/enums';
import { fetchDocumentoVehiculos, updateDocumento } from '../../api/services/documentos.service';
import {
  fetchApiVehiculoByCodigo,
  updateVehiculo,
} from '../../api/services/vehiculos.service';
import type { ApiAlmacen } from '../../api/types';
import type { FormaAdquisicion } from '../../types/bien';
import type { Vehiculo } from '../../types/vehiculo';
import { apiVehiculoToUpdatePayload } from '../../utils/assetUpdateMappers';
import { notifyVehiculoActualizado } from '../../utils/assetNotify';
import {
  mergeVehiculoValorInDocumentoList,
  sumValorVehiculosDocumento,
} from '../../utils/documentoValor';
import { formaAdquisicionToApi } from '../../utils/formaAdquisicionMappers';
import {
  findAlmacenByNombre,
  monedaBienToDocumento,
  resolveResponsableForAlmacen,
} from '../../utils/registroBienMappers';
import {
  condicionVehiculoToApi,
  estadoUsoVehiculoToApi,
} from '../../utils/registroVehiculoMappers';
import { readVehiculoDocumentoId } from '../../utils/vehiculoApiFields';
import { nombresAlmacenesVehiculos } from '../../utils/vehiculoAlmacenes';

export type VehiculoDetailDraft = {
  descripcion: string;
  estadoUso: Vehiculo['estadoUso'];
  condicionFisica: Vehiculo['condicionFisica'];
  placa: string;
  serialMotor: string;
  serialCarroceria: string;
  anioFabricacion: number;
  color: string;
  marca: string;
  modelo: string;
  valorAdquisicion: number;
  almacen: string;
  formaAdquisicion: FormaAdquisicion;
  fechaAdquisicion: string;
  nombreProveedor: string;
};

function placaDraftFromVehiculo(vehiculo: Vehiculo) {
  if (vehiculo.sinPlaca) return '';
  return vehiculo.placa === 'S/P' ? '' : vehiculo.placa;
}

function serialMotorDraftFromVehiculo(vehiculo: Vehiculo) {
  if (vehiculo.sinSerialMotor) return '';
  return vehiculo.serialMotor === 'S/S' || vehiculo.serialMotor === '—' ? '' : vehiculo.serialMotor;
}

function serialCarroceriaDraftFromVehiculo(vehiculo: Vehiculo) {
  if (vehiculo.sinSerialCarroceria) return '';
  return vehiculo.serialCarroceria || '';
}

function draftFromVehiculo(vehiculo: Vehiculo): VehiculoDetailDraft {
  return {
    descripcion: vehiculo.descripcion === '—' ? '' : vehiculo.descripcion,
    estadoUso: vehiculo.estadoUso,
    condicionFisica: vehiculo.condicionFisica,
    placa: placaDraftFromVehiculo(vehiculo),
    serialMotor: serialMotorDraftFromVehiculo(vehiculo),
    serialCarroceria: serialCarroceriaDraftFromVehiculo(vehiculo),
    anioFabricacion: vehiculo.anioFabricacion ?? 0,
    color: vehiculo.color === '—' ? '' : vehiculo.color,
    marca: vehiculo.marca === '—' ? '' : vehiculo.marca,
    modelo: vehiculo.modelo === '—' ? '' : vehiculo.modelo,
    valorAdquisicion: vehiculo.valorAdquisicion ?? 0,
    almacen: vehiculo.almacen === '—' ? '' : vehiculo.almacen,
    formaAdquisicion: vehiculo.formaAdquisicion,
    fechaAdquisicion: toIsoDate(vehiculo.fechaAdquisicion),
    nombreProveedor: vehiculo.proveedor === '—' ? '' : vehiculo.proveedor,
  };
}

function draftsEqual(a: VehiculoDetailDraft, b: VehiculoDetailDraft) {
  return (
    a.descripcion === b.descripcion
    && a.estadoUso === b.estadoUso
    && a.condicionFisica === b.condicionFisica
    && a.placa === b.placa
    && a.serialMotor === b.serialMotor
    && a.serialCarroceria === b.serialCarroceria
    && a.anioFabricacion === b.anioFabricacion
    && a.color === b.color
    && a.marca === b.marca
    && a.modelo === b.modelo
    && a.valorAdquisicion === b.valorAdquisicion
    && a.almacen === b.almacen
    && a.formaAdquisicion === b.formaAdquisicion
    && a.fechaAdquisicion === b.fechaAdquisicion
    && a.nombreProveedor === b.nombreProveedor
  );
}

type UseVehiculoDetailEditParams = {
  vehiculo: Vehiculo;
  almacenes: ApiAlmacen[];
  disabled?: boolean;
  onSaved?: () => void | Promise<void>;
};

export function useVehiculoDetailEdit({
  vehiculo,
  almacenes,
  disabled = false,
  onSaved,
}: UseVehiculoDetailEditParams) {
  const baseline = useMemo(() => draftFromVehiculo(vehiculo), [vehiculo]);
  const documentoId = useMemo(() => {
    const numero = vehiculo.numeroDocumento?.trim();
    if (!numero || numero === '—') return null;
    return numero;
  }, [vehiculo.numeroDocumento]);

  const [draft, setDraft] = useState(baseline);
  const [saving, setSaving] = useState(false);
  const [documentVehiculos, setDocumentVehiculos] = useState<Vehiculo[]>([vehiculo]);
  const [valorTotalDocumentoLoading, setValorTotalDocumentoLoading] = useState(false);
  const [responsable, setResponsable] = useState({
    nombre: vehiculo.responsable,
    ci: vehiculo.ciResponsable,
  });

  useEffect(() => {
    setDraft(baseline);
    setResponsable({ nombre: vehiculo.responsable, ci: vehiculo.ciResponsable });
  }, [baseline, vehiculo.responsable, vehiculo.ciResponsable]);

  const codigoVehiculoRef = useRef(String(vehiculo.codigoInterno || vehiculo.id));
  codigoVehiculoRef.current = String(vehiculo.codigoInterno || vehiculo.id);

  useEffect(() => {
    if (documentoId) return;
    setDocumentVehiculos([vehiculo]);
    setValorTotalDocumentoLoading(false);
  }, [documentoId, vehiculo]);

  useEffect(() => {
    if (!documentoId) return;

    let cancelled = false;
    setValorTotalDocumentoLoading(true);

    void (async () => {
      try {
        const apiVehiculo = await fetchApiVehiculoByCodigo(codigoVehiculoRef.current);
        if (!apiVehiculo.documento && !apiVehiculo.id_doc) {
          if (!cancelled) setDocumentVehiculos([vehiculo]);
          return;
        }

        const vehiculos = await fetchDocumentoVehiculos(readVehiculoDocumentoId(apiVehiculo));
        if (!cancelled) {
          setDocumentVehiculos(vehiculos.length > 0 ? vehiculos : [vehiculo]);
        }
      } catch {
        if (!cancelled) setDocumentVehiculos([vehiculo]);
      } finally {
        if (!cancelled) setValorTotalDocumentoLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [documentoId, vehiculo.codigoInterno]);

  useEffect(() => {
    setDocumentVehiculos((prev) => {
      if (prev.length <= 1) return prev;
      return mergeVehiculoValorInDocumentoList(
        prev,
        vehiculo.codigoInterno,
        vehiculo.valorAdquisicion,
      );
    });
  }, [vehiculo.codigoInterno, vehiculo.valorAdquisicion]);

  const almacenOptions = useMemo(
    () => nombresAlmacenesVehiculos(almacenes),
    [almacenes],
  );

  const almacenSeleccionado = useMemo(
    () => findAlmacenByNombre(draft.almacen, almacenes),
    [draft.almacen, almacenes],
  );

  const sede = almacenSeleccionado?.sede?.nombre ?? vehiculo.sede;
  const unidadAdministrativa =
    almacenSeleccionado?.departamento?.nombre ?? vehiculo.unidadAdministrativa;

  useEffect(() => {
    if (!draft.almacen || draft.almacen === baseline.almacen) {
      setResponsable({ nombre: vehiculo.responsable, ci: vehiculo.ciResponsable });
      return;
    }

    let cancelled = false;
    void resolveResponsableForAlmacen(draft.almacen, almacenes).then((result) => {
      if (!cancelled) {
        setResponsable({ nombre: result.responsable, ci: result.ciResponsable });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [draft.almacen, baseline.almacen, almacenes, vehiculo.responsable, vehiculo.ciResponsable]);

  const valorTotalDocumento = useMemo(
    () =>
      sumValorVehiculosDocumento(
        documentVehiculos,
        vehiculo.codigoInterno,
        draft.valorAdquisicion,
      ),
    [documentVehiculos, vehiculo.codigoInterno, draft.valorAdquisicion],
  );

  const isDirty = !draftsEqual(draft, baseline);

  const patchDraft = (patch: Partial<VehiculoDetailDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
  };

  const guardarCambio = async () => {
    if (!isDirty || saving || disabled) return;

    const almacenMatch = findAlmacenByNombre(draft.almacen, almacenes);
    if (!almacenMatch) {
      toast.error('No se pudo guardar el cambio', {
        description: 'Seleccione un almacén válido.',
      });
      return;
    }

    setSaving(true);
    try {
      const codigo = codigoVehiculoRef.current;
      const apiVehiculo = await fetchApiVehiculoByCodigo(codigo);
      const motorTrim = draft.serialMotor.trim();
      const carroceriaTrim = draft.serialCarroceria.trim();

      const vehiculoPayload = apiVehiculoToUpdatePayload(apiVehiculo, {
        descripcion: draft.descripcion.trim(),
        marca: draft.marca.trim(),
        modelo: draft.modelo.trim(),
        color: draft.color.trim(),
        placa: draft.placa.trim() || 'S/P',
        anio_fabricacion: draft.anioFabricacion > 0 ? draft.anioFabricacion : undefined,
        serial_motor: motorTrim || 'S/S',
        serial_carroceria: carroceriaTrim || null,
        estado_uso: estadoUsoVehiculoToApi(draft.estadoUso),
        condicion_fisica: condicionVehiculoToApi(draft.condicionFisica),
        valor_adquisicion: draft.valorAdquisicion,
        id_almacen: almacenMatch.id_almacen,
      });

      await updateVehiculo(codigo, vehiculoPayload);

      if (draft.valorAdquisicion !== baseline.valorAdquisicion) {
        setDocumentVehiculos((prev) =>
          mergeVehiculoValorInDocumentoList(
            prev,
            vehiculo.codigoInterno,
            draft.valorAdquisicion,
          ),
        );

        if (apiVehiculo.documento || apiVehiculo.id_doc) {
          setValorTotalDocumentoLoading(true);
          try {
            const vehiculosDoc = await fetchDocumentoVehiculos(readVehiculoDocumentoId(apiVehiculo));
            if (vehiculosDoc.length > 0) setDocumentVehiculos(vehiculosDoc);
          } finally {
            setValorTotalDocumentoLoading(false);
          }
        }
      }

      const documentChanged =
        draft.formaAdquisicion !== baseline.formaAdquisicion
        || draft.fechaAdquisicion !== baseline.fechaAdquisicion
        || draft.nombreProveedor !== baseline.nombreProveedor;

      if (documentChanged && (apiVehiculo.documento || apiVehiculo.id_doc)) {
        const fechaApi = toApiDateTime(draft.fechaAdquisicion);
        if (!fechaApi) {
          throw new Error('La fecha de adquisición no es válida');
        }

        await updateDocumento(readVehiculoDocumentoId(apiVehiculo), {
          numero_documento: apiVehiculo.documento?.numero_documento?.trim() || undefined,
          nombre_proveedor: draft.nombreProveedor.trim(),
          forma_adquisicion: formaAdquisicionToApi(draft.formaAdquisicion),
          fecha_adquisicion: fechaApi,
          moneda: monedaBienToDocumento(vehiculo.moneda),
        });
      }

      notifyVehiculoActualizado(
        vehiculo,
        draft.estadoUso !== baseline.estadoUso ? draft.estadoUso : vehiculo.estadoUso,
      );
      await onSaved?.();
    } catch (err) {
      toast.error('No se pudo guardar el cambio', {
        description: err instanceof Error ? err.message : 'Intente nuevamente.',
      });
    } finally {
      setSaving(false);
    }
  };

  const responsableDisplay =
    responsable.nombre !== '—'
      ? responsable.nombre
      : responsable.ci
        ? `CI ${responsable.ci}`
        : '—';

  return {
    draft,
    patchDraft,
    isDirty,
    saving,
    guardarCambio,
    almacenOptions,
    sede,
    unidadAdministrativa,
    responsableDisplay,
    valorTotalDocumento,
    valorTotalDocumentoLoading,
  };
}
