export type RoleName =
  | 'Super Administrador'
  | 'Administrador'
  | 'Coordinador'
  | 'Analista'
  | 'Almacenista'
  | string;

export interface RolSistema {
  id_rol: number;
  nombre_rol: RoleName;
  descripcion: string;
}

export interface UsuarioSistema {
  id_usuario: number;
  nombre_usuario: string;
  correo: string;
  id_rol: number;
  activo: boolean;
  rol: RolSistema;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer' | string;
}

export interface AuthSession extends AuthTokens {
  usuario: UsuarioSistema;
}

export interface LoginPayload {
  nombre_usuario: string;
  password: string;
}

export interface ChangePasswordPayload {
  password_actual: string;
  password_nueva: string;
  password_confirmacion: string;
}

export interface UsuarioPayload {
  nombre_usuario: string;
  correo: string;
  password: string;
  id_rol: number;
  activo: boolean;
}

export interface UpdateUsuarioPayload {
  nombre_usuario: string;
  correo: string;
  id_rol: number;
  activo: boolean;
}

export interface ActivarUsuarioPayload {
  activo: boolean;
}

export interface RolPayload {
  nombre_rol: string;
  descripcion: string;
}
