import type { UsuarioSistema } from './auth';

export type AuditoriaAccion = 'INSERT' | 'UPDATE' | 'DELETE';

export interface AuditoriaRegistroApi {
  id_auditoria: number;
  nombre_tabla: string;
  id_registro: number;
  id_usuario: number;
  accion: AuditoriaAccion;
  fecha_cambio: string;
  datos_previos?: Record<string, unknown> | null;
  datos_nuevos?: Record<string, unknown> | null;
  ip_origen?: string | null;
  user_agent?: string | null;
  usuario?: UsuarioSistema;
}

export interface AuditoriaResumenApi {
  total: number;
  porAccion: Array<{ accion: string; total: number }>;
  porTabla: Array<{ nombre_tabla: string; total: number }>;
  usuariosMasActivos: Array<{
    id_usuario: number;
    total: number;
    usuario?: UsuarioSistema;
  }>;
  ultimosSieteDias: number;
  ultimoCambio?: string | null;
}

export interface AuditoriaRegistroView {
  id: number;
  fecha: string;
  usuario: string;
  iniciales: string;
  tabla: string;
  tablaLabel: string;
  idRegistro: number;
  accion: AuditoriaAccion;
  descripcion: string;
  ip: string;
  raw: AuditoriaRegistroApi;
}
