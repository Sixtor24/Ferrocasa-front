// KPIs consolidados basados en data real
export const dashboardStats = {
  totalBienesMuebles: { valor: 1640, cambio: '+3.2%', label: 'Bienes en Edificio Administrativo' },
  inventarioCementerio: { valor: 304, cambio: '+1.8%', label: 'Bienes en Cementerio' },
  totalInmuebles: { valor: 136, cambio: '', label: 'Parcelas' },
  totalVehiculos: { valor: 5, cambio: '', label: 'Vehículos y Maquinarias' },
};

export const resumenGeneral = {
  bienesCompletos: 803,
  bienesParciales: 632,
  bienesError: 205,
  parcelasDisponibles: 68,
  parcelasOcupadas: 152,
  inmDisponibles: 58,
  inmComprometidos: 22,
  vehiculosActivos: 4,
  vehiculosInactivos: 1,
};

export const movimientosAlmacen = [
  { dia: 'LUN', entradas: 45, salidas: 30 },
  { dia: 'MAR', entradas: 38, salidas: 42 },
  { dia: 'MIE', entradas: 72, salidas: 55 },
  { dia: 'JUE', entradas: 60, salidas: 48 },
  { dia: 'VIE', entradas: 85, salidas: 63 },
  { dia: 'SAB', entradas: 20, salidas: 15 },
  { dia: 'DOM', entradas: 8, salidas: 5 },
];

export const distribucionActivos = [
  { name: 'Bienes en Edificio Administrativo', value: 1640, color: '#102a43' },
  { name: 'Bienes en Cementerio', value: 304, color: '#334e68' },
  { name: 'Parcelas', value: 136, color: '#627d98' },
  { name: 'Vehículos y Maquinarias', value: 5, color: '#9fb3c8' },
];

export const estatusInmuebles = {
  disponible: 58,
  ocupado: 34,
  comprometido: 22,
  desincorporado: 14,
  enLitigio: 8,
  total: 136,
  porcentajeDisponible: 43,
};

export const ultimaAuditoria = {
  mensaje: 'Registro masivo: 120 bienes importados vía Excel — Sede Puerto Ordaz',
  hora: '10:45 AM',
};
