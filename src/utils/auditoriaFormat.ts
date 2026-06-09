import type { AuditoriaAccion, AuditoriaRegistroApi } from '../types/auditoria';

const TABLA_LABELS: Record<string, string> = {
  Bien: 'Bienes',
  VehiculoMaquinaria: 'Vehículos y maquinaria',
  Parcela: 'Terrenos / parcelas',
  Propiedad: 'Propiedades',
  Documento: 'Documentos',
  DocumentoPropiedad: 'Documentos de propiedad',
  Usuario: 'Usuarios',
  Rol: 'Roles',
  Almacen: 'Almacenes',
  Protocolo: 'Protocolos',
  Compromiso: 'Compromisos',
  Desincorporacion: 'Desincorporaciones',
  Responsable: 'Responsables',
  Sede: 'Sedes',
  Departamento: 'Departamentos',
};

export const AUDITORIA_ACCIONES: AuditoriaAccion[] = ['INSERT', 'UPDATE', 'DELETE'];

export const AUDITORIA_TABLAS = Object.keys(TABLA_LABELS).sort();

export function buildTablasAuditoriaOptions(
  porTabla: Array<{ nombre_tabla: string; total: number }> = [],
): string[] {
  const nombres = new Set<string>([...AUDITORIA_TABLAS, ...porTabla.map((item) => item.nombre_tabla)]);
  return [...nombres].sort((a, b) =>
    labelTablaAuditoria(a).localeCompare(labelTablaAuditoria(b), 'es'),
  );
}

export function labelTablaAuditoria(nombreTabla: string): string {
  return TABLA_LABELS[nombreTabla] ?? nombreTabla;
}

export function formatFechaAuditoria(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('es-VE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export function inicialesUsuario(nombre: string): string {
  return nombre
    .split(/[.\s_@-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '—';
}

function formatValorCampo(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function describirCambioAuditoria(registro: AuditoriaRegistroApi): string {
  const { accion, nombre_tabla, id_registro, datos_previos, datos_nuevos } = registro;
  const tabla = labelTablaAuditoria(nombre_tabla);

  if (accion === 'INSERT') {
    const campos = datos_nuevos ? Object.keys(datos_nuevos).slice(0, 3) : [];
    const detalle = campos.length ? ` (${campos.join(', ')})` : '';
    return `Creación en ${tabla} #${id_registro}${detalle}`;
  }

  if (accion === 'DELETE') {
    return `Eliminación en ${tabla} #${id_registro}`;
  }

  const previos = datos_previos ?? {};
  const nuevos = datos_nuevos ?? {};
  const claves = [...new Set([...Object.keys(previos), ...Object.keys(nuevos)])].slice(0, 4);

  if (!claves.length) {
    return `Actualización en ${tabla} #${id_registro}`;
  }

  const cambios = claves
    .map((clave) => {
      const antes = formatValorCampo(previos[clave]);
      const despues = formatValorCampo(nuevos[clave]);
      if (antes === despues) return null;
      return `${clave}: ${antes} → ${despues}`;
    })
    .filter(Boolean);

  if (!cambios.length) {
    return `Actualización en ${tabla} #${id_registro}`;
  }

  return `${tabla} #${id_registro}: ${cambios.join('; ')}`;
}

export function accionAuditoriaColor(accion: AuditoriaAccion): string {
  if (accion === 'INSERT') return 'text-green-600';
  if (accion === 'DELETE') return 'text-red-600';
  return 'text-blue-600';
}

export function accionAuditoriaLabel(accion: AuditoriaAccion): string {
  if (accion === 'INSERT') return 'Creación';
  if (accion === 'DELETE') return 'Eliminación';
  return 'Actualización';
}

export function toIsoInicioDia(fecha: string): string {
  return `${fecha}T00:00:00.000Z`;
}

export function toIsoFinDia(fecha: string): string {
  return `${fecha}T23:59:59.999Z`;
}
