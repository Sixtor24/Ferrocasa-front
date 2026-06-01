// Reportes y auditoría

export type TipoMovimiento = 'Entrada' | 'Salida' | 'Traslado' | 'Baja' | 'Asignación' | 'Corrección' | 'Importación';
import type { ModuloMenu } from '../data/modulosMenu';
import { MODULO_SISTEMA } from '../data/modulosMenu';

export type ModuloSistema = ModuloMenu | typeof MODULO_SISTEMA;

export interface MovimientoAuditoria {
  id: number;
  fecha: string;
  hora: string;
  usuario: string;
  iniciales: string;
  modulo: ModuloSistema;
  tipoMovimiento: TipoMovimiento;
  descripcion: string;
  registroAfectado: string;
  ip: string;
}

export interface ReporteExportable {
  id: string;
  titulo: string;
  modulo: ModuloSistema;
  tipo: 'PDF' | 'Excel' | 'CSV';
  fechaGeneracion: string;
  registros: number;
  generadoPor: string;
}
