import type { ReactNode } from 'react';

interface ModuleMetricCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  iconWrapClassName?: string;
  borderClassName?: string;
  valueClassName?: string;
  loading?: boolean;
}

export default function ModuleMetricCard({
  label,
  value,
  icon,
  iconWrapClassName = 'bg-navy-100',
  borderClassName = 'border-gray-200',
  valueClassName = 'text-navy-900',
  loading = false,
}: ModuleMetricCardProps) {
  if (loading) {
    return (
      <div
        className={`bg-white rounded-xl border p-5 flex items-center gap-4 animate-pulse ${borderClassName}`}
        aria-hidden
      >
        <div className="w-11 h-11 rounded-xl bg-gray-200 shrink-0" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="h-7 bg-gray-200 rounded w-16" />
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border p-5 flex items-center gap-4 ${borderClassName}`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconWrapClassName}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm text-gray-500">{label}</p>
        <p className={`text-2xl font-bold truncate tabular-nums ${valueClassName}`}>{value}</p>
      </div>
    </div>
  );
}

export function formatAreaM2(value: number): string {
  return `${(value ?? 0).toLocaleString('es-VE')} m²`;
}
