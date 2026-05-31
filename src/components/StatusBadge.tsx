const STYLES: Record<string, string> = {
  // Condición física
  'Bueno': 'bg-green-100 text-green-800',
  'Regular': 'bg-amber-100 text-amber-800',
  'Dañado': 'bg-orange-100 text-orange-800',
  'Averiado': 'bg-red-100 text-red-800',
  'Inservible': 'bg-red-200 text-red-900',
  // Estado de uso
  'En uso': 'bg-blue-100 text-blue-800',
  'En obsolescencia': 'bg-amber-100 text-amber-800',
  'Obsoleto': 'bg-red-100 text-red-700',
  'En almacén': 'bg-gray-100 text-gray-700',
  'En tránsito': 'bg-purple-100 text-purple-800',
  'Desincorporado': 'bg-red-100 text-red-700',
  'Por verificar': 'bg-amber-100 text-amber-700',
  // Estatus carga
  'Completo': 'bg-green-100 text-green-800',
  'Parcial': 'bg-amber-100 text-amber-700',
  'Pendiente': 'bg-gray-100 text-gray-600',
  'Error': 'bg-red-100 text-red-800',
  // Ocupación
  'Disponible': 'bg-green-100 text-green-800',
  'Ocupado': 'bg-red-100 text-red-700',
  'Ocupada': 'bg-red-100 text-red-700',
  'Comprometido': 'bg-amber-100 text-amber-700',
  'En litigio': 'bg-purple-100 text-purple-800',
  'Reservada': 'bg-blue-100 text-blue-800',
  'Mantenimiento': 'bg-gray-200 text-gray-700',
  'Vencida': 'bg-red-200 text-red-900',
  // Vehículos
  'En taller': 'bg-orange-100 text-orange-800',
  // Genérico
  'DISPONIBLE': 'bg-green-100 text-green-800',
  'EN PROCESO': 'bg-amber-100 text-amber-800',
  'VENDIDO': 'bg-navy-100 text-navy-800',
};

const DOT_STYLES: Record<string, string> = {
  'Bueno': 'bg-green-500',
  'Regular': 'bg-amber-500',
  'Dañado': 'bg-orange-500',
  'Averiado': 'bg-red-500',
  'Inservible': 'bg-red-700',
  'Completo': 'bg-green-500',
  'Parcial': 'bg-amber-500',
  'Pendiente': 'bg-gray-400',
  'Error': 'bg-red-500',
};

interface StatusBadgeProps {
  status: string;
  showDot?: boolean;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, showDot = false, size = 'sm' }: StatusBadgeProps) {
  const style = STYLES[status] || 'bg-gray-100 text-gray-600';
  const dotStyle = DOT_STYLES[status] || 'bg-gray-400';
  const sizeClass = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span className={`inline-flex items-center gap-1.5 font-bold rounded-md ${style} ${sizeClass}`}>
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${dotStyle}`} />}
      {status}
    </span>
  );
}
