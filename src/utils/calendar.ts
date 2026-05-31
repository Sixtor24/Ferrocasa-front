/** Días de la semana (lunes a domingo) para gráficas semanales. */
export const DIAS_SEMANA = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'] as const;

export const MESES_CALENDARIO = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const;

export const MESES_CORTOS = [
  'ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN',
  'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC',
] as const;

/**
 * Año bisiesto gregoriano: divisible entre 4, excepto siglos no divisibles entre 400.
 * Caso de uso: febrero tiene 29 días (p. ej. 2024, 2028).
 */
export function isLeapYear(year: number): boolean {
  if (!Number.isInteger(year)) return false;
  if (year % 400 === 0) return true;
  if (year % 100 === 0) return false;
  return year % 4 === 0;
}

/** Cantidad de días de un mes (monthIndex 0 = enero, 11 = diciembre). */
export function getDaysInMonth(year: number, monthIndex: number): number {
  const month = Math.min(11, Math.max(0, monthIndex));
  return new Date(year, month + 1, 0).getDate();
}

/** Etiquetas 1..N para el eje X mensual según año y mes (28/29/30/31). */
export function getDiasDelMesLabels(year: number, monthIndex: number): string[] {
  const total = getDaysInMonth(year, monthIndex);
  return Array.from({ length: total }, (_, index) => String(index + 1));
}

export function febreroEnBisiesto(year: number, monthIndex: number): boolean {
  return monthIndex === 1 && isLeapYear(year);
}

export type DiaSemanaMes = {
  dia: number;
  etiqueta: string;
};

export type SemanaDelMes = {
  index: number;
  label: string;
  desde: number;
  hasta: number;
  dias: DiaSemanaMes[];
};

/** Índice lunes=0 … domingo=6 a partir de Date.getDay(). */
export function weekdayIndexMondayFirst(date: Date): number {
  const day = date.getDay();
  return day === 0 ? 6 : day - 1;
}

export function etiquetaDiaSemana(year: number, monthIndex: number, dayOfMonth: number): string {
  const date = new Date(year, monthIndex, dayOfMonth);
  return DIAS_SEMANA[weekdayIndexMondayFirst(date)];
}

/**
 * Divide el mes en bloques de hasta 7 días (1-7, 8-14, …).
 * La última semana puede tener menos de 7 (p. ej. febrero bisiesto: 29 solo).
 */
export function getSemanasDelMes(year: number, monthIndex: number): SemanaDelMes[] {
  const total = getDaysInMonth(year, monthIndex);
  const semanas: SemanaDelMes[] = [];

  for (let desde = 1; desde <= total; desde += 7) {
    const hasta = Math.min(desde + 6, total);
    const dias: DiaSemanaMes[] = [];

    for (let dia = desde; dia <= hasta; dia++) {
      dias.push({
        dia,
        etiqueta: etiquetaDiaSemana(year, monthIndex, dia),
      });
    }

    semanas.push({
      index: semanas.length,
      label: `Semana ${semanas.length + 1} (${desde}-${hasta})`,
      desde,
      hasta,
      dias,
    });
  }

  return semanas;
}
