import { z, ZodError } from 'zod';
import { entityIdForApi, vehiculoCodigoForApi, vehiculoSerialCreateForApi } from '../utils/vehiculoApiFields';
import {
  almacenSchema,
  auditoriaRegistroSchema,
  auditoriaResumenSchema,
  dashboardActividadSchema,
  dashboardAlertasSchema,
  dashboardGraficosSchema,
  dashboardStatsSchema,
  reporteDataSchema,
  authSessionSchema,
  bienSchema,
  bienesStatsSchema,
  categoriaEspecificaSchema,
  categoriaGeneralSchema,
  compromisoSchema,
  departamentoSchema,
  desincorporacionSchema,
  documentoPropiedadSchema,
  documentoSchema,
  documentosTotalesPorMesSchema,
  itemResponseSchema,
  listResponseSchema,
  parcelaSchema,
  parcelasStatsSchema,
  payloadSchemas,
  propiedadSchema,
  protocoloSchema,
  responsableSchema,
  rolSchema,
  sedeSchema,
  subcategoriaSchema,
  usuarioPerfilSchema,
  usuarioSchema,
  vehiculoSchema,
  vehiculosStatsSchema,
} from './schemas/api.schema';

export class ApiValidationError extends Error {
  constructor(message: string, public issues?: ZodError['issues']) {
    super(message);
    this.name = 'ApiValidationError';
  }
}

function readableZodError(error: ZodError) {
  const first = error.issues[0];
  const path = first?.path.length ? first.path.join('.') : 'respuesta';
  return `Respuesta inválida del API en ${path}: ${first?.message ?? 'schema inválido'}`;
}

function parseWithSchema<T>(schema: z.ZodType<T>, value: unknown): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new ApiValidationError(readableZodError(parsed.error), parsed.error.issues);
  }
  return parsed.data;
}

function normalizePath(path: string) {
  return (path.startsWith('/') ? path : `/${path}`).split('?')[0];
}

function relationArrayResponse(schema: z.ZodTypeAny) {
  return z.union([itemResponseSchema(z.array(schema)), listResponseSchema(schema)]);
}

function listOrCreateResponse(method: string, itemSchema: z.ZodTypeAny) {
  if (method === 'POST') return itemResponseSchema(itemSchema);
  return listResponseSchema(itemSchema);
}

export function getResponseSchema(path: string, method = 'GET') {
  const p = normalizePath(path);

  if (p === '/auth/login' || p === '/auth/refresh-token') return itemResponseSchema(authSessionSchema);
  if (p === '/auth/perfil') return itemResponseSchema(usuarioPerfilSchema);
  if (p === '/auth/logout' || p === '/auth/cambiar-password') return z.object({
    success: z.literal(true),
    message: z.string().optional(),
  }).passthrough();

  if (p === '/usuarios') return listOrCreateResponse(method, usuarioSchema);
  if (p.startsWith('/usuarios/rol/')) return relationArrayResponse(usuarioSchema);
  if (p.endsWith('/activar') && p.startsWith('/usuarios/')) return itemResponseSchema(usuarioSchema);
  if (p.startsWith('/usuarios/')) return itemResponseSchema(usuarioSchema);

  if (p === '/roles') return listOrCreateResponse(method, rolSchema);
  if (p.endsWith('/usuarios') && p.startsWith('/roles/')) return relationArrayResponse(usuarioSchema);
  if (p.startsWith('/roles/')) return itemResponseSchema(rolSchema);

  if (p === '/bienes/estadisticas') return itemResponseSchema(bienesStatsSchema);
  if (p.startsWith('/bienes/') && p !== '/bienes/vencidos') return itemResponseSchema(bienSchema);
  if (p === '/bienes') return listOrCreateResponse(method, bienSchema);
  if (p === '/bienes/vencidos' || p.startsWith('/bienes/almacen/') || p.startsWith('/bienes/categoria/') || p.startsWith('/bienes/estado/')) {
    return relationArrayResponse(bienSchema);
  }

  if (p === '/vehiculos/estadisticas') return itemResponseSchema(vehiculosStatsSchema);
  if (p === '/vehiculos') return listOrCreateResponse(method, vehiculoSchema);
  if (p === '/vehiculos/disponibles' || p.startsWith('/vehiculos/responsable/') || p.startsWith('/vehiculos/almacen/')) {
    return relationArrayResponse(vehiculoSchema);
  }
  if (p.startsWith('/vehiculos/')) return itemResponseSchema(vehiculoSchema);

  if (p === '/parcelas/estadisticas') return itemResponseSchema(parcelasStatsSchema);
  if (p === '/parcelas' || p === '/parcelas/buscar') return listOrCreateResponse(method, parcelaSchema);
  if (p === '/parcelas/disponibles' || p === '/parcelas/comprometidas' || p === '/parcelas/desincorporadas' || p.startsWith('/parcelas/responsable/')) {
    return relationArrayResponse(parcelaSchema);
  }
  if (p.startsWith('/parcelas/')) return itemResponseSchema(parcelaSchema);

  if (p === '/propiedades' || p === '/propiedades/buscar') return listOrCreateResponse(method, propiedadSchema);
  if (p.endsWith('/parcelas') && p.startsWith('/propiedades/')) return relationArrayResponse(parcelaSchema);
  if (p.startsWith('/propiedades/')) return itemResponseSchema(propiedadSchema);

  if (p === '/documentos-propiedad') return listOrCreateResponse(method, documentoPropiedadSchema);
  if (p.startsWith('/documentos-propiedad/propiedad/')) return relationArrayResponse(documentoPropiedadSchema);
  if (p.endsWith('/parcelas') && p.startsWith('/documentos-propiedad/')) return relationArrayResponse(parcelaSchema);
  if (p.startsWith('/documentos-propiedad/')) return itemResponseSchema(documentoPropiedadSchema);

  if (p === '/protocolos') return listOrCreateResponse(method, protocoloSchema);
  if (p.startsWith('/protocolos/motivo/')) return relationArrayResponse(protocoloSchema);
  if (p.endsWith('/desincorporaciones') && p.startsWith('/protocolos/')) return relationArrayResponse(desincorporacionSchema);
  if (p.endsWith('/compromisos') && p.startsWith('/protocolos/')) return relationArrayResponse(compromisoSchema);
  if (p.startsWith('/protocolos/')) return itemResponseSchema(protocoloSchema);

  if (p === '/desincorporaciones' || p === '/desincorporaciones/rango-fechas') {
    return listOrCreateResponse(method, desincorporacionSchema);
  }
  if (p.startsWith('/desincorporaciones/protocolo/') || p.startsWith('/desincorporaciones/parcela/')) return relationArrayResponse(desincorporacionSchema);
  if (p.startsWith('/desincorporaciones/')) return itemResponseSchema(desincorporacionSchema);

  if (p === '/compromisos') return listOrCreateResponse(method, compromisoSchema);
  if (p === '/compromisos/activos' || p.startsWith('/compromisos/protocolo/') || p.startsWith('/compromisos/parcela/')) return relationArrayResponse(compromisoSchema);
  if (p.startsWith('/compromisos/')) return itemResponseSchema(compromisoSchema);

  if (p === '/sedes') return listOrCreateResponse(method, sedeSchema);
  if (p.endsWith('/almacenes') && p.startsWith('/sedes/')) return relationArrayResponse(almacenSchema);
  if (p.endsWith('/departamentos') && p.startsWith('/sedes/')) return relationArrayResponse(departamentoSchema);
  if (p.endsWith('/bienes') && p.startsWith('/sedes/')) return relationArrayResponse(bienSchema);
  if (p.endsWith('/vehiculos') && p.startsWith('/sedes/')) return relationArrayResponse(vehiculoSchema);
  if (p.startsWith('/sedes/')) return itemResponseSchema(sedeSchema);

  if (p === '/departamentos') return listOrCreateResponse(method, departamentoSchema);
  if (p.startsWith('/departamentos/sede/')) return relationArrayResponse(departamentoSchema);
  if (p.endsWith('/responsables') && p.startsWith('/departamentos/')) return relationArrayResponse(responsableSchema);
  if (p.endsWith('/bienes') && p.startsWith('/departamentos/')) return relationArrayResponse(bienSchema);
  if (p.endsWith('/vehiculos') && p.startsWith('/departamentos/')) return relationArrayResponse(vehiculoSchema);
  if (p.startsWith('/departamentos/')) return itemResponseSchema(departamentoSchema);

  if (p === '/responsables') return listOrCreateResponse(method, responsableSchema);
  if (p.startsWith('/responsables/departamento/')) return relationArrayResponse(responsableSchema);
  if (p.endsWith('/almacenes') && p.startsWith('/responsables/')) return relationArrayResponse(almacenSchema);
  if (p.endsWith('/bienes') && p.startsWith('/responsables/')) return relationArrayResponse(bienSchema);
  if (p.endsWith('/vehiculos') && p.startsWith('/responsables/')) return relationArrayResponse(vehiculoSchema);
  if (p.endsWith('/parcelas') && p.startsWith('/responsables/')) return relationArrayResponse(parcelaSchema);
  if (p.startsWith('/responsables/')) return itemResponseSchema(responsableSchema);

  if (p === '/almacenes') return listOrCreateResponse(method, almacenSchema);
  if (p === '/almacenes/disponibles' || p.startsWith('/almacenes/sede/') || p.startsWith('/almacenes/responsable/')) return relationArrayResponse(almacenSchema);
  if (p.endsWith('/bienes') && p.startsWith('/almacenes/')) return relationArrayResponse(bienSchema);
  if (p.endsWith('/vehiculos') && p.startsWith('/almacenes/')) return relationArrayResponse(vehiculoSchema);
  if (p.startsWith('/almacenes/')) return itemResponseSchema(almacenSchema);

  if (p === '/categorias/general') return listOrCreateResponse(method, categoriaGeneralSchema);
  if (p.endsWith('/subcategorias') && p.startsWith('/categorias/general/')) return relationArrayResponse(subcategoriaSchema);
  if (p.startsWith('/categorias/general/')) return itemResponseSchema(categoriaGeneralSchema);
  if (p === '/categorias/subcategoria') return listOrCreateResponse(method, subcategoriaSchema);
  if (p.startsWith('/categorias/subcategoria/general/')) return relationArrayResponse(subcategoriaSchema);
  if (p.endsWith('/especificas') && p.startsWith('/categorias/subcategoria/')) return relationArrayResponse(categoriaEspecificaSchema);
  if (p.startsWith('/categorias/subcategoria/')) return itemResponseSchema(subcategoriaSchema);
  if (p === '/categorias/especifica') return listOrCreateResponse(method, categoriaEspecificaSchema);
  if (p.startsWith('/categorias/especifica/subcategoria/')) return relationArrayResponse(categoriaEspecificaSchema);
  if (p.endsWith('/bienes') && p.startsWith('/categorias/especifica/')) return relationArrayResponse(bienSchema);
  if (p.endsWith('/vehiculos') && p.startsWith('/categorias/especifica/')) return relationArrayResponse(vehiculoSchema);
  if (p.startsWith('/categorias/especifica/')) return itemResponseSchema(categoriaEspecificaSchema);

  if (p === '/documentos') return listOrCreateResponse(method, documentoSchema);
  if (p === '/documentos/rango-fechas' || p.startsWith('/documentos/proveedor/')) return relationArrayResponse(documentoSchema);
  if (p === '/documentos/total-por-mes') return itemResponseSchema(documentosTotalesPorMesSchema);
  if (p.endsWith('/bienes') && p.startsWith('/documentos/')) return relationArrayResponse(bienSchema);
  if (p.endsWith('/vehiculos') && p.startsWith('/documentos/')) return relationArrayResponse(vehiculoSchema);
  if (p.startsWith('/documentos/')) return itemResponseSchema(documentoSchema);

  if (p.startsWith('/reportes/') && !p.includes('/exportar/')) return reporteDataSchema;

  if (p === '/dashboard/stats') return itemResponseSchema(dashboardStatsSchema);
  if (p === '/dashboard/actividad-reciente') return itemResponseSchema(dashboardActividadSchema);
  if (p === '/dashboard/alertas') return itemResponseSchema(dashboardAlertasSchema);
  if (p === '/dashboard/graficos') return itemResponseSchema(dashboardGraficosSchema);

  if (p === '/auditoria/resumen') return itemResponseSchema(auditoriaResumenSchema);
  if (p === '/auditoria/cambios-recientes') return itemResponseSchema(z.array(auditoriaRegistroSchema));
  if (p === '/auditoria/fechas') return listResponseSchema(auditoriaRegistroSchema);
  if (p.startsWith('/auditoria/tabla/') || p.startsWith('/auditoria/usuario/')) {
    return listResponseSchema(auditoriaRegistroSchema);
  }
  if (p === '/auditoria') return listResponseSchema(auditoriaRegistroSchema);
  if (p.startsWith('/auditoria/')) return itemResponseSchema(auditoriaRegistroSchema);

  return null;
}

export function validateApiResponse<T>(path: string, method: string, json: unknown): T {
  if (method === 'DELETE') return json as T;
  const schema = getResponseSchema(path, method);
  return schema ? (parseWithSchema(schema, json) as T) : (json as T);
}

export function validateApiPayload(path: string, method: string, body: unknown) {
  if (!body || !['POST', 'PUT', 'PATCH'].includes(method)) return body;
  const p = normalizePath(path);

  if (method === 'POST' && p === '/auth/login') return parseWithSchema(payloadSchemas.login, body);
  if (method === 'POST' && (p === '/auth/logout' || p === '/auth/refresh-token')) {
    return parseWithSchema(payloadSchemas.refreshToken, body);
  }
  if (method === 'PATCH' && p === '/auth/cambiar-password') {
    return parseWithSchema(payloadSchemas.cambiarPassword, body);
  }
  if (method === 'POST' && p === '/usuarios') return parseWithSchema(payloadSchemas.usuario, body);
  if (method === 'PUT' && p.startsWith('/usuarios/')) return parseWithSchema(payloadSchemas.updateUsuario, body);
  if (method === 'PATCH' && p.endsWith('/activar') && p.startsWith('/usuarios/')) {
    return parseWithSchema(payloadSchemas.activarUsuario, body);
  }
  if ((method === 'POST' || method === 'PUT') && p.startsWith('/roles')) return parseWithSchema(payloadSchemas.rol, body);

  if ((method === 'POST' || method === 'PUT') && p.startsWith('/parcelas')) {
    const source = (body ?? {}) as Record<string, unknown>;
    const normalized = {
      ...source,
      id_terreno:
        source.id_terreno != null && source.id_terreno !== ''
          ? String(source.id_terreno).trim()
          : source.id_terreno,
      id_documento_propiedad:
        source.id_documento_propiedad != null && source.id_documento_propiedad !== ''
          ? String(source.id_documento_propiedad)
          : source.id_documento_propiedad,
    };
    return parseWithSchema(payloadSchemas.parcela, normalized);
  }
  if (method === 'POST' && p === '/propiedades') return parseWithSchema(payloadSchemas.propiedad, body);
  if (method === 'PUT' && p.startsWith('/propiedades/')) return parseWithSchema(payloadSchemas.updatePropiedad, body);
  if ((method === 'POST' || method === 'PUT') && p.startsWith('/documentos-propiedad')) {
    const source = (body ?? {}) as Record<string, unknown>;
    const normalized = {
      ...source,
      id_documento_propiedad:
        source.id_documento_propiedad != null && source.id_documento_propiedad !== ''
          ? String(source.id_documento_propiedad).trim()
          : source.id_documento_propiedad,
    };
    return parseWithSchema(payloadSchemas.documentoPropiedad, normalized);
  }
  if ((method === 'POST' || method === 'PUT') && p.startsWith('/protocolos')) return parseWithSchema(payloadSchemas.protocolo, body);
  if ((method === 'POST' || method === 'PUT') && p.startsWith('/desincorporaciones')) return parseWithSchema(payloadSchemas.desincorporacion, body);
  if ((method === 'POST' || method === 'PUT') && p.startsWith('/compromisos')) return parseWithSchema(payloadSchemas.compromiso, body);
  if ((method === 'POST' || method === 'PUT') && p.startsWith('/sedes')) return parseWithSchema(payloadSchemas.sede, body);
  if ((method === 'POST' || method === 'PUT') && p.startsWith('/departamentos')) return parseWithSchema(payloadSchemas.departamento, body);
  if (method === 'POST' && p === '/responsables') return parseWithSchema(payloadSchemas.responsable, body);
  if (method === 'PUT' && p.startsWith('/responsables/')) return parseWithSchema(payloadSchemas.updateResponsable, body);
  if ((method === 'POST' || method === 'PUT') && p.startsWith('/almacenes')) return parseWithSchema(payloadSchemas.almacen, body);
  if ((method === 'POST' || method === 'PUT') && p.startsWith('/bienes')) {
    const source = (body ?? {}) as Record<string, unknown>;
    const normalized = {
      ...source,
      id_doc: entityIdForApi(source.id_doc as string | number | null | undefined),
    };
    return parseWithSchema(payloadSchemas.bien, normalized);
  }
  if (method === 'PATCH' && p.endsWith('/cambiar-estado') && p.startsWith('/bienes/')) return parseWithSchema(payloadSchemas.cambiarEstadoBien, body);
  if (method === 'POST' && p === '/vehiculos') {
    const source = (body ?? {}) as Record<string, unknown>;
    const codigo = vehiculoCodigoForApi(source.codigo as string | number | null | undefined);
    const normalized = {
      ...source,
      codigo,
      id_doc: entityIdForApi(source.id_doc as string | number | null | undefined),
      serial_motor: vehiculoSerialCreateForApi(
        source.serial_motor as string | null | undefined,
        'motor',
        codigo,
      ),
      serial_carroceria: vehiculoSerialCreateForApi(
        source.serial_carroceria as string | null | undefined,
        'carroceria',
        codigo,
      ),
    };
    return parseWithSchema(payloadSchemas.vehiculoCreate, normalized);
  }
  if (method === 'PUT' && p.startsWith('/vehiculos/')) {
    const source = (body ?? {}) as Record<string, unknown>;
    const normalized = {
      ...source,
      id_doc: entityIdForApi(source.id_doc as string | number | null | undefined),
    };
    return parseWithSchema(payloadSchemas.vehiculo, normalized);
  }
  if (method === 'PATCH' && p.endsWith('/asignar') && p.startsWith('/vehiculos/')) return parseWithSchema(payloadSchemas.asignarVehiculo, body);
  if (method === 'PATCH' && p.endsWith('/cambiar-estado') && p.startsWith('/vehiculos/')) return parseWithSchema(payloadSchemas.cambiarEstadoVehiculo, body);
  if ((method === 'POST' || method === 'PUT') && p.startsWith('/categorias/general')) return parseWithSchema(payloadSchemas.categoriaGeneral, body);
  if ((method === 'POST' || method === 'PUT') && p.startsWith('/categorias/subcategoria')) return parseWithSchema(payloadSchemas.subcategoria, body);
  if ((method === 'POST' || method === 'PUT') && p.startsWith('/categorias/especifica')) return parseWithSchema(payloadSchemas.categoriaEspecifica, body);
  if ((method === 'POST' || method === 'PUT') && p.startsWith('/documentos')) {
    const source = (body ?? {}) as Record<string, unknown>;
    const idDocFromBody =
      typeof source.id_doc === 'string' && source.id_doc.trim()
        ? source.id_doc.trim()
        : typeof source.numero_documento === 'string' && source.numero_documento.trim()
          ? source.numero_documento.trim()
          : null;
    if (method === 'POST' && idDocFromBody) {
      return parseWithSchema(payloadSchemas.documentoVehiculo, {
        ...source,
        id_doc: idDocFromBody,
      });
    }
    return parseWithSchema(payloadSchemas.documento, body);
  }

  return body;
}
