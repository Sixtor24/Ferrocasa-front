import {
  ALMACENES_BIENES_ADMINISTRATIVOS,
  DEPARTAMENTOS_BIENES_ADMINISTRATIVOS,
  SEDES_BIENES_ADMINISTRATIVOS,
} from '../../data/bienesCatalogos';
import RegistroBienesModal from './RegistroBienesModal';

type RegistroBienesAdministrativosModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
};

export default function RegistroBienesAdministrativosModal(props: RegistroBienesAdministrativosModalProps) {
  return (
    <RegistroBienesModal
      {...props}
      modulo="administrativo"
      titulo="Registro de Bienes e Inmuebles: Edificio Administrativo"
      sedes={SEDES_BIENES_ADMINISTRATIVOS}
      departamentos={DEPARTAMENTOS_BIENES_ADMINISTRATIVOS}
      almacenesCatalog={ALMACENES_BIENES_ADMINISTRATIVOS}
    />
  );
}
