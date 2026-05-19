export interface Inmueble {
  id: number;
  nombre: string;
  zona: string;
  tipoInmueble: string;
  codigo: string;
  superficie: string;
  precio: string;
  estatus: 'DISPONIBLE' | 'EN PROCESO' | 'VENDIDO';
}

export const inmuebles: Inmueble[] = [
  {
    id: 1,
    nombre: 'V-R-120 (Villa Rosa)',
    zona: 'Villa Rosa',
    tipoInmueble: 'Apartamento',
    codigo: 'CT-2024-001',
    superficie: '85.00 m²',
    precio: '$45,000.00',
    estatus: 'DISPONIBLE',
  },
  {
    id: 2,
    nombre: 'C-G-045 (Guayana)',
    zona: 'Guayana',
    tipoInmueble: 'Casa Residencial',
    codigo: 'CT-2024-002',
    superficie: '120.50 m²',
    precio: '$72,300.00',
    estatus: 'EN PROCESO',
  },
  {
    id: 3,
    nombre: 'L-P-002 (El Parque)',
    zona: 'El Parque',
    tipoInmueble: 'Local Comercial',
    codigo: 'CT-2024-003',
    superficie: '45.20 m²',
    precio: '$28,900.00',
    estatus: 'VENDIDO',
  },
  {
    id: 4,
    nombre: 'T-I-012 (Industrial)',
    zona: 'Industrial',
    tipoInmueble: 'Terreno',
    codigo: 'CT-2024-004',
    superficie: '1,500.00 m²',
    precio: '$125,000.00',
    estatus: 'DISPONIBLE',
  },
];

export const resumenInventario = {
  totalInmuebles: 1248,
  disponibilidad: '64%',
};

export const proyectosOrigen = [
  'Urbanización Villa Rosa',
  'Residencias El Ávila',
  'Complejo Guayana',
  'Villas del Sol',
];

export const tiposInmueble = ['Apartamento', 'Casa Residencial', 'Local Comercial', 'Terreno'];
