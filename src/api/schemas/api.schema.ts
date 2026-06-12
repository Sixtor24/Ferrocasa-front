import { z } from 'zod';

const numeric = z.union([z.number(), z.string()]).nullable().optional();
const dateLike = z.string().nullable().optional();

export const paginationMetaSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
});

export const baseSuccessSchema = z.object({
  success: z.literal(true),
  message: z.string().optional(),
});

export function itemResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return baseSuccessSchema.extend({ data: dataSchema });
}

export function listResponseSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return baseSuccessSchema.extend({
    data: z.array(itemSchema),
    meta: paginationMetaSchema.optional(),
  });
}

export const sedeSchema = z.object({
  id_sede: z.number(),
  nombre: z.string(),
  ubicacion: z.string().nullable().optional(),
  tipo: z.string().nullable().optional(),
}).passthrough();

export const departamentoSchema = z.object({
  id_departamento: z.number(),
  nombre: z.string(),
  id_sede: z.number().nullable().optional(),
  sede: sedeSchema.optional(),
}).passthrough();

export const responsableSchema: z.ZodTypeAny = z.lazy(() => z.object({
  ci_responsable: z.string(),
  nombre: z.string(),
  id_departamento: z.number().nullable().optional(),
  departamento: departamentoSchema.optional(),
}).passthrough());

export const almacenSchema: z.ZodTypeAny = z.lazy(() => z.object({
  id_almacen: z.number(),
  nombre: z.string(),
  id_sede: z.number().nullable().optional(),
  ci_responsable: z.string().nullable().optional(),
  id_departamento: z.number().nullable().optional(),
  sede: sedeSchema.optional(),
  departamento: departamentoSchema.optional(),
  responsable: responsableSchema.optional(),
}).passthrough());

export const categoriaGeneralSchema = z.object({
  id_categoria_general: z.number(),
  nombre: z.string(),
}).passthrough();

export const subcategoriaSchema: z.ZodTypeAny = z.lazy(() => z.object({
  id_subcategoria: z.number(),
  nombre: z.string(),
  id_categoria_general: z.number().nullable().optional(),
  categoria_general: categoriaGeneralSchema.optional(),
}).passthrough());

export const categoriaEspecificaSchema: z.ZodTypeAny = z.lazy(() => z.object({
  id_categoria_especifica: z.number(),
  nombre: z.string(),
  id_subcategoria: z.number().nullable().optional(),
  subcategoria: subcategoriaSchema.optional(),
}).passthrough());

export const documentoSchema = z.object({
  id_doc: z.union([z.number(), z.string()]),
  numero_documento: z.string().nullable().optional(),
  nombre_proveedor: z.string().nullable().optional(),
  forma_adquisicion: z.string().optional(),
  fecha_adquisicion: dateLike,
  moneda: z.string().optional(),
  id_sede: z.number().nullable().optional(),
  sede: sedeSchema.optional(),
}).passthrough();

export const rolSchema = z.object({
  id_rol: z.number(),
  nombre_rol: z.string(),
  descripcion: z.string(),
}).passthrough();

/** Rol anidado en auditoría/dashboard: el API a veces omite campos como `id_rol`. */
export const rolAuditoriaSchema = z.object({
  id_rol: z.number().optional(),
  nombre_rol: z.string().optional(),
  descripcion: z.string().optional(),
}).passthrough();

export const usuarioSchema = z.object({
  id_usuario: z.number(),
  nombre_usuario: z.string(),
  correo: z.string(),
  id_rol: z.number(),
  activo: z.boolean(),
  rol: rolSchema,
}).passthrough();

/** Perfil autenticado: el API a veces omite `rol.descripcion`. */
export const usuarioPerfilSchema = z.object({
  id_usuario: z.number(),
  nombre_usuario: z.string(),
  correo: z.string(),
  id_rol: z.number(),
  activo: z.boolean(),
  rol: z.object({
    id_rol: z.number(),
    nombre_rol: z.string(),
    descripcion: z.string().nullable().optional(),
  }).passthrough(),
}).passthrough();

/** Usuario anidado en auditoría: el API a veces omite campos como `activo`. */
export const usuarioAuditoriaSchema = z.object({
  id_usuario: z.number().optional(),
  nombre_usuario: z.string().optional(),
  correo: z.string().optional(),
  id_rol: z.number().optional(),
  activo: z.boolean().optional(),
  rol: rolAuditoriaSchema.optional(),
}).passthrough();

export const auditoriaRegistroSchema = z.object({
  id_auditoria: z.number(),
  nombre_tabla: z.string(),
  id_registro: z.number(),
  id_usuario: z.number(),
  accion: z.enum(['INSERT', 'UPDATE', 'DELETE']),
  fecha_cambio: z.string(),
  datos_previos: z.record(z.string(), z.unknown()).nullable().optional(),
  datos_nuevos: z.record(z.string(), z.unknown()).nullable().optional(),
  ip_origen: z.string().nullable().optional(),
  user_agent: z.string().nullable().optional(),
  usuario: usuarioAuditoriaSchema.optional(),
}).passthrough();

export const reporteDataSchema = z.object({
  success: z.literal(true),
  data: z.unknown(),
}).passthrough();

export const dashboardChartSeriesSchema = z.object({
  labels: z.array(z.string()),
  values: z.array(z.number()),
}).passthrough();

export const dashboardStatsSchema = z.object({
  inventario: z.object({
    bienes_edificio_administrativo: z.number(),
    bienes_cementerio: z.number(),
    parcelas: z.number(),
    vehiculos_maquinarias: z.number(),
  }),
  valoracion_total: z.number(),
  actividad: z.object({
    cambios_ultimos_7_dias: z.number(),
    protocolos_mes_actual: z.number(),
    usuarios_activos: z.number(),
  }),
  indicadores: z.object({
    parcelas_disponibles: z.number(),
    vehiculos_disponibles: z.number(),
    bienes_almacenados: z.number(),
  }),
}).passthrough();

export const dashboardActividadItemSchema = z.object({
  id_auditoria: z.number(),
  nombre_tabla: z.string(),
  id_registro: z.number(),
  accion: z.enum(['INSERT', 'UPDATE', 'DELETE']),
  fecha_cambio: z.string(),
  usuario: usuarioAuditoriaSchema.optional(),
}).passthrough();

export const dashboardActividadSchema = z.object({
  data: z.array(dashboardActividadItemSchema),
  total: z.number(),
}).passthrough();

export const dashboardAlertaSchema = z.object({
  tipo: z.enum(['danger', 'warning', 'info']),
  codigo: z.string(),
  titulo: z.string(),
  mensaje: z.string(),
  cantidad: z.number(),
}).passthrough();

export const dashboardAlertasSchema = z.object({
  data: z.array(dashboardAlertaSchema),
  total: z.number(),
  resumen: z.object({
    criticas: z.number(),
    advertencias: z.number(),
    informativas: z.number(),
  }),
}).passthrough();

export const dashboardGraficosSchema = z.object({
  anio: z.number(),
  parcelas_por_zona: dashboardChartSeriesSchema,
  bienes_por_almacen: dashboardChartSeriesSchema,
  vehiculos_por_estado: dashboardChartSeriesSchema,
  protocolos_por_mes: dashboardChartSeriesSchema,
  auditoria_ultimos_30_dias: dashboardChartSeriesSchema,
}).passthrough();

export const auditoriaResumenSchema = z.object({
  total: z.number(),
  porAccion: z.array(z.object({
    accion: z.string(),
    total: z.number(),
  })),
  porTabla: z.array(z.object({
    nombre_tabla: z.string(),
    total: z.number(),
  })),
  usuariosMasActivos: z.array(z.object({
    id_usuario: z.number(),
    total: z.number(),
    usuario: usuarioAuditoriaSchema.optional(),
  })),
  ultimosSieteDias: z.number(),
  ultimoCambio: z.string().nullable().optional(),
}).passthrough();

export const authSessionSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  tokenType: z.string(),
  usuario: usuarioSchema,
}).passthrough();

export const propiedadSchema: z.ZodTypeAny = z.lazy(() => z.object({
  numero_propiedad: z.number(),
  nombre: z.string(),
  ubicacion: z.string().nullable().optional(),
  documentos: z.array(documentoPropiedadSchema).optional(),
}).passthrough());

export const documentoPropiedadSchema: z.ZodTypeAny = z.lazy(() => z.object({
  id_documento_propiedad: z.number(),
  numero_documento: z.string().nullable().optional(),
  numero_propiedad: z.number(),
  forma_adquisicion: z.string(),
  area_total_m2: numeric,
  fecha_adquisicion: dateLike,
  valor_adquisicion: numeric.nullable().optional(),
  moneda: z.string().nullable().optional(),
  propiedad: propiedadSchema.optional(),
  parcelas: z.array(parcelaSchema).optional(),
}).passthrough());

export const protocoloSchema: z.ZodTypeAny = z.lazy(() => z.object({
  id_protocolo: z.number(),
  motivo: z.string(),
  id_beneficiado: z.string().nullable().optional(),
  fecha_protocolo: z.string(),
}).passthrough());

export const compromisoSchema: z.ZodTypeAny = z.lazy(() => z.object({
  id_comprometida: z.number(),
  id_protocolo: z.number(),
  cantidad_m2: z.union([z.number(), z.string()]),
  fecha_compromiso: dateLike,
  protocolo: protocoloSchema.optional(),
  parcelas: z.array(parcelaSchema).optional(),
}).passthrough());

export const desincorporacionSchema: z.ZodTypeAny = z.lazy(() => z.object({
  id_desincorporada: z.number(),
  id_protocolo: z.number(),
  cantidad_m2: z.union([z.number(), z.string()]),
  fecha_desincorporacion: dateLike,
  protocolo: protocoloSchema.optional(),
  parcelas: z.array(parcelaSchema).optional(),
}).passthrough());

export const parcelaSchema: z.ZodTypeAny = z.lazy(() => z.object({
  id_terreno: z.number(),
  nombre: z.string().nullable().optional(),
  zona: z.string().nullable().optional(),
  id_documento_propiedad: z.number(),
  id_desincorporada: z.number().nullable().optional(),
  id_comprometida: z.number().nullable().optional(),
  ci_responsable: z.string().nullable().optional(),
  zonificacion: z.string().nullable().optional(),
  observaciones: z.string().nullable().optional(),
  acreditacion_ambiental: z.string(),
  levantamiento_topografico: z.string(),
  valor_adquisicion: numeric.nullable().optional(),
  ubicacion_adicional: z.string().nullable().optional(),
  documento: documentoPropiedadSchema.optional(),
  responsable: responsableSchema.nullable().optional(),
  compromiso: compromisoSchema.nullable().optional(),
  desincorporacion: desincorporacionSchema.nullable().optional(),
}).passthrough());

export const bienSchema = z.object({
  codigo_bien: z.union([z.number(), z.string()]),
  descripcion: z.string().nullable().optional(),
  id_doc: z.string().nullable().optional(),
  fecha_ingreso: dateLike,
  fecha_egreso: dateLike,
  valor_adquisicion: numeric,
  marca: z.string().nullable().optional(),
  modelo: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  material: z.string().nullable().optional(),
  serial: z.string().nullable().optional(),
  estado_uso: z.string(),
  condicion_fisica: z.string(),
  id_almacen: z.number(),
  cantidad: z.number().optional(),
  consumibilidad: z.string().optional(),
  usuario_carga: z.string().nullable().optional(),
  id_categoria_especifica: z.number(),
  unidad_administrativa: z.string().nullable().optional(),
  observaciones: z.string().nullable().optional(),
  documento: documentoSchema.nullable().optional(),
  almacen: almacenSchema.optional(),
  categoria: categoriaEspecificaSchema.optional(),
}).passthrough();

export const vehiculoSchema = z.object({
  codigo: z.union([z.number(), z.string()]),
  descripcion: z.string().nullable().optional(),
  id_doc: z.number().nullable().optional(),
  fecha_egreso: dateLike,
  valor_adquisicion: numeric,
  marca: z.string().nullable().optional(),
  placa: z.string(),
  anio_fabricacion: z.number().nullable().optional(),
  modelo: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  serial_motor: z.string().nullable().optional(),
  serial_carroceria: z.string().nullable().optional(),
  estado_uso: z.string(),
  condicion_fisica: z.string(),
  id_categoria_especifica: z.number(),
  estado_vehiculo: z.string().optional(),
  ci_responsable: z.string().nullable().optional(),
  unidad_administrativa: z.string().nullable().optional(),
  id_almacen: z.number(),
  fecha_ingreso: dateLike,
  usuario_carga: z.string().nullable().optional(),
  observaciones: z.string().nullable().optional(),
  documento: documentoSchema.nullable().optional(),
  categoria: categoriaEspecificaSchema.optional(),
  responsable: responsableSchema.nullable().optional(),
  almacen: almacenSchema.optional(),
}).passthrough();

export const bienesStatsSchema = z.object({
  total: z.number(),
  perecederosVencidos: z.number(),
  valorTotal: numeric,
  porEstadoUso: z.array(z.object({ estado_uso: z.string(), _count: z.number() })).default([]),
  porCondicionFisica: z.array(z.object({ condicion_fisica: z.string(), _count: z.number() })).default([]),
  porConsumibilidad: z.array(z.object({ consumibilidad: z.string(), _count: z.number() })).default([]),
}).passthrough();

export const vehiculosStatsSchema = z.object({
  total: z.number(),
  disponibles: z.number().optional(),
  asignados: z.number().optional(),
  enMantenimiento: z.number().optional(),
  valorTotal: numeric,
  porEstadoUso: z.array(z.object({ estado_uso: z.string(), _count: z.number() })).optional(),
  porCondicionFisica: z.array(z.object({ condicion_fisica: z.string(), _count: z.number() })).optional(),
  porEstadoVehiculo: z.array(z.object({ estado_vehiculo: z.string(), _count: z.number() })).optional(),
}).passthrough();

export const parcelasStatsSchema = z.object({
  total: z.number(),
  comprometidas: z.number(),
  desincorporadas: z.number(),
  disponibles: z.number(),
  porZona: z.array(z.object({ zona: z.string().nullable(), _count: z.number() })).default([]),
}).passthrough();

export const documentosTotalesPorMesSchema = z.object({
  anio: z.number(),
  data: z.array(z.object({
    anio: z.number(),
    mes: z.number(),
    mes_label: z.string(),
    total_documentos: z.number(),
    monto_total: z.union([z.number(), z.string()]),
  })),
  resumen: z.object({
    total_documentos: z.number(),
    monto_total_anual: z.union([z.number(), z.string()]),
  }),
}).passthrough();

export const payloadSchemas = {
  login: z.object({
    nombre_usuario: z.string().min(1),
    password: z.string().min(1),
  }),
  refreshToken: z.object({
    refresh_token: z.string().min(1),
  }),
  cambiarPassword: z.object({
    password_actual: z.string().min(1),
    password_nueva: z.string().min(8),
    password_confirmacion: z.string().min(1),
  }).refine((data) => data.password_nueva === data.password_confirmacion, {
    message: 'La confirmación no coincide',
    path: ['password_confirmacion'],
  }),
  usuario: z.object({
    nombre_usuario: z.string().min(1),
    correo: z.string().email(),
    password: z.string().min(8),
    id_rol: z.number().int().positive(),
    activo: z.boolean(),
  }),
  updateUsuario: z.object({
    nombre_usuario: z.string().min(1),
    correo: z.string().email(),
    id_rol: z.number().int().positive(),
    activo: z.boolean(),
  }),
  activarUsuario: z.object({
    activo: z.boolean(),
  }),
  rol: z.object({
    nombre_rol: z.string().min(1),
    descripcion: z.string().min(1),
  }),
  parcela: z.object({
    nombre: z.string().min(1),
    zona: z.string().min(1),
    id_documento_propiedad: z.number().int(),
    id_desincorporada: z.number().int().nullable().optional(),
    id_comprometida: z.number().int().nullable().optional(),
    ci_responsable: z.string().min(1),
    zonificacion: z.string().min(1),
    observaciones: z.string().nullable().optional(),
    acreditacion_ambiental: z.enum(['Si_posee', 'No_posee']),
    levantamiento_topografico: z.enum(['Si', 'Solicitar']),
    valor_adquisicion: z.number().nonnegative().nullable().optional(),
    ubicacion_adicional: z.string().nullable().optional(),
  }),
  propiedad: z.object({
    numero_propiedad: z.number().int(),
    nombre: z.string().min(1),
    ubicacion: z.string().min(1),
  }),
  updatePropiedad: z.object({
    nombre: z.string().min(1),
    ubicacion: z.string().min(1),
  }),
  documentoPropiedad: z.object({
    numero_propiedad: z.number().int(),
    forma_adquisicion: z.enum(['Compra', 'Donacion', 'Confiscacion']),
    area_total_m2: z.number().positive(),
  }),
  protocolo: z.object({
    motivo: z.enum(['Venta', 'Ejecucion_de_obras', 'Afectado_por_bienhechurias_de_FMO']),
    id_beneficiado: z.string().nullable().optional(),
    fecha_protocolo: z.string().min(1),
  }),
  desincorporacion: z.object({
    id_protocolo: z.number().int(),
    cantidad_m2: z.number().nonnegative(),
    fecha_desincorporacion: z.string().min(1),
  }),
  compromiso: z.object({
    id_protocolo: z.number().int(),
    cantidad_m2: z.number().nonnegative(),
    fecha_compromiso: z.string().min(1),
  }),
  sede: z.object({
    nombre: z.string().min(1),
    ubicacion: z.string().min(1),
    tipo: z.string().min(1),
  }),
  departamento: z.object({
    nombre: z.string().min(1),
    id_sede: z.number().int(),
  }),
  responsable: z.object({
    ci_responsable: z.string().min(6),
    nombre: z.string().min(1),
    id_departamento: z.number().int(),
  }),
  updateResponsable: z.object({
    nombre: z.string().min(1),
    id_departamento: z.number().int(),
  }),
  almacen: z.object({
    nombre: z.string().min(1),
    id_sede: z.number().int(),
    ci_responsable: z.string().min(1),
    id_departamento: z.number().int(),
  }),
  bien: z.object({
    codigo_bien: z.string().trim().min(1),
    descripcion: z.string().min(1),
    id_doc: z.number().int(),
    fecha_ingreso: z.string().min(1),
    fecha_egreso: z.string().nullable().optional(),
    valor_adquisicion: z.number().nonnegative(),
    marca: z.string().min(1),
    modelo: z.string().nullable().optional(),
    color: z.string().nullable().optional(),
    material: z.string().nullable().optional(),
    serial: z.string().min(1),
    estado_uso: z.enum(['En_Uso', 'En_Reparacion', 'Dado_de_Baja', 'Almacenado']),
    condicion_fisica: z.enum(['Bueno', 'Regular', 'Dañado', 'Averiado', 'Inservible']),
    id_almacen: z.number().int(),
    cantidad: z.number().int().positive(),
    consumibilidad: z.enum(['Perecederos', 'No_perecedero']),
    usuario_carga: z.string().nullable().optional(),
    id_categoria_especifica: z.number().int(),
    observaciones: z.string().nullable().optional(),
  }),
  vehiculo: z.object({
    descripcion: z.string().optional(),
    id_doc: z.number().int().nullable().optional(),
    fecha_egreso: z.string().nullable().optional(),
    valor_adquisicion: z.number().nonnegative().optional(),
    marca: z.string().nullable().optional(),
    placa: z.string().min(1),
    anio_fabricacion: z.number().int().min(1900).max(2100).optional(),
    modelo: z.string().nullable().optional(),
    color: z.string().nullable().optional(),
    serial_motor: z.string().nullable().optional(),
    serial_carroceria: z.string().nullable().optional(),
    estado_uso: z.enum(['En_Uso', 'En_Reparacion', 'Dado_de_Baja', 'Almacenado']).optional(),
    condicion_fisica: z.enum(['Bueno', 'Regular', 'Dañado']).optional(),
    id_categoria_especifica: z.number().int(),
    estado_vehiculo: z.enum(['Carga_Parcial', 'Carga_Completa', 'Disponible', 'Asignado', 'En_Mantenimiento']).optional(),
    ci_responsable: z.string().nullable().optional(),
    id_almacen: z.number().int(),
    fecha_ingreso: z.string().nullable().optional(),
    usuario_carga: z.string().nullable().optional(),
    observaciones: z.string().nullable().optional(),
  }),
  asignarVehiculo: z.object({
    ci_responsable: z.string().min(1),
  }),
  cambiarEstadoVehiculo: z.object({
    estado_vehiculo: z.enum(['Carga_Parcial', 'Carga_Completa', 'Disponible', 'Asignado', 'En_Mantenimiento']),
    estado_uso: z.enum(['En_Uso', 'En_Reparacion', 'Dado_de_Baja', 'Almacenado']),
  }),
  cambiarEstadoBien: z.object({
    estado_uso: z.enum(['En_Uso', 'En_Reparacion', 'Dado_de_Baja', 'Almacenado']),
  }),
  categoriaGeneral: z.object({ nombre: z.string().min(1) }),
  subcategoria: z.object({
    nombre: z.string().min(1),
    id_categoria_general: z.number().int(),
  }),
  categoriaEspecifica: z.object({
    nombre: z.string().min(1),
    id_subcategoria: z.number().int(),
  }),
  documento: z.object({
    numero_documento: z.string().optional(),
    nombre_proveedor: z.string().min(1),
    forma_adquisicion: z.enum(['Compra', 'Donacion', 'Confiscacion']),
    fecha_adquisicion: z.string().min(1),
    moneda: z.enum(['VES', 'USD', 'EUR']),
    id_sede: z.number().int().positive().optional(),
  }),
  simpleName: z.object({ nombre: z.string().min(1) }),
};
