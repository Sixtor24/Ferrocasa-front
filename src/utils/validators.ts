import type { ZodSchema } from 'zod';

/**
 * Valida un objeto contra un schema Zod y retorna errores formateados
 */
export function validarConZod<T>(schema: ZodSchema<T>, data: unknown): { success: boolean; data?: T; errors: Record<string, string> } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data, errors: {} };
  }
  const errors: Record<string, string> = {};
  result.error.issues.forEach((issue) => {
    const path = issue.path.join('.');
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  });
  return { success: false, errors };
}

/**
 * Detecta duplicados en un array por campo
 */
export function detectarDuplicados<T>(items: T[], campo: keyof T): T[] {
  const seen = new Map<unknown, number>();
  const duplicados: T[] = [];
  items.forEach((item) => {
    const val = item[campo];
    const count = seen.get(val) || 0;
    seen.set(val, count + 1);
    if (count === 1) duplicados.push(item);
  });
  return duplicados;
}

/**
 * Verifica si una fecha string es válida
 */
export function esFechaValida(fecha: string): boolean {
  if (!fecha) return false;
  const d = new Date(fecha);
  return !isNaN(d.getTime()) && d.getFullYear() > 1900;
}
