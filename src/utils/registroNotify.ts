import { toast } from 'sonner';
import { ApiError } from '../api/client';
import { ApiValidationError } from '../api/validation';
import { formatApiErrorMessage } from './apiErrorMessage';

const PAYLOAD_FIELD_MESSAGES: Record<string, string> = {
  cantidad: 'La cantidad debe ser mayor a 0 en cada ítem.',
  anio_fabricacion: 'El año de fabricación debe estar entre 1900 y 2100.',
  valor_adquisicion: 'Indique un valor de adquisición válido.',
  id_categoria_especifica: 'Seleccione una categoría específica válida.',
  id_almacen: 'El almacén seleccionado no es válido.',
  placa: 'La placa del vehículo es obligatoria.',
};

export function extractRegistroError(err: unknown, fallback: string): string {
  if (err instanceof ApiValidationError) {
    const field = String(err.issues?.[0]?.path?.[0] ?? '');
    if (field && PAYLOAD_FIELD_MESSAGES[field]) return PAYLOAD_FIELD_MESSAGES[field];
    const detail = err.issues?.[0]?.message;
    return detail ? `Datos inválidos: ${detail}` : 'Los datos del registro no cumplen las reglas del sistema.';
  }
  if (err instanceof ApiError) {
    return formatApiErrorMessage(err.body, err.message);
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

export function notifyRegistroSuccess(message: string) {
  toast.success('Registro cargado exitosamente', { description: message });
}

export function notifyRegistroError(message: string, description?: string) {
  toast.error(message, description ? { description } : undefined);
}
