export interface Material {
  id: number;
  codigo: string;
  nombre: string;
  unidad: string;
  stockActual: number;
  stockMinimo: number;
  estado: 'OK' | 'BAJO' | 'CRÍTICO';
}

export const materialesStats = {
  totalMateriales: 1723,
  stockBajoCritico: 42,
  entradas24h: '+150 uds',
};

export const materiales: Material[] = [
  {
    id: 1,
    codigo: 'CEM-001',
    nombre: 'Cemento Portland',
    unidad: 'Saco (50kg)',
    stockActual: 1250,
    stockMinimo: 500,
    estado: 'OK',
  },
  {
    id: 2,
    codigo: 'CAB-002',
    nombre: 'Cabillas 1/2"',
    unidad: 'Unidad',
    stockActual: 350,
    stockMinimo: 400,
    estado: 'BAJO',
  },
  {
    id: 3,
    codigo: 'BLO-003',
    nombre: 'Bloques',
    unidad: 'Unidad',
    stockActual: 120,
    stockMinimo: 300,
    estado: 'CRÍTICO',
  },
  {
    id: 4,
    codigo: 'PIN-004',
    nombre: 'Pintura Tráfico Amarilla',
    unidad: 'Galón',
    stockActual: 215,
    stockMinimo: 100,
    estado: 'OK',
  },
  {
    id: 5,
    codigo: 'ARE-005',
    nombre: 'Arena Lavada',
    unidad: 'M³',
    stockActual: 80,
    stockMinimo: 50,
    estado: 'OK',
  },
  {
    id: 6,
    codigo: 'PIE-006',
    nombre: 'Piedra Picada',
    unidad: 'M³',
    stockActual: 45,
    stockMinimo: 60,
    estado: 'BAJO',
  },
];

export const unidadesMaterial = ['Saco (50kg)', 'Unidad', 'Galón', 'M³', 'Kg', 'Tn', 'Litro'];
