import type { ApiAlmacen } from '../../api/types';
import {
  ALMACENES_CEMENTERIO,
  DEPARTAMENTOS_CEMENTERIO,
  SEDES_CEMENTERIO,
} from '../../data/bienesCatalogos';
import RegistroBienesModal from './RegistroBienesModal';

type RegistroBienesCementerioModalProps = {
  open: boolean;
  onClose: () => void;
  almacenes: ApiAlmacen[];
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
};

export default function RegistroBienesCementerioModal(props: RegistroBienesCementerioModalProps) {
  return (
    <RegistroBienesModal
      {...props}
      modulo="cementerio"
      titulo="Registro de Bienes e Inmuebles: Cementerio"
      sedes={SEDES_CEMENTERIO}
      sedeReadOnly
      departamentos={DEPARTAMENTOS_CEMENTERIO}
      almacenesCatalog={ALMACENES_CEMENTERIO}
    />
  );
}
