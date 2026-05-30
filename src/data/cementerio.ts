import type { AreaCementerio, InventarioCementerio, ParcelaCementerio } from '../types/cementerio';

const SEDE = 'Cementerio Municipal';

const CATEGORIA_POR_AREA: Record<AreaCementerio, { general: string; sub: string }> = {
  Oficinas: { general: 'Mobiliario de oficina', sub: 'Mobiliario' },
  Cocina: { general: 'Electrodomésticos', sub: 'Cocina' },
  Crematorio: { general: 'Maquinaria', sub: 'Crematorio' },
  Galpón: { general: 'Herramientas', sub: 'Almacenamiento' },
  Patio: { general: 'Herramientas', sub: 'Jardinería' },
  Taller: { general: 'Herramientas', sub: 'Taller' },
  Mantenimiento: { general: 'Equipos de bombeo', sub: 'Mantenimiento' },
  'Sala Velatoria': { general: 'Mobiliario especializado', sub: 'Sala velatoria' },
  'Sala de Espera': { general: 'Electrodomésticos', sub: 'Climatización' },
  Principal: { general: 'Otros', sub: 'General' },
};

type InventarioBase = Omit<
  InventarioCementerio,
  | 'categoriaGeneral'
  | 'subcategoria'
  | 'categoriaEspecifica'
  | 'fechaIngreso'
  | 'formaAdquisicion'
  | 'valorAdquisicion'
  | 'moneda'
  | 'nombreProveedor'
  | 'responsable'
>;

const inventarioBase: InventarioBase[] = [
  { id: 1, codigo: 'CEM-001', descripcion: 'Escritorio de madera 3 gavetas', marca: 'Ofimuebles', modelo: 'EM-300', color: 'Marrón', serial: 'OF-EM300-001', estadoBien: 'Bueno', area: 'Oficinas', sede: SEDE, almacen: 'Oficinas', departamento: 'Administración', numeroDocumento: 'DOC-CEM-2019-012', estadoUso: 'En uso', observaciones: '' },
  { id: 2, codigo: 'CEM-002', descripcion: 'Silla secretarial con brazos', marca: 'Ergotec', modelo: 'SS-100', color: 'Negro', serial: 'ET-SS100-012', estadoBien: 'Regular', area: 'Oficinas', sede: SEDE, almacen: 'Oficinas', departamento: 'Administración', numeroDocumento: 'DOC-CEM-2020-034', estadoUso: 'En uso', observaciones: 'Ruedas desgastadas' },
  { id: 3, codigo: 'CEM-003', descripcion: 'Computador de escritorio', marca: 'Dell', modelo: 'OptiPlex 3070', color: 'Negro', serial: 'DELL-OP3070-045', estadoBien: 'Bueno', area: 'Oficinas', sede: SEDE, almacen: 'Oficinas', departamento: 'Administración', numeroDocumento: 'DOC-CEM-2021-088', estadoUso: 'En uso', observaciones: '' },
  { id: 4, codigo: 'CEM-004', descripcion: 'Nevera ejecutiva', marca: 'Samsung', modelo: 'RT-22', color: 'Blanco', serial: 'SAM-RT22-088', estadoBien: 'Bueno', area: 'Cocina', sede: SEDE, almacen: 'Cocina', departamento: 'Servicios Generales', numeroDocumento: 'DOC-CEM-2022-015', estadoUso: 'En uso', observaciones: '' },
  { id: 5, codigo: 'CEM-005', descripcion: 'Microondas industrial', marca: 'Panasonic', modelo: 'NE-1054F', color: 'Gris', serial: 'PAN-NE1054-033', estadoBien: 'Regular', area: 'Cocina', sede: SEDE, almacen: 'Cocina', departamento: 'Servicios Generales', numeroDocumento: 'DOC-CEM-2020-067', estadoUso: 'En uso', observaciones: 'Plato giratorio roto' },
  { id: 6, codigo: 'CEM-006', descripcion: 'Horno crematorio principal', marca: 'CremTech', modelo: 'CT-5000', color: 'Gris', serial: 'CT-5000-001', estadoBien: 'Bueno', area: 'Crematorio', sede: SEDE, almacen: 'Crematorio', departamento: 'Crematorio', numeroDocumento: 'DOC-CEM-2018-001', estadoUso: 'En uso', observaciones: 'Mantenimiento semestral al día' },
  { id: 7, codigo: 'CEM-007', descripcion: 'Aspiradora industrial', marca: 'Kärcher', modelo: 'NT 70/2', color: 'Amarillo', serial: 'KAR-NT70-019', estadoBien: 'Dañado', area: 'Galpón', sede: SEDE, almacen: 'Galpón', departamento: 'Mantenimiento y Jardinería', numeroDocumento: 'DOC-CEM-2017-044', estadoUso: 'En almacén', observaciones: 'Motor con falla, pendiente reparación' },
  { id: 8, codigo: 'CEM-008', descripcion: 'Podadora de césped a gasolina', marca: 'Honda', modelo: 'HRX217', color: 'Rojo', serial: 'HON-HRX217-007', estadoBien: 'Bueno', area: 'Patio', sede: SEDE, almacen: 'Patio', departamento: 'Mantenimiento y Jardinería', numeroDocumento: 'DOC-CEM-2023-021', estadoUso: 'En uso', observaciones: '' },
  { id: 9, codigo: 'CEM-009', descripcion: 'Juego de herramientas de jardinería', marca: 'Tramontina', modelo: 'Kit Pro', color: 'Verde', serial: 'TRA-KITP-044', estadoBien: 'Regular', area: 'Taller', sede: SEDE, almacen: 'Taller', departamento: 'Mantenimiento y Jardinería', numeroDocumento: 'DOC-CEM-2021-102', estadoUso: 'En uso', observaciones: 'Algunas piezas oxidadas' },
  { id: 10, codigo: 'CEM-010', descripcion: 'Bomba de agua sumergible', marca: 'Pedrollo', modelo: 'VXm 10/35', color: 'Azul', serial: 'PED-VXM10-056', estadoBien: 'Bueno', area: 'Mantenimiento', sede: SEDE, almacen: 'Mantenimiento', departamento: 'Mantenimiento y Jardinería', numeroDocumento: 'DOC-CEM-2022-078', estadoUso: 'En uso', observaciones: '' },
  { id: 11, codigo: 'CEM-011', descripcion: 'Mesa de preparación mortuoria', marca: 'FuneralTech', modelo: 'MP-200', color: 'Acero inoxidable', serial: 'FT-MP200-003', estadoBien: 'Bueno', area: 'Sala Velatoria', sede: SEDE, almacen: 'Sala Velatoria', departamento: 'Sala Velatoria', numeroDocumento: 'DOC-CEM-2020-055', estadoUso: 'En uso', observaciones: '' },
  { id: 12, codigo: 'CEM-012', descripcion: 'Aire acondicionado split 18000 BTU', marca: 'LG', modelo: 'Dual Cool', color: 'Blanco', serial: 'LG-DC18-022', estadoBien: 'Averiado', area: 'Sala de Espera', sede: SEDE, almacen: 'Sala de Espera', departamento: 'Servicios Generales', numeroDocumento: 'DOC-CEM-2019-091', estadoUso: 'Por verificar', observaciones: 'Sin gas refrigerante' },
  { id: 13, codigo: 'CEM-013', descripcion: 'Estante metálico 5 niveles', marca: 'MetalRack', modelo: 'EM-500', color: 'Gris', serial: 'MR-EM500-091', estadoBien: 'Bueno', area: 'Galpón', sede: SEDE, almacen: 'Galpón', departamento: 'Servicios Generales', numeroDocumento: 'DOC-CEM-2024-003', estadoUso: 'En almacén', observaciones: '' },
  { id: 14, codigo: 'CEM-014', descripcion: 'Carretilla de carga', marca: 'Truper', modelo: 'CAT-60', color: 'Verde', serial: 'TRU-CAT60-015', estadoBien: 'Regular', area: 'Patio', sede: SEDE, almacen: 'Patio', departamento: 'Mantenimiento y Jardinería', numeroDocumento: 'DOC-CEM-2021-044', estadoUso: 'En uso', observaciones: 'Neumático parcheado' },
  { id: 15, codigo: 'CEM-015', descripcion: 'Impresora HP LaserJet', marca: 'HP', modelo: 'LaserJet Pro M404n', color: 'Blanco', serial: 'HP-M404N-078', estadoBien: 'Bueno', area: 'Oficinas', sede: SEDE, almacen: 'Oficinas', departamento: 'Administración', numeroDocumento: 'DOC-CEM-2023-019', estadoUso: 'En uso', observaciones: '' },
];

const VALORES_MOCK = [4500, 320, 1100, 620, 850, 120000, 280, 650, 180, 420, 8500, 1850, 1200, 95, 780];
const FECHAS_MOCK = [
  '2019-03-15', '2020-06-20', '2021-08-20', '2022-07-05', '2020-11-10',
  '2018-01-30', '2017-04-08', '2023-11-02', '2021-05-18', '2022-09-01',
  '2020-11-25', '2019-06-12', '2024-02-10', '2021-03-22', '2023-08-20',
];

function enrichInventario(item: InventarioBase, index: number): InventarioCementerio {
  const cat = CATEGORIA_POR_AREA[item.area];
  return {
    ...item,
    categoriaGeneral: cat.general,
    subcategoria: cat.sub,
    categoriaEspecifica: item.descripcion,
    fechaIngreso: FECHAS_MOCK[index] ?? '2020-01-01',
    formaAdquisicion: index % 7 === 0 ? 'Donación' : 'Compra',
    valorAdquisicion: VALORES_MOCK[index] ?? null,
    moneda: index % 3 === 0 ? 'USD' : 'Bs',
    nombreProveedor: `${item.marca} C.A.`,
    responsable: `Coord. ${item.departamento}`,
  };
}

// Inventario físico — subset representativo (304 filas en producción)
export const inventarioCementerio: InventarioCementerio[] = inventarioBase.map(enrichInventario);

// Parcelas del cementerio
export const parcelasCementerio: ParcelaCementerio[] = [
  { id: 1, identificacion: 'CM-A-001', sector: 'Sector A', tipo: 'Individual', estatus: 'Ocupada', ocupante: 'Fam. Rodríguez M.', fechaAsignacion: '2022-03-12', fechaVencimiento: '2032-03-12', contacto: '0414-8851234', observaciones: '' },
  { id: 2, identificacion: 'CM-A-002', sector: 'Sector A', tipo: 'Familiar', estatus: 'Ocupada', ocupante: 'Fam. López G.', fechaAsignacion: '2021-06-05', fechaVencimiento: '2031-06-05', contacto: '0424-9923456', observaciones: '' },
  { id: 3, identificacion: 'CM-A-003', sector: 'Sector A', tipo: 'Individual', estatus: 'Disponible', ocupante: '', fechaAsignacion: '', fechaVencimiento: '', contacto: '', observaciones: '' },
  { id: 4, identificacion: 'CM-B-001', sector: 'Sector B', tipo: 'Nicho', estatus: 'Reservada', ocupante: 'Fam. Pérez A.', fechaAsignacion: '2024-01-20', fechaVencimiento: '2034-01-20', contacto: '0412-5567890', observaciones: 'Reserva vigente' },
  { id: 5, identificacion: 'CM-B-002', sector: 'Sector B', tipo: 'Osario', estatus: 'Ocupada', ocupante: 'Fam. Hernández V.', fechaAsignacion: '2020-11-18', fechaVencimiento: '2030-11-18', contacto: '0416-7712345', observaciones: '' },
  { id: 6, identificacion: 'CM-B-003', sector: 'Sector B', tipo: 'Individual', estatus: 'Mantenimiento', ocupante: '', fechaAsignacion: '', fechaVencimiento: '', contacto: '', observaciones: 'Reparación de lápida' },
  { id: 7, identificacion: 'CM-C-001', sector: 'Sector C', tipo: 'Familiar', estatus: 'Ocupada', ocupante: 'Fam. García T.', fechaAsignacion: '2023-07-30', fechaVencimiento: '2033-07-30', contacto: '0414-3345678', observaciones: '' },
  { id: 8, identificacion: 'CM-C-002', sector: 'Sector C', tipo: 'Cremación', estatus: 'Disponible', ocupante: '', fechaAsignacion: '', fechaVencimiento: '', contacto: '', observaciones: '' },
  { id: 9, identificacion: 'CM-D-001', sector: 'Sector D', tipo: 'Individual', estatus: 'Vencida', ocupante: 'Fam. Díaz R.', fechaAsignacion: '2012-09-14', fechaVencimiento: '2022-09-14', contacto: '0412-1234567', observaciones: 'Vencida, pendiente de renovación o liberación' },
  { id: 10, identificacion: 'CM-D-002', sector: 'Sector D', tipo: 'Familiar', estatus: 'Disponible', ocupante: '', fechaAsignacion: '', fechaVencimiento: '', contacto: '', observaciones: '' },
];

export const cementerioStats = {
  totalInventario: 304,
  inventarioBueno: 187,
  inventarioRegular: 82,
  inventarioDanado: 28,
  inventarioAveriado: 7,
  totalParcelas: 245,
  parcelasDisponibles: 68,
  parcelasOcupadas: 152,
  parcelasReservadas: 12,
  parcelasMantenimiento: 5,
  parcelasVencidas: 8,
  areasCubiertas: ['Cocina', 'Galpón', 'Taller', 'Oficinas', 'Crematorio', 'Sala Velatoria', 'Patio', 'Principal', 'Sala de Espera', 'Mantenimiento'],
};
