import type { ReactNode } from 'react';

interface ModuleMetricCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  iconWrapClassName?: string;
  borderClassName?: string;
  valueClassName?: string;
}

export default function ModuleMetricCard({
  label,
  value,
  icon,
  iconWrapClassName = 'bg-navy-100',
  borderClassName = 'border-gray-200',
  valueClassName = 'text-navy-900',
}: ModuleMetricCardProps) {
  return (
    <div className={`bg-white rounded-xl border p-5 flex items-center gap-4 ${borderClassName}`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconWrapClassName}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm text-gray-500">{label}</p>
        <p className={`text-2xl font-bold truncate ${valueClassName}`}>{value}</p>
      </div>
    </div>
  );
}

export function formatAreaM2(value: number): string {
  return `${(value ?? 0).toLocaleString('es-VE')} m²`;
}
