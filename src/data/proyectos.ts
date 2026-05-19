export interface Proyecto {
  id: string;
  nombre: string;
  estado: string;
  ubicacion: string;
  tipo: string;
  tipoColor: string;
  totalInmuebles: number;
  vendidos: number;
  disponibles: number;
}

export const proyectosStats = {
  totalProyectos: { valor: 14, cambio: '+2 este trimestre' },
  unidadesVendidas: { valor: 842, porcentaje: '72% de inventario total' },
  disponibilidad: { valor: 326, nota: 'Entrega inmediata' },
  valorizacion: { valor: '+12.4%', nota: 'Anual vs mercado local' },
};

export const proyectos: Proyecto[] = [
  {
    id: 'PH-2024-001',
    nombre: 'Residencias El Ávila',
    estado: 'EN CONSTRUCCIÓN',
    ubicacion: 'Puerto Ordaz, Bolívar',
    tipo: 'EDIFICIO',
    tipoColor: 'bg-navy-800 text-white',
    totalInmuebles: 120,
    vendidos: 85,
    disponibles: 35,
  },
  {
    id: 'PH-2024-002',
    nombre: 'Urbanización Los Próceres',
    estado: 'ENTREGA INMEDIATA',
    ubicacion: 'San Cristóbal, Táchira',
    tipo: 'URBANISMO',
    tipoColor: 'bg-blue-600 text-white',
    totalInmuebles: 350,
    vendidos: 310,
    disponibles: 40,
  },
  {
    id: 'PH-2024-003',
    nombre: 'Villas del Sol Phase II',
    estado: 'PRE-VENTA',
    ubicacion: 'Lechería, Anzoátegui',
    tipo: 'TOWNHOUSES',
    tipoColor: 'bg-amber-600 text-white',
    totalInmuebles: 45,
    vendidos: 12,
    disponibles: 33,
  },
  {
    id: 'PH-2024-004',
    nombre: 'Complejo Habitacional Guayana',
    estado: 'EN CONSTRUCCIÓN',
    ubicacion: 'Ciudad Guayana, Bolívar',
    tipo: 'EDIFICIO',
    tipoColor: 'bg-navy-800 text-white',
    totalInmuebles: 280,
    vendidos: 195,
    disponibles: 85,
  },
];
