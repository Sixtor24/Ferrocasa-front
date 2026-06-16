import type { FormaAdquisicionDocumento } from '../api/services/documentos.service';
import type { FormaAdquisicion } from '../types/bien';

export const FORMAS_ADQUISICION_DOCUMENTO: { label: string; value: FormaAdquisicionDocumento }[] = [
  { label: 'Compra', value: 'Compra' },
  { label: 'Donación', value: 'Donacion' },
  { label: 'Confiscación', value: 'Confiscacion' },
];

export function formaAdquisicionToApi(value: FormaAdquisicion): FormaAdquisicionDocumento {
  if (value === 'Donación') return 'Donacion';
  if (value === 'Confiscación') return 'Confiscacion';
  return 'Compra';
}

export function formaAdquisicionDocumentoLabel(value: FormaAdquisicionDocumento): string {
  return FORMAS_ADQUISICION_DOCUMENTO.find((item) => item.value === value)?.label ?? value;
}
