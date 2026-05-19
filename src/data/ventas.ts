export interface Venta {
  id: number;
  codigo: string;
  cliente: string;
  inmueble: string;
  proyecto: string;
  monto: string;
  montoNum: number;
  fecha: string;
  estatus: 'COMPLETADA' | 'PENDIENTE' | 'EN PROCESO' | 'CANCELADA';
  metodoPago: string;
}

export const ventas: Venta[] = [
  { id: 1, codigo: 'VTA-2024-001', cliente: 'Carlos A. López M.', inmueble: 'Apto A-12', proyecto: 'Residencias El Ávila', monto: '$85,400.00', montoNum: 85400, fecha: '18/05/2024', estatus: 'COMPLETADA', metodoPago: 'Financiamiento' },
  { id: 2, codigo: 'VTA-2024-002', cliente: 'María F. Rodríguez', inmueble: 'Casa T-05', proyecto: 'Villa Rosa Urbanismo', monto: '$120,000.00', montoNum: 120000, fecha: '16/05/2024', estatus: 'EN PROCESO', metodoPago: 'Contado' },
  { id: 3, codigo: 'VTA-2024-003', cliente: 'José R. Hernández', inmueble: 'Apto B-08', proyecto: 'Residencias El Ávila', monto: '$78,500.00', montoNum: 78500, fecha: '15/05/2024', estatus: 'COMPLETADA', metodoPago: 'Financiamiento' },
  { id: 4, codigo: 'VTA-2024-004', cliente: 'Ana L. Martínez P.', inmueble: 'Local LC-02', proyecto: 'Torre Bicentenario', monto: '$45,200.00', montoNum: 45200, fecha: '14/05/2024', estatus: 'PENDIENTE', metodoPago: 'Mixto' },
  { id: 5, codigo: 'VTA-2024-005', cliente: 'Pedro J. Gómez', inmueble: 'Terreno P-20', proyecto: 'Parcelas Sur', monto: '$32,000.00', montoNum: 32000, fecha: '12/05/2024', estatus: 'CANCELADA', metodoPago: 'Contado' },
  { id: 6, codigo: 'VTA-2024-006', cliente: 'Luisa M. García V.', inmueble: 'Apto C-03', proyecto: 'Torre Bicentenario', monto: '$92,800.00', montoNum: 92800, fecha: '10/05/2024', estatus: 'COMPLETADA', metodoPago: 'Financiamiento' },
  { id: 7, codigo: 'VTA-2024-007', cliente: 'Ricardo D. Pérez', inmueble: 'Casa T-11', proyecto: 'Villa Rosa Urbanismo', monto: '$115,000.00', montoNum: 115000, fecha: '08/05/2024', estatus: 'EN PROCESO', metodoPago: 'Mixto' },
  { id: 8, codigo: 'VTA-2024-008', cliente: 'Carmen E. Díaz S.', inmueble: 'Apto D-06', proyecto: 'Residencias El Ávila', monto: '$68,900.00', montoNum: 68900, fecha: '05/05/2024', estatus: 'COMPLETADA', metodoPago: 'Contado' },
  { id: 9, codigo: 'VTA-2024-009', cliente: 'Fernando A. Ruiz', inmueble: 'Local LC-05', proyecto: 'Torre Bicentenario', monto: '$55,600.00', montoNum: 55600, fecha: '03/05/2024', estatus: 'PENDIENTE', metodoPago: 'Financiamiento' },
  { id: 10, codigo: 'VTA-2024-010', cliente: 'Daniela P. Torres', inmueble: 'Casa T-18', proyecto: 'Villa Rosa Urbanismo', monto: '$128,500.00', montoNum: 128500, fecha: '01/05/2024', estatus: 'COMPLETADA', metodoPago: 'Contado' },
];

export const ventasStats = {
  totalVentas: ventas.length,
  montoTotal: '$821,900.00',
  completadas: ventas.filter((v) => v.estatus === 'COMPLETADA').length,
  pendientes: ventas.filter((v) => v.estatus === 'PENDIENTE').length,
  enProceso: ventas.filter((v) => v.estatus === 'EN PROCESO').length,
  canceladas: ventas.filter((v) => v.estatus === 'CANCELADA').length,
  promedioVenta: '$82,190.00',
  tasaCierre: '80%',
};

export const proyectosVenta = ['Todos los proyectos', 'Residencias El Ávila', 'Villa Rosa Urbanismo', 'Torre Bicentenario', 'Parcelas Sur'];
export const estatusVenta = ['Todos', 'COMPLETADA', 'PENDIENTE', 'EN PROCESO', 'CANCELADA'];
export const metodosPago = ['Todos', 'Contado', 'Financiamiento', 'Mixto'];
