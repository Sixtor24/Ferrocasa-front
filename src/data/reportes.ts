export interface MaterialReporte {
  id: number;
  codigo: string;
  descripcion: string;
  categoria: string;
  tipoMov: string;
  stockActual: string;
  ventasQ4: string;
  tendencia: 'up' | 'down' | 'stable';
}

export const reporteStats = {
  totalVentas: '$428,190.00',
  cambioVentas: '+12.4%',
  activosStock: '1,248 und.',
  capacidadAlmacen: '98%',
  estadoAuditoria: 'En Cumplimiento',
  porcentajeRevisado: 85,
};

export const materialesReporte: MaterialReporte[] = [
  { id: 1, codigo: 'BN-2024-001', descripcion: 'Acero Estructural Reforzado H-20', categoria: 'Construcción', tipoMov: 'Entradas', stockActual: '450 Tn', ventasQ4: '120 Tn', tendencia: 'up' },
  { id: 2, codigo: 'BN-2024-045', descripcion: 'Cemento Portland Tipo 1 (Sacos 42.5kg)', categoria: 'Construcción', tipoMov: 'Salidas', stockActual: '2,100 und', ventasQ4: '850 und', tendencia: 'stable' },
  { id: 3, codigo: 'BN-2023-912', descripcion: 'Retroexcavadora Caterpillar 420F2', categoria: 'Maquinaria Pesada', tipoMov: 'Transferencias', stockActual: '4 und', ventasQ4: '1 und', tendencia: 'down' },
  { id: 4, codigo: 'BN-2024-118', descripcion: 'Vigas de Aluminio Industrial 6m', categoria: 'Construcción', tipoMov: 'Entradas', stockActual: '85 und', ventasQ4: '32 und', tendencia: 'up' },
  { id: 5, codigo: 'BN-2024-220', descripcion: 'Escritorio Ejecutivo Modular', categoria: 'Mobiliario', tipoMov: 'Entradas', stockActual: '24 und', ventasQ4: '8 und', tendencia: 'stable' },
  { id: 6, codigo: 'BN-2024-305', descripcion: 'Camión Volteo 12m³ Ford Cargo', categoria: 'Vehículos', tipoMov: 'Salidas', stockActual: '3 und', ventasQ4: '1 und', tendencia: 'down' },
  { id: 7, codigo: 'BN-2024-089', descripcion: 'Bloques de Arcilla 10x20x40', categoria: 'Construcción', tipoMov: 'Entradas', stockActual: '8,500 und', ventasQ4: '3,200 und', tendencia: 'up' },
  { id: 8, codigo: 'BN-2024-410', descripcion: 'Grúa Torre Liebherr 150 EC-B', categoria: 'Maquinaria Pesada', tipoMov: 'Ajustes', stockActual: '2 und', ventasQ4: '0 und', tendencia: 'stable' },
  { id: 9, codigo: 'BN-2024-156', descripcion: 'Sillas Ergonómicas Oficina', categoria: 'Mobiliario', tipoMov: 'Entradas', stockActual: '60 und', ventasQ4: '15 und', tendencia: 'up' },
  { id: 10, codigo: 'BN-2024-501', descripcion: 'Toyota Hilux 4x4 Doble Cabina', categoria: 'Vehículos', tipoMov: 'Transferencias', stockActual: '5 und', ventasQ4: '2 und', tendencia: 'up' },
];

export const categoriasMaterial = ['Construcción', 'Maquinaria Pesada', 'Mobiliario', 'Vehículos'];

export const tiposMovimiento = [
  'Todos los movimientos',
  'Entradas',
  'Salidas',
  'Transferencias',
  'Ajustes',
];
