export const dashboardStats = {
  totalBienes: { valor: 4250, cambio: '+2.4%' },
  stockBajo: { valor: 12, urgente: true },
  parcelasDisponibles: { valor: 85, actualizado: true },
  movimientosHoy: { valor: 24 },
};

export const movimientosAlmacen = [
  { dia: 'LUN', entradas: 120, salidas: 80 },
  { dia: 'MAR', entradas: 95, salidas: 110 },
  { dia: 'MIE', entradas: 410, salidas: 200 },
  { dia: 'JUE', entradas: 180, salidas: 150 },
  { dia: 'VIE', entradas: 220, salidas: 190 },
  { dia: 'SAB', entradas: 60, salidas: 40 },
  { dia: 'DOM', entradas: 30, salidas: 20 },
];

export const estatusInmuebles = {
  vendido: 1240,
  disponible: 485,
  porcentajeOcupado: 85,
};

export const ultimaAuditoria = {
  mensaje: 'Salida de 500 cabillas',
  hora: '10:15 AM',
};

export const accionesRapidas = [
  { id: 1, nombre: 'Registrar Entrada', icono: 'LogIn' },
  { id: 2, nombre: 'Registrar Salida', icono: 'LogOut' },
  { id: 3, nombre: 'Venta Inmueble', icono: 'Tag' },
  { id: 4, nombre: 'Reportes Mensuales', icono: 'Smile' },
];
