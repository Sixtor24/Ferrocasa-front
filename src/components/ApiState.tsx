import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';

type Props = {
  loading?: boolean;
  preserveContentOnLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  empty?: boolean;
  emptyMessage?: string;
  children: React.ReactNode;
};

export default function ApiState({
  loading,
  preserveContentOnLoading = false,
  error,
  onRetry,
  empty,
  emptyMessage = 'No hay registros.',
  children,
}: Props) {
  if (loading && preserveContentOnLoading) {
    return (
      <div className="relative">
        <div className="pointer-events-none opacity-60 transition-opacity">
          {children}
        </div>
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/55 backdrop-blur-[1px]">
          <div className="inline-flex items-center gap-2 rounded-full border border-navy-100 bg-white px-4 py-2 text-sm font-medium text-navy-800 shadow-sm">
            <Loader2 className="animate-spin text-navy-600" size={16} />
            Actualizando datos...
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-500">
        <Loader2 className="animate-spin text-navy-600" size={32} />
        <p className="text-sm">Cargando datos del servidor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 flex flex-col items-center gap-3 text-center">
        <AlertCircle className="text-red-500" size={28} />
        <p className="text-sm text-red-800 font-medium">{error}</p>
        <p className="text-xs text-red-600 max-w-md">
          {error.includes('502')
            ? 'El proxy no alcanza el backend. En local: terminal 1 → docker compose up -d db; terminal 2 → cd cvg-ferrocasa-sc && pnpm dev (puerto 4000).'
            : 'Verifica que el backend esté en ejecución (pnpm dev en cvg-ferrocasa-sc) y que Docker/PostgreSQL estén activos.'}
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
          >
            <RefreshCw size={16} />
            Reintentar
          </button>
        )}
      </div>
    );
  }

  if (empty) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-10 text-center text-sm text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return <>{children}</>;
}
