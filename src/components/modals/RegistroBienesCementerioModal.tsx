import { useMemo } from 'react';
import type { ApiAlmacen, ApiSede } from '../../api/types';
import { ALMACENES_CEMENTERIO, SEDES_CEMENTERIO } from '../../data/bienesCatalogos';
import { nombresAlmacenesCementerio } from '../../utils/cementerioAlmacenes';
import RegistroBienesModal from './RegistroBienesModal';

type RegistroBienesCementerioModalProps = {
  open: boolean;
  onClose: () => void;
  almacenes: ApiAlmacen[];
  sedes?: ApiSede[];
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
};

export default function RegistroBienesCementerioModal({
  sedes = [],
  almacenes,
  ...props
}: RegistroBienesCementerioModalProps) {
  const departamentos = useMemo(
    () => nombresAlmacenesCementerio(almacenes, sedes),
    [almacenes, sedes],
  );

  return (
    <RegistroBienesModal
      {...props}
      almacenes={almacenes}
      modulo="cementerio"
      titulo="Registro de Bienes e Inmuebles: Cementerio"
      sedes={SEDES_CEMENTERIO}
      sedeReadOnly
      departamentos={departamentos}
      sedesReferencia={sedes}
      almacenesCatalog={ALMACENES_CEMENTERIO}
    />
  );
}
