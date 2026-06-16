import SearchableSelect from '../forms/SearchableSelect';
import { getEstadoUsoDetailSelectConfig } from '../../utils/estadoUsoDetail';
import type { EstadoUso } from '../../types/bien';

type EstadoUsoDetailFieldProps = {
  value: EstadoUso;
  onChange: (value: EstadoUso) => void;
  options: readonly EstadoUso[];
  retirado: boolean;
  canWriteAssets: boolean;
  canReactivateEstadoUso: boolean;
  className?: string;
};

export default function EstadoUsoDetailField({
  value,
  onChange,
  options,
  retirado,
  canWriteAssets,
  canReactivateEstadoUso,
  className = 'max-w-xs',
}: EstadoUsoDetailFieldProps) {
  const selectConfig = getEstadoUsoDetailSelectConfig({
    retirado,
    canWriteAssets,
    canReactivateEstadoUso,
    allOptions: options,
    currentValue: value,
  });

  return (
    <SearchableSelect
      value={value}
      onChange={(next) => onChange(next as EstadoUso)}
      options={selectConfig.options}
      className={className}
      disabled={selectConfig.disabled}
      disableSearch
    />
  );
}
