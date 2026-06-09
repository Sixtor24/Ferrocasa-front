import ModalField from '../modals/ModalField';

type ResponsableAlmacenFieldProps = {
  nombre: string;
  ciResponsable?: string;
  sinConfigurar?: boolean;
};

export default function ResponsableAlmacenField({
  nombre,
  ciResponsable,
  sinConfigurar,
}: ResponsableAlmacenFieldProps) {
  return (
    <ModalField label="Responsable">
      <input
        value={nombre && nombre !== '—' ? nombre : '—'}
        readOnly
        className="input-field bg-gray-50 text-gray-700"
        title="Se asigna al elegir el almacén"
      />
      {sinConfigurar && (
        <p className="text-xs text-amber-700 mt-1.5">
          Configure el responsable de este almacén en Configuración antes de registrar el ítem.
        </p>
      )}
      {ciResponsable && !sinConfigurar && (
        <p className="text-xs text-gray-500 mt-1.5 font-mono">CI: {ciResponsable}</p>
      )}
    </ModalField>
  );
}
