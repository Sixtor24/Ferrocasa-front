import type { Vehiculo } from '../types/vehiculo';

// Mock data basada en data real (5 registros, serial carrocería vacío en todos)
export const vehiculos: Vehiculo[] = [
  { id: 1, codigoInterno: 'VH-001', marca: 'Toyota', modelo: 'Hilux 4x4', color: 'Blanco', anioFabricacion: 2019, serialMotor: '2TR-FE-482913', sinSerialMotor: false, serialCarroceria: '', sinSerialCarroceria: true, placa: 'AB123CD', sinPlaca: false, condicionFisica: 'Bueno', estadoUso: 'En uso', categoriaGeneral: 'Camioneta', subcategoria: 'Pick-up doble cabina', documentoAdquisicion: 'OC-2019-0456', valorAdquisicion: 35000, estatusCarga: 'Parcial', observaciones: 'Asignada a Gerencia de Ingeniería. Serial de carrocería no disponible en documentos.' },
  { id: 2, codigoInterno: 'VH-002', marca: 'Ford', modelo: 'Ranger XLT', color: 'Gris', anioFabricacion: 2018, serialMotor: 'PUMA-2.2-339102', sinSerialMotor: false, serialCarroceria: '', sinSerialCarroceria: true, placa: 'S/P', sinPlaca: true, condicionFisica: 'Regular', estadoUso: 'En taller', categoriaGeneral: 'Camioneta', subcategoria: 'Pick-up doble cabina', documentoAdquisicion: 'TR-2018-0102', valorAdquisicion: 28000, estatusCarga: 'Parcial', observaciones: 'En taller por falla en caja de cambios. Sin placa por trámite pendiente.' },
  { id: 3, codigoInterno: 'VH-003', marca: 'Chevrolet', modelo: 'NPR 714', color: 'Blanco', anioFabricacion: 2016, serialMotor: '4HK1-TC-203847', sinSerialMotor: false, serialCarroceria: '', sinSerialCarroceria: true, placa: 'EF456GH', sinPlaca: false, condicionFisica: 'Regular', estadoUso: 'En uso', categoriaGeneral: 'Camión', subcategoria: 'Camión mediano', documentoAdquisicion: 'OC-2016-0089', valorAdquisicion: 45000, estatusCarga: 'Parcial', observaciones: 'Uso exclusivo para transporte de materiales de construcción.' },
  { id: 4, codigoInterno: 'VH-004', marca: 'Mitsubishi', modelo: 'L200 Sportero', color: 'Negro', anioFabricacion: 2020, serialMotor: '4D56-HP-556723', sinSerialMotor: false, serialCarroceria: '', sinSerialCarroceria: true, placa: 'IJ789KL', sinPlaca: false, condicionFisica: 'Bueno', estadoUso: 'En uso', categoriaGeneral: 'Camioneta', subcategoria: 'Pick-up doble cabina', documentoAdquisicion: 'OC-2020-0210', valorAdquisicion: 38000, estatusCarga: 'Parcial', observaciones: 'Asignada a Presidencia.' },
  { id: 5, codigoInterno: 'VH-005', marca: 'Caterpillar', modelo: '420F2 IT', color: 'Amarillo', anioFabricacion: 2015, serialMotor: 'S/S', sinSerialMotor: true, serialCarroceria: '', sinSerialCarroceria: true, placa: 'S/P', sinPlaca: true, condicionFisica: 'Dañado', estadoUso: 'Desincorporado', categoriaGeneral: 'Maquinaria pesada', subcategoria: 'Retroexcavadora', documentoAdquisicion: '', valorAdquisicion: 120000, estatusCarga: 'Parcial', observaciones: 'Maquinaria pesada, no requiere placa. Motor con daño severo, pendiente de desincorporación formal.' },
];

export const vehiculosStats = {
  total: 5,
  enUso: 3,
  enTaller: 1,
  desincorporado: 1,
  sinPlaca: 2,
  sinSerialCarroceria: 5,
  condicionBueno: 2,
  condicionRegular: 2,
  condicionDanado: 1,
};
