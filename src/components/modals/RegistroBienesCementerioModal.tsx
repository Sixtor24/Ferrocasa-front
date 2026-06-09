import type { ApiSede } from '../../api/types';
import { ALMACENES_CEMENTERIO, SEDES_CEMENTERIO } from '../../data/bienesCatalogos';
import RegistroBienesModal from './RegistroBienesModal';

type RegistroBienesCementerioModalProps = {
  open: boolean;
  onClose: () => void;
  sedes?: ApiSede[];
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
};

export default function RegistroBienesCementerioModal({
  sedes = [],
  ...props
}: RegistroBienesCementerioModalProps) {
  return (
    <RegistroBienesModal
      {...props}
      modulo="cementerio"
      titulo="Registro de Bienes e Inmuebles: Cementerio"
      sedes={SEDES_CEMENTERIO}
      sedeReadOnly
      departamentos={[]}
      sedesReferencia={sedes}
      almacenesCatalog={ALMACENES_CEMENTERIO}
    />
  );
}
