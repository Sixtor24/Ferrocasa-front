import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { levantamientoTopograficoToApi, mapLevantamientoTopografico } from '../../api/mappers/enums';
import {
  fetchDocumentoPropiedadById,
  updateDocumentoPropiedad,
  type FormaAdquisicionPropiedad,
} from '../../api/services/documentos-propiedad.service';
import { updateParcela, type ParcelaPayload } from '../../api/services/parcelas.service';
import type { ApiParcela } from '../../api/types';
import type { FormaAdquisicion } from '../../types/bien';
import type { Terreno } from '../../types/terreno';
import { formaAdquisicionToApi } from '../../utils/formaAdquisicionMappers';
import { buildParcelaObservacionesMeta } from '../../utils/parcelaFechaMeta';

export type TerrenoParcelaDetailDraft = {
  identificacion: string;
  zona: string;
  ubicacionAdicional: string;
  zonificacion: string;
  observacion: string;
  valorAdquisicion: number;
  acreditacionTecnicaAmbiental: Terreno['acreditacionTecnicaAmbiental'];
  levantamientoTopografico: Terreno['levantamientoTopografico'];
  formaAdquisicion: FormaAdquisicion;
};

function textDraft(value: string) {
  return value === '—' ? '' : value;
}

function formaAdquisicionFromTerreno(value: string): FormaAdquisicion {
  const normalized = value.trim();
  if (normalized === 'Donacion' || normalized === 'Donación') return 'Donación';
  if (normalized === 'Confiscacion' || normalized === 'Confiscación') return 'Confiscación';
  return 'Compra';
}

function acreditacionEstadoToApi(value: Terreno['acreditacionTecnicaAmbiental']) {
  if (value === 'Sí') return 'Si_posee';
  return 'No_posee';
}

function entityIdAsString(value: number | string | null | undefined): string {
  if (value == null || value === '') {
    throw new Error('ID de documento de propiedad inválido');
  }
  return String(value);
}

function nullableEntityIdAsNumber(value: number | string | null | undefined): number | null {
  if (value == null || value === '') return null;
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) {
    throw new Error('ID de entidad inválido');
  }
  return num;
}

function parcelaPayloadFromApi(
  raw: ApiParcela,
  overrides: Partial<Pick<ParcelaPayload, 'id_comprometida' | 'id_desincorporada'>> = {},
): ParcelaPayload {
  const idTerreno = raw.codigo?.trim() || entityIdAsString(raw.id_terreno);
  return {
    id_terreno: idTerreno,
    nombre: raw.nombre ?? `Parcela ${idTerreno}`,
    zona: raw.zona ?? 'Sin zona',
    id_documento_propiedad: entityIdAsString(raw.id_documento_propiedad),
    id_desincorporada: overrides.id_desincorporada
      ?? nullableEntityIdAsNumber(raw.id_desincorporada),
    id_comprometida: overrides.id_comprometida
      ?? nullableEntityIdAsNumber(raw.id_comprometida),
    ci_responsable: raw.ci_responsable ?? raw.responsable?.ci_responsable ?? '0',
    zonificacion: raw.zonificacion ?? 'Sin zonificar',
    observaciones: raw.observaciones ?? null,
    acreditacion_ambiental: raw.acreditacion_ambiental,
    levantamiento_topografico: levantamientoTopograficoToApi(
      mapLevantamientoTopografico(raw.levantamiento_topografico),
    ),
    valor_adquisicion:
      raw.valor_adquisicion != null
        ? Number(raw.valor_adquisicion)
        : raw.documento?.valor_adquisicion != null
          ? Number(raw.documento.valor_adquisicion)
          : null,
    ubicacion_adicional: raw.ubicacion_adicional ?? null,
  };
}

function draftFromTerreno(terreno: Terreno): TerrenoParcelaDetailDraft {
  return {
    identificacion: textDraft(terreno.identificacion),
    zona: textDraft(terreno.zona),
    ubicacionAdicional: textDraft(terreno.ubicacionAdicional),
    zonificacion: textDraft(terreno.zonificacion),
    observacion: textDraft(terreno.observacion),
    valorAdquisicion: terreno.valorAdquisicion ?? 0,
    acreditacionTecnicaAmbiental: terreno.acreditacionTecnicaAmbiental,
    levantamientoTopografico: terreno.levantamientoTopografico,
    formaAdquisicion: formaAdquisicionFromTerreno(terreno.formaAdquisicion),
  };
}

function draftsEqual(a: TerrenoParcelaDetailDraft, b: TerrenoParcelaDetailDraft) {
  return (
    a.identificacion === b.identificacion
    && a.zona === b.zona
    && a.ubicacionAdicional === b.ubicacionAdicional
    && a.zonificacion === b.zonificacion
    && a.observacion === b.observacion
    && a.valorAdquisicion === b.valorAdquisicion
    && a.acreditacionTecnicaAmbiental === b.acreditacionTecnicaAmbiental
    && a.levantamientoTopografico === b.levantamientoTopografico
    && a.formaAdquisicion === b.formaAdquisicion
  );
}

type UseTerrenoParcelaDetailEditParams = {
  terreno: Terreno;
  raw: ApiParcela;
  disabled?: boolean;
  onSaved?: () => void | Promise<void>;
};

export function useTerrenoParcelaDetailEdit({
  terreno,
  raw,
  disabled = false,
  onSaved,
}: UseTerrenoParcelaDetailEditParams) {
  const baseline = useMemo(() => draftFromTerreno(terreno), [terreno]);
  const [draft, setDraft] = useState(baseline);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(baseline);
  }, [baseline]);

  const isDirty = !draftsEqual(draft, baseline);

  const patchDraft = (patch: Partial<TerrenoParcelaDetailDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
  };

  const guardarCambio = async () => {
    if (!isDirty || saving || disabled) return;

    setSaving(true);
    try {
      const observaciones = buildParcelaObservacionesMeta(draft.observacion, {
        codigo: terreno.codigo,
        fechaAdquisicion: terreno.fechaAdquisicion,
        fechaIngreso: terreno.fechaIngreso,
        numeroDocumento: terreno.numeroDocumento,
      });

      await updateParcela(terreno.id, {
        ...parcelaPayloadFromApi(raw),
        nombre: draft.identificacion.trim(),
        zona: draft.zona.trim() || 'Sin zona',
        ubicacion_adicional: draft.ubicacionAdicional.trim() || null,
        zonificacion: draft.zonificacion.trim() || 'Sin zonificar',
        observaciones,
        valor_adquisicion: draft.valorAdquisicion,
        acreditacion_ambiental: acreditacionEstadoToApi(draft.acreditacionTecnicaAmbiental),
        levantamiento_topografico: levantamientoTopograficoToApi(draft.levantamientoTopografico),
      });

      if (draft.formaAdquisicion !== baseline.formaAdquisicion && raw.id_documento_propiedad) {
        const documento = await fetchDocumentoPropiedadById(raw.id_documento_propiedad);
        const docId = Number(documento.id_documento_propiedad);
        await updateDocumentoPropiedad(docId, {
          id_documento_propiedad: String(documento.id_documento_propiedad),
          numero_propiedad: Number(documento.numero_propiedad),
          forma_adquisicion: formaAdquisicionToApi(draft.formaAdquisicion) as FormaAdquisicionPropiedad,
          area_total_m2: Number(documento.area_total_m2 ?? terreno.areaTotalM2),
        });
      }

      toast.success('Cambio guardado', {
        description: `${terreno.codigo}: datos actualizados correctamente.`,
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

  return {
    draft,
    patchDraft,
    isDirty,
    saving,
    guardarCambio,
    parcelaPayloadFromApi,
  };
}
