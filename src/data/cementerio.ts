export interface Parcela {
  id: number;
  codigo: string;
  sector: string;
  fila: string;
  numero: number;
  tipo: 'Individual' | 'Familiar' | 'Nicho' | 'Osario';
  estatus: 'DISPONIBLE' | 'OCUPADA' | 'RESERVADA' | 'MANTENIMIENTO';
  titular: string;
  fechaAsignacion: string;
}

export const parcelas: Parcela[] = [
  { id: 1, codigo: 'CM-A-001', sector: 'Sector A - Norte', fila: 'F-01', numero: 1, tipo: 'Individual', estatus: 'OCUPADA', titular: 'Fam. Rodríguez M.', fechaAsignacion: '12/03/2022' },
  { id: 2, codigo: 'CM-A-002', sector: 'Sector A - Norte', fila: 'F-01', numero: 2, tipo: 'Familiar', estatus: 'OCUPADA', titular: 'Fam. López G.', fechaAsignacion: '05/06/2021' },
  { id: 3, codigo: 'CM-A-003', sector: 'Sector A - Norte', fila: 'F-01', numero: 3, tipo: 'Individual', estatus: 'DISPONIBLE', titular: '-', fechaAsignacion: '-' },
  { id: 4, codigo: 'CM-B-001', sector: 'Sector B - Sur', fila: 'F-02', numero: 1, tipo: 'Nicho', estatus: 'RESERVADA', titular: 'Fam. Pérez A.', fechaAsignacion: '20/01/2024' },
  { id: 5, codigo: 'CM-B-002', sector: 'Sector B - Sur', fila: 'F-02', numero: 2, tipo: 'Osario', estatus: 'OCUPADA', titular: 'Fam. Hernández V.', fechaAsignacion: '18/11/2020' },
  { id: 6, codigo: 'CM-B-003', sector: 'Sector B - Sur', fila: 'F-02', numero: 3, tipo: 'Individual', estatus: 'MANTENIMIENTO', titular: '-', fechaAsignacion: '-' },
  { id: 7, codigo: 'CM-C-001', sector: 'Sector C - Este', fila: 'F-03', numero: 1, tipo: 'Familiar', estatus: 'OCUPADA', titular: 'Fam. García T.', fechaAsignacion: '30/07/2023' },
  { id: 8, codigo: 'CM-C-002', sector: 'Sector C - Este', fila: 'F-03', numero: 2, tipo: 'Individual', estatus: 'DISPONIBLE', titular: '-', fechaAsignacion: '-' },
  { id: 9, codigo: 'CM-C-003', sector: 'Sector C - Este', fila: 'F-03', numero: 3, tipo: 'Nicho', estatus: 'OCUPADA', titular: 'Fam. Díaz R.', fechaAsignacion: '14/09/2022' },
  { id: 10, codigo: 'CM-D-001', sector: 'Sector D - Oeste', fila: 'F-04', numero: 1, tipo: 'Familiar', estatus: 'DISPONIBLE', titular: '-', fechaAsignacion: '-' },
  { id: 11, codigo: 'CM-D-002', sector: 'Sector D - Oeste', fila: 'F-04', numero: 2, tipo: 'Individual', estatus: 'RESERVADA', titular: 'Fam. Martínez C.', fechaAsignacion: '02/04/2024' },
  { id: 12, codigo: 'CM-D-003', sector: 'Sector D - Oeste', fila: 'F-04', numero: 3, tipo: 'Osario', estatus: 'DISPONIBLE', titular: '-', fechaAsignacion: '-' },
];

export const sectores = ['Todos los sectores', 'Sector A - Norte', 'Sector B - Sur', 'Sector C - Este', 'Sector D - Oeste'];
export const tiposParcela = ['Todos los tipos', 'Individual', 'Familiar', 'Nicho', 'Osario'];
export const estatusParcela = ['Todos', 'DISPONIBLE', 'OCUPADA', 'RESERVADA', 'MANTENIMIENTO'];

export const cementerioStats = {
  totalParcelas: parcelas.length,
  disponibles: parcelas.filter((p) => p.estatus === 'DISPONIBLE').length,
  ocupadas: parcelas.filter((p) => p.estatus === 'OCUPADA').length,
  reservadas: parcelas.filter((p) => p.estatus === 'RESERVADA').length,
  mantenimiento: parcelas.filter((p) => p.estatus === 'MANTENIMIENTO').length,
  capacidad: '67%',
};
