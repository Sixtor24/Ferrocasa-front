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
  id_doc: 'El documento de ingreso (id_doc) es obligatorio. Indique el número de documento.',
  id_documento_propiedad: 'Indique el nro de documento (letras, números y caracteres especiales, hasta 20).',
  numero_propiedad: 'Indique el nro de propiedad.',
  id_terreno: 'Indique el código de la parcela en cada ítem.',
  codigo: 'El código del vehículo es obligatorio en cada ítem.',
  placa: 'La placa del vehículo es obligatoria.',
};

export function extractRegistroError(err: unknown, fallback: string): string {
  if (err instanceof ApiValidationError) {
    const field = String(err.issues?.[0]?.path?.[0] ?? '');
    if (field && PAYLOAD_FIELD_MESSAGES[field]) return PAYLOAD_FIELD_MESSAGES[field];
    const path = err.issues?.[0]?.path?.join('.') ?? '';
    const detail = err.issues?.[0]?.message;
    if (path && detail) return `${path}: ${detail}`;
    return detail ? `Datos inválidos: ${detail}` : 'Los datos del registro no cumplen las reglas del sistema.';
  }
  if (err instanceof ApiError) {
    const message = formatApiErrorMessage(err.body, err.message);
    if (/id_doc/i.test(message) && PAYLOAD_FIELD_MESSAGES.id_doc) {
      return PAYLOAD_FIELD_MESSAGES.id_doc;
    }
    if (/Unique constraint failed on the fields:\s*\(`placa`\)/i.test(message)) {
      return 'La placa ya está registrada en otro vehículo. Use una placa distinta.';
    }
    if (/Unique constraint failed on the fields:\s*\(`serial_carroceria`\)/i.test(message)) {
      return 'El serial de carrocería ya existe o está duplicado. Indique un serial distinto o déjelo vacío.';
    }
    if (/Unique constraint failed on the fields:\s*\(`serial_motor`\)/i.test(message)) {
      return 'El serial del motor ya está registrado. Indique un serial distinto.';
    }
    if (/Unique constraint failed on the fields:\s*\(`codigo`\)/i.test(message)) {
      return 'El código del vehículo ya está registrado. Use un código distinto.';
    }
    if (/Unique constraint failed on the fields:\s*\(`id_documento_propiedad`\)/i.test(message)) {
      return 'El nro de documento ya está registrado. Puede reutilizarlo en nuevas parcelas de la misma propiedad.';
    }
    if (/Unique constraint failed on the fields:\s*\(`numero_propiedad`\)/i.test(message)) {
      return 'El nro de propiedad ya existe; se reutilizará para este registro.';
    }
    return message;
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
