export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiListResponse<T> {
  success: boolean;
  data: T[];
  meta: PaginationMeta;
}

export interface ApiItemResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiSede {
  id_sede: number;
  nombre: string;
  ubicacion?: string | null;
  tipo?: string | null;
}

export interface ApiDepartamento {
  id_departamento: number;
  nombre: string;
  id_sede?: number | null;
  sede?: ApiSede;
}

export interface ApiAlmacen {
  id_almacen: number;
  nombre: string;
  id_sede?: number | null;
  ci_responsable?: string | null;
  id_departamento?: number | null;
  sede?: ApiSede;
  departamento?: ApiDepartamento;
  responsable?: ApiResponsable;
}

export interface ApiResponsable {
  ci_responsable: string;
  nombre: string;
  id_departamento?: number | null;
  departamento?: ApiDepartamento;
}

export interface ApiCategoriaGeneral {
  id_categoria_general: number;
  nombre: string;
}

export interface ApiSubcategoria {
  id_subcategoria: number;
  nombre: string;
  id_categoria_general?: number | null;
  categoria_general?: ApiCategoriaGeneral;
}

export interface ApiCategoriaEspecifica {
  id_categoria_especifica: number;
  nombre: string;
  id_subcategoria?: number | null;
  subcategoria?: ApiSubcategoria;
}

export interface ApiDocumento {
  id_doc: number;
  numero_documento?: string | null;
  nombre_proveedor?: string | null;
  forma_adquisicion?: string;
  fecha_adquisicion?: string | null;
  moneda?: string;
  id_sede?: number | null;
  sede?: ApiSede;
}

export interface ApiDocumentosTotalesPorMes {
  anio: number;
  data: {
    anio: number;
    mes: number;
    mes_label: string;
    total_documentos: number;
    monto_total: string | number;
  }[];
  resumen: {
    total_documentos: number;
    monto_total_anual: string | number;
  };
}

export interface ApiBien {
  codigo_bien: number | string;
  descripcion?: string | null;
  id_doc?: number | null;
  fecha_ingreso?: string | null;
  fecha_egreso?: string | null;
  valor_adquisicion?: string | number | null;
  marca?: string | null;
  modelo?: string | null;
  color?: string | null;
  material?: string | null;
  serial?: string | null;
  estado_uso: string;
  condicion_fisica: string;
  id_almacen: number;
  cantidad?: number;
  consumibilidad?: string;
  usuario_carga?: string | null;
  id_categoria_especifica: number;
  unidad_administrativa?: string | null;
  observaciones?: string | null;
  documento?: ApiDocumento | null;
  almacen?: ApiAlmacen;
  categoria?: ApiCategoriaEspecifica;
}

export interface ApiVehiculo {
  codigo: number | string;
  descripcion?: string | null;
  id_doc?: number | null;
  fecha_egreso?: string | null;
  valor_adquisicion?: string | number | null;
  marca?: string | null;
  placa: string;
  anio_fabricacion?: number | null;
  modelo?: string | null;
  color?: string | null;
  serial_motor?: string | null;
  serial_carroceria?: string | null;
  estado_uso: string;
  condicion_fisica: string;
  id_categoria_especifica: number;
  estado_vehiculo?: string;
  ci_responsable?: string | null;
  unidad_administrativa?: string | null;
  id_almacen: number;
  fecha_ingreso?: string | null;
  usuario_carga?: string | null;
  observaciones?: string | null;
  documento?: ApiDocumento | null;
  categoria?: ApiCategoriaEspecifica;
  responsable?: ApiResponsable | null;
  almacen?: ApiAlmacen;
}

export interface ApiPropiedad {
  numero_propiedad: number;
  nombre: string;
  ubicacion?: string | null;
  documentos?: ApiDocumentoPropiedad[];
}

export interface ApiDocumentoPropiedad {
  id_documento_propiedad: number;
  numero_documento?: string | null;
  numero_propiedad: number;
  forma_adquisicion: string;
  area_total_m2?: string | number | null;
  fecha_adquisicion?: string | null;
  valor_adquisicion?: string | number | null;
  moneda?: string | null;
  propiedad?: ApiPropiedad;
  parcelas?: ApiParcela[];
}

export interface ApiProtocolo {
  id_protocolo: number;
  motivo: string;
  id_beneficiado?: number | null;
  fecha_protocolo: string;
}

export interface ApiCompromisoTerreno {
  id_comprometida: number;
  id_protocolo: number;
  cantidad_m2: string | number;
  fecha_compromiso?: string | null;
  protocolo?: ApiProtocolo;
  parcelas?: ApiParcela[];
}

export interface ApiDesincorporacionTerreno {
  id_desincorporada: number;
  id_protocolo: number;
  cantidad_m2: string | number;
  fecha_desincorporacion?: string | null;
  protocolo?: ApiProtocolo;
  parcelas?: ApiParcela[];
}

export interface ApiParcela {
  id_terreno: number;
  nombre?: string | null;
  zona?: string | null;
  id_documento_propiedad: number;
  id_desincorporada?: number | null;
  id_comprometida?: number | null;
  ci_responsable?: string | null;
  zonificacion?: string | null;
  observaciones?: string | null;
  acreditacion_ambiental: string;
  levantamiento_topografico: string;
  valor_adquisicion?: string | number | null;
  ubicacion_adicional?: string | null;
  documento?: ApiDocumentoPropiedad & { propiedad?: ApiPropiedad };
  responsable?: ApiResponsable | null;
  compromiso?: ApiCompromisoTerreno | null;
  desincorporacion?: ApiDesincorporacionTerreno | null;
}

export interface ApiBienesEstadisticas {
  total: number;
  porEstadoUso: { estado_uso: string; _count: number }[];
  porCondicionFisica: { condicion_fisica: string; _count: number }[];
  porConsumibilidad: { consumibilidad: string; _count: number }[];
  perecederosVencidos: number;
  valorTotal: string | number | null;
}

export interface ApiVehiculosEstadisticas {
  total: number;
  disponibles?: number;
  asignados?: number;
  enMantenimiento?: number;
  valorTotal?: string | number | null;
  porEstadoUso?: { estado_uso: string; _count: number }[];
  porCondicionFisica?: { condicion_fisica: string; _count: number }[];
  porEstadoVehiculo?: { estado_vehiculo: string; _count: number }[];
}

export interface ApiParcelasEstadisticas {
  total: number;
  porZona: { zona: string | null; _count: number }[];
  comprometidas: number;
  desincorporadas: number;
  disponibles: number;
}
