import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { toApiDateTime, toIsoDate } from '../api/mappers/enums';
import { fetchApiBienByCodigo, updateBien } from '../api/services/bienes.service';
import { fetchDocumentoBienes, updateDocumento } from '../api/services/documentos.service';
import type { ApiAlmacen } from '../api/types';
import type { BienMueble, FormaAdquisicion } from '../types/bien';
import { apiBienToUpdatePayload } from '../utils/assetUpdateMappers';
import { notifyBienActualizado } from '../utils/assetNotify';
import { bienCodigoPk } from '../utils/bienCodigo';
import { formaAdquisicionToApi } from '../utils/formaAdquisicionMappers';
import {
  condicionFisicaToApi,
  estadoUsoToApi,
  findAlmacenByNombre,
  monedaBienToDocumento,
  normalizeCatalogValue,
  resolveResponsableForAlmacen,
} from '../utils/registroBienMappers';
import { isSinSerialBien, serialBienToApi } from '../utils/serialBien';
import {
  mergeBienValorInDocumentoList,
  sumValorBienesDocumento,
} from '../utils/documentoValor';
import { readBienDocumentoId } from '../utils/vehiculoApiFields';

export type BienMuebleDetailDraft = {
  descripcion: string;
  estadoUso: BienMueble['estadoUso'];
  condicionFisica: BienMueble['condicionFisica'];
  serial: string;
  color: string;
  marca: string;
  modelo: string;
  valorAdquisicion: number;
  almacen: string;
  formaAdquisicion: FormaAdquisicion;
  fechaAdquisicion: string;
  nombreProveedor: string;
};

function serialDraftFromBien(bien: BienMueble) {
  if (bien.sinSerial) return '';
  return bien.serial === '—' ? '' : bien.serial;
}

function draftFromBien(bien: BienMueble): BienMuebleDetailDraft {
  return {
    descripcion: bien.descripcion === '—' ? '' : bien.descripcion,
    estadoUso: bien.estadoUso,
    condicionFisica: bien.condicionFisica,
    serial: serialDraftFromBien(bien),
    color: bien.color === '—' ? '' : bien.color,
    marca: bien.marca === '—' ? '' : bien.marca,
    modelo: bien.modelo === '—' ? '' : bien.modelo,
    valorAdquisicion: bien.valorAdquisicion ?? 0,
    almacen: bien.ubicacion === '—' ? '' : bien.ubicacion,
    formaAdquisicion: bien.formaAdquisicion,
    fechaAdquisicion: toIsoDate(bien.fechaAdquisicion),
    nombreProveedor: bien.nombreProveedor === '—' ? '' : bien.nombreProveedor,
  };
}

function draftsEqual(a: BienMuebleDetailDraft, b: BienMuebleDetailDraft) {
  return (
    a.descripcion === b.descripcion
    && a.estadoUso === b.estadoUso
    && a.condicionFisica === b.condicionFisica
    && a.serial === b.serial
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

function filterAlmacenOptions(almacenes: ApiAlmacen[], catalog: readonly string[]) {
  const catalogNames = new Set(catalog.map(normalizeCatalogValue));
  const fromCatalog = almacenes
    .map((almacen) => almacen.nombre)
    .filter((nombre): nombre is string => {
      if (!nombre?.trim()) return false;
      return catalogNames.has(normalizeCatalogValue(nombre));
    });

  if (fromCatalog.length > 0) {
    return [...new Set(fromCatalog)].sort((a, b) => a.localeCompare(b, 'es'));
  }

  return [...catalog];
}

type UseBienMuebleDetailEditParams = {
  bien: BienMueble;
  almacenes: ApiAlmacen[];
  almacenesCatalog: readonly string[];
  disabled?: boolean;
  onSaved?: () => void | Promise<void>;
};

export function useBienMuebleDetailEdit({
  bien,
  almacenes,
  almacenesCatalog,
  disabled = false,
  onSaved,
}: UseBienMuebleDetailEditParams) {
  const baseline = useMemo(() => draftFromBien(bien), [bien]);
  const documentoId = useMemo(() => {
    const numero = bien.numeroDocumento?.trim();
    if (!numero || numero === '—') return null;
    return numero;
  }, [bien.numeroDocumento]);

  const [draft, setDraft] = useState(baseline);
  const [saving, setSaving] = useState(false);
  const [documentBienes, setDocumentBienes] = useState<BienMueble[]>([bien]);
  const [valorTotalDocumentoLoading, setValorTotalDocumentoLoading] = useState(false);
  const [responsable, setResponsable] = useState({
    nombre: bien.responsable,
    ci: bien.ciResponsable,
  });

  useEffect(() => {
    setDraft(baseline);
    setResponsable({ nombre: bien.responsable, ci: bien.ciResponsable });
  }, [baseline, bien.responsable, bien.ciResponsable]);

  const codigoBienRef = useRef(bien.codigoInterno);
  codigoBienRef.current = bien.codigoInterno;

  useEffect(() => {
    if (documentoId) return;
    setDocumentBienes([bien]);
    setValorTotalDocumentoLoading(false);
  }, [documentoId, bien]);

  useEffect(() => {
    if (!documentoId) return;

    let cancelled = false;
    setValorTotalDocumentoLoading(true);

    void (async () => {
      try {
        const apiBien = await fetchApiBienByCodigo(codigoBienRef.current);
        if (!apiBien.documento) {
          if (!cancelled) setDocumentBienes([bien]);
          return;
        }

        const bienes = await fetchDocumentoBienes(readBienDocumentoId(apiBien));
        if (!cancelled) {
          setDocumentBienes(bienes.length > 0 ? bienes : [bien]);
        }
      } catch {
        if (!cancelled) setDocumentBienes([bien]);
      } finally {
        if (!cancelled) setValorTotalDocumentoLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [documentoId, bien.codigoInterno]);

  useEffect(() => {
    setDocumentBienes((prev) => {
      if (prev.length <= 1) return prev;
      return mergeBienValorInDocumentoList(prev, bien.codigoInterno, bien.valorAdquisicion);
    });
  }, [bien.codigoInterno, bien.valorAdquisicion]);

  const almacenOptions = useMemo(
    () => filterAlmacenOptions(almacenes, almacenesCatalog),
    [almacenes, almacenesCatalog],
  );

  const almacenSeleccionado = useMemo(
    () => findAlmacenByNombre(draft.almacen, almacenes),
    [draft.almacen, almacenes],
  );

  const sede = almacenSeleccionado?.sede?.nombre ?? bien.sede;
  const unidadAdministrativa =
    almacenSeleccionado?.departamento?.nombre ?? bien.unidadAdministrativa;

  useEffect(() => {
    if (!draft.almacen || draft.almacen === baseline.almacen) {
      setResponsable({ nombre: bien.responsable, ci: bien.ciResponsable });
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
  }, [draft.almacen, baseline.almacen, almacenes, bien.responsable, bien.ciResponsable]);

  const valorTotalDocumento = useMemo(
    () => sumValorBienesDocumento(documentBienes, bien.codigoInterno, draft.valorAdquisicion),
    [documentBienes, bien.codigoInterno, draft.valorAdquisicion],
  );

  const isDirty = !draftsEqual(draft, baseline);

  const patchDraft = (patch: Partial<BienMuebleDetailDraft>) => {
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
      const codigo = bienCodigoPk(bien);
      const apiBien = await fetchApiBienByCodigo(codigo);
      const codigoBien = String(apiBien.codigo_bien);
      const sinSerial = isSinSerialBien(draft.serial);

      const bienPayload = apiBienToUpdatePayload(apiBien, {
        descripcion: draft.descripcion.trim(),
        marca: draft.marca.trim(),
        modelo: draft.modelo.trim(),
        color: draft.color.trim(),
        serial: serialBienToApi(draft.serial, codigoBien, { sinSerial }),
        estado_uso: estadoUsoToApi(draft.estadoUso),
        condicion_fisica: condicionFisicaToApi(draft.condicionFisica),
        valor_adquisicion: draft.valorAdquisicion,
        id_almacen: almacenMatch.id_almacen,
      });

      await updateBien(codigo, bienPayload);

      if (draft.valorAdquisicion !== baseline.valorAdquisicion) {
        setDocumentBienes((prev) =>
          mergeBienValorInDocumentoList(prev, bien.codigoInterno, draft.valorAdquisicion),
        );

        if (apiBien.documento) {
          setValorTotalDocumentoLoading(true);
          try {
            const bienesDoc = await fetchDocumentoBienes(readBienDocumentoId(apiBien));
            if (bienesDoc.length > 0) setDocumentBienes(bienesDoc);
          } finally {
            setValorTotalDocumentoLoading(false);
          }
        }
      }

      const documentChanged =
        draft.formaAdquisicion !== baseline.formaAdquisicion
        || draft.fechaAdquisicion !== baseline.fechaAdquisicion
        || draft.nombreProveedor !== baseline.nombreProveedor;

      if (documentChanged && apiBien.documento) {
        const fechaApi = toApiDateTime(draft.fechaAdquisicion);
        if (!fechaApi) {
          throw new Error('La fecha de adquisición no es válida');
        }

        await updateDocumento(readBienDocumentoId(apiBien), {
          numero_documento: apiBien.documento.numero_documento?.trim() || undefined,
          nombre_proveedor: draft.nombreProveedor.trim(),
          forma_adquisicion: formaAdquisicionToApi(draft.formaAdquisicion),
          fecha_adquisicion: fechaApi,
          moneda: monedaBienToDocumento(bien.moneda),
        });
      }

      notifyBienActualizado(bien, {
        estadoUso: draft.estadoUso !== baseline.estadoUso ? draft.estadoUso : undefined,
        condicionFisica:
          draft.condicionFisica !== baseline.condicionFisica ? draft.condicionFisica : undefined,
      });
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
