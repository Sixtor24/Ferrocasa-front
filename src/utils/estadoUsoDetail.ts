import type { EstadoUso } from '../types/bien';

export const ESTADOS_USO_REACTIVACION: EstadoUso[] = ['En uso', 'En obsolescencia'];

export function getEstadoUsoDetailSelectConfig(params: {
  retirado: boolean;
  canWriteAssets: boolean;
  canReactivateEstadoUso: boolean;
  allOptions: readonly EstadoUso[];
  currentValue: EstadoUso;
}) {
  const { retirado, canWriteAssets, canReactivateEstadoUso, allOptions, currentValue } = params;
  const puedeEditarRetirado = retirado && canReactivateEstadoUso;

  if (puedeEditarRetirado) {
    const options: EstadoUso[] = currentValue === 'Obsoleto'
      ? ['Obsoleto', ...ESTADOS_USO_REACTIVACION]
      : [...ESTADOS_USO_REACTIVACION];

    return {
      disabled: false,
      options,
    };
  }

  return {
    disabled: (!canWriteAssets && !puedeEditarRetirado) || (retirado && !canReactivateEstadoUso),
    options: [...allOptions],
  };
}

export function canGuardarEstadoUsoDetalle(params: {
  retirado: boolean;
  canWriteAssets: boolean;
  canReactivateEstadoUso: boolean;
  isDirty: boolean;
}): boolean {
  if (!params.isDirty) return false;
  if (!params.retirado) return params.canWriteAssets;
  return params.canReactivateEstadoUso;
}
