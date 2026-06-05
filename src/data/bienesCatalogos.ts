export const ESTADOS_USO_BIEN = ['En uso', 'En obsolescencia', 'Obsoleto'] as const;
export const CONDICIONES_FISICAS_BIEN = ['Bueno', 'Regular', 'Dañado'] as const;

export const SEDES_BIENES_ADMINISTRATIVOS = [
  'Edificio Administrativo Ferrocasa',
  'Área Externa',
] as const;

export const SEDES_VEHICULOS = [
  ...SEDES_BIENES_ADMINISTRATIVOS,
  'Cementerio',
] as const;

export const DEPARTAMENTOS_BIENES_ADMINISTRATIVOS = [
  'Recepción',
  'Gcia. de Talento Humano',
  'Gcia. de Atención al Ciudadano',
  'Gcia. de Ingeniería y Construcción',
  'Telemática',
  'Cocina',
  'Unidad de Bienes Público',
  'Coord. de Servicios Generales',
  'Gcia. de Administración y Finanzas',
  'Sala de Juntas',
  'Sala de Estar',
  'Presidencia',
  'Vicepresidencia',
  'Consultoría Jurídica',
  'Auditoría Interna',
  'Imagen Institucional',
  'Gcia. de Comercialización y Ventas',
  'Campaña de Guayana',
] as const;

export const DEPARTAMENTOS_EDIFICIO_ADMINISTRATIVO = [
  'Recepción',
  'Gcia. de Talento Humano',
  'Gcia. de Atención al Ciudadano',
  'Gcia. de Ingeniería y Construcción',
  'Telemática',
  'Cocina',
  'Unidad de Bienes Público',
  'Coord. de Servicios Generales',
  'Gcia. de Administración y Finanzas',
  'Sala de Juntas',
  'Sala de Estar',
  'Presidencia',
  'Vicepresidencia',
  'Consultoría Jurídica',
  'Auditoría Interna',
  'Imagen Institucional',
] as const;

export const DEPARTAMENTOS_AREA_EXTERNA = [
  'Gcia. de Comercialización y Ventas',
  'Campaña de Guayana',
] as const;

export const ALMACENES_BIENES_ADMINISTRATIVOS = [
  'Recepción - Planta Baja',
  'Gcia. de Talento Humano - Planta Baja',
  'Gcia. de Atención al Ciudadano - Planta Baja',
  'Gcia. de Ingeniería y Construcción - Mezzanina',
  'Telemática - Mezzanina',
  'Cocina - Mezzanina',
  'Unidad de Bienes Público - Mezzanina',
  'Coord. de Servicios Generales - Mezzanina',
  'Gcia. de Administración y Finanzas - Piso 1',
  'Coord. de Compras - Piso 1',
  'Sala de Juntas - Piso 1',
  'Sala de Estar - Piso 1',
  'Presidencia - Piso 2',
  'Vicepresidencia - Piso 2',
  'Consultoría Jurídica - Piso 2',
  'Auditoría Interna - Piso 2',
  'Imagen Institucional - Piso 2',
  'Oficina Gcia. de Comercialización y Ventas',
  'Oficina Campaña de Guayana',
] as const;

export const ALMACENES_EDIFICIO_ADMINISTRATIVO = [
  'Recepción - Planta Baja',
  'Gcia. de Talento Humano - Planta Baja',
  'Gcia. de Atención al Ciudadano - Planta Baja',
  'Gcia. de Ingeniería y Construcción - Mezzanina',
  'Telemática - Mezzanina',
  'Cocina - Mezzanina',
  'Unidad de Bienes Público - Mezzanina',
  'Coord. de Servicios Generales - Mezzanina',
  'Gcia. de Administración y Finanzas - Piso 1',
  'Coord. de Compras - Piso 1',
  'Sala de Juntas - Piso 1',
  'Sala de Estar - Piso 1',
  'Presidencia - Piso 2',
  'Vicepresidencia - Piso 2',
  'Consultoría Jurídica - Piso 2',
  'Auditoría Interna - Piso 2',
  'Imagen Institucional - Piso 2',
] as const;

export const ALMACENES_AREA_EXTERNA = [
  'Oficina Gcia. de Comercialización y Ventas',
  'Oficina Campaña de Guayana',
] as const;

export const SEDES_CEMENTERIO = ['Cementerio'] as const;
export const DEPARTAMENTOS_CEMENTERIO = ['Cementerio'] as const;
export const ALMACENES_CEMENTERIO = [
  'Entrada PPAL',
  'Oficinas',
  'Crematorio',
  'Sala de espera',
  'Cocina',
  'Taller',
  'Área Patio',
  'Galpón (1)',
  'Galpón (2)',
  'Galpón (3)',
  'Galpón (4)',
  'Galpón (5)',
] as const;

export function departamentosPorSede(sede: string): readonly string[] {
  if (sede === 'Área Externa') return DEPARTAMENTOS_AREA_EXTERNA;
  if (sede === 'Cementerio') return DEPARTAMENTOS_CEMENTERIO;
  return DEPARTAMENTOS_EDIFICIO_ADMINISTRATIVO;
}

export function almacenesPorSede(sede: string): readonly string[] {
  if (sede === 'Área Externa') return ALMACENES_AREA_EXTERNA;
  if (sede === 'Cementerio') return ALMACENES_CEMENTERIO;
  return ALMACENES_EDIFICIO_ADMINISTRATIVO;
}
