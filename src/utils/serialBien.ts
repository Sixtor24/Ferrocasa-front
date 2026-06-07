/** Prefijo interno para bienes sin serial (evita violar UNIQUE en BD). */
const SIN_SERIAL_PREFIX = 'S/S:';

export function isSinSerialBien(serial?: string | null): boolean {
  const normalizado = (serial ?? '').trim().toUpperCase();
  if (normalizado.length === 0) return true;
  if (normalizado === 'S/S') return true;
  if (normalizado.startsWith(SIN_SERIAL_PREFIX)) return true;
  return false;
}

/**
 * Serial persistido en API/BD. Los bienes sin serial usan `S/S:{codigo_bien}` para
 * respetar la restricción UNIQUE sin cambiar la visualización en UI (S/S).
 */
export function serialBienToApi(
  serial: string | null | undefined,
  codigoBien: string,
  options?: { sinSerial?: boolean },
): string {
  const trimmed = serial?.trim() ?? '';
  const sinSerial =
    options?.sinSerial ?? isSinSerialBien(trimmed);

  if (!sinSerial) return trimmed;

  const codigo = codigoBien.trim();
  return codigo ? `${SIN_SERIAL_PREFIX}${codigo}` : `${SIN_SERIAL_PREFIX}${Date.now()}`;
}
