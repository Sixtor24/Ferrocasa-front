export interface MaterialReporte {
  id: number;
  codigo: string;
  descripcion: string;
  categoria: string;
  tipoMov: string;
  stockActual: string;
  estadoUso: string;
  estadoFisico: string;
}

export const reporteStats = {
  totalBienes: 0,
  bienesCementerio: 0,
  bienesEdificioAdmin: 0,
  parcelas: 0,
};

export const materialesReporte: MaterialReporte[] = [
  { id: 1, codigo: 'BN-2024-001', descripcion: 'Acero Estructural Reforzado H-20', categoria: 'Construcción', tipoMov: 'Entradas', stockActual: '450 Tn', estadoUso: 'En uso', estadoFisico: 'Bueno' },
  { id: 2, codigo: 'BN-2024-045', descripcion: 'Cemento Portland Tipo 1 (Sacos 42.5kg)', categoria: 'Construcción', tipoMov: 'Salidas', stockActual: '2,100 und', estadoUso: 'En almacén', estadoFisico: 'Regular' },
  { id: 3, codigo: 'BN-2023-912', descripcion: 'Retroexcavadora Caterpillar 420F2', categoria: 'Maquinaria Pesada', tipoMov: 'Transferencias', stockActual: '4 und', estadoUso: 'En taller', estadoFisico: 'Dañado' },
  { id: 4, codigo: 'BN-2024-118', descripcion: 'Vigas de Aluminio Industrial 6m', categoria: 'Construcción', tipoMov: 'Entradas', stockActual: '85 und', estadoUso: 'En uso', estadoFisico: 'Bueno' },
  { id: 5, codigo: 'BN-2024-220', descripcion: 'Escritorio Ejecutivo Modular', categoria: 'Mobiliario', tipoMov: 'Entradas', stockActual: '24 und', estadoUso: 'En uso', estadoFisico: 'Bueno' },
  { id: 6, codigo: 'BN-2024-305', descripcion: 'Camión Volteo 12m³ Ford Cargo', categoria: 'Vehículos', tipoMov: 'Salidas', stockActual: '3 und', estadoUso: 'Desincorporado', estadoFisico: 'Inservible' },
  { id: 7, codigo: 'BN-2024-089', descripcion: 'Bloques de Arcilla 10x20x40', categoria: 'Construcción', tipoMov: 'Entradas', stockActual: '8,500 und', estadoUso: 'En uso', estadoFisico: 'Regular' },
  { id: 8, codigo: 'BN-2024-410', descripcion: 'Grúa Torre Liebherr 150 EC-B', categoria: 'Maquinaria Pesada', tipoMov: 'Ajustes', stockActual: '2 und', estadoUso: 'En tránsito', estadoFisico: 'Bueno' },
  { id: 9, codigo: 'BN-2024-156', descripcion: 'Sillas Ergonómicas Oficina', categoria: 'Mobiliario', tipoMov: 'Entradas', stockActual: '60 und', estadoUso: 'En uso', estadoFisico: 'Bueno' },
  { id: 10, codigo: 'BN-2024-501', descripcion: 'Toyota Hilux 4x4 Doble Cabina', categoria: 'Vehículos', tipoMov: 'Transferencias', stockActual: '5 und', estadoUso: 'En uso', estadoFisico: 'Regular' },
];

export const categoriasMaterial = ['Construcción', 'Maquinaria Pesada', 'Mobiliario', 'Vehículos'];

export const tiposMovimiento = [
  'Todos los movimientos',
  'Entradas',
  'Salidas',
  'Transferencias',
  'Ajustes',
];
