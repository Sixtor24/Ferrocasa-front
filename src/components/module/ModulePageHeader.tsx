import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Plus, FileSpreadsheet, FileText } from 'lucide-react';
import { toast } from 'sonner';
import {
  EXCEL_FORMAT_MODULE_KEYS,
  MODULE_EXCEL_FORMATS,
  type ModuleFormatKey,
} from '../../constants/excelFormats';
import { downloadExcelFormat } from '../../utils/downloadExcelFormat';

interface ModulePageHeaderProps {
  title: string;
  breadcrumb?: { label: string; to?: string }[];
  onCreate?: () => void;
  createLabel?: string;
  extraActions?: ReactNode;
  /** Módulo que define qué plantillas Excel descargar. */
  formatModule?: ModuleFormatKey;
  internalFormatLabel?: string;
}

export default function ModulePageHeader({
  title,
  breadcrumb = [{ label: 'Dashboard', to: '/dashboard' }],
  onCreate,
  createLabel = 'Crear Registro',
  extraActions,
  formatModule,
  internalFormatLabel,
}: ModulePageHeaderProps) {
  const [downloading, setDownloading] = useState<'sudebip' | 'interno' | null>(null);
  const moduleFormats =
    formatModule && EXCEL_FORMAT_MODULE_KEYS.includes(formatModule)
      ? MODULE_EXCEL_FORMATS[formatModule]
      : null;
  const internoLabel = internalFormatLabel ?? moduleFormats?.internoLabel ?? 'Formato Interno';

  const handleDownload = async (type: 'sudebip' | 'interno') => {
    if (!moduleFormats) return;

    setDownloading(type);
    try {
      await downloadExcelFormat(moduleFormats[type]);
      toast.success('Plantilla descargada correctamente');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo descargar la plantilla');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {breadcrumb.length > 0 && (
          <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-2 flex-wrap">
            {breadcrumb.map((item, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight size={14} className="shrink-0 text-gray-300" />}
                {item.to ? (
                  <Link to={item.to} className="hover:text-navy-700 transition-colors">
                    {item.label}
                  </Link>
                ) : (
                  <span className="font-medium text-navy-800">{item.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-2xl sm:text-3xl font-bold text-navy-900 tracking-tight font-display">
          {title}
        </h1>
      </div>
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {extraActions}
        {onCreate && (
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-navy-900 text-white rounded-lg text-sm font-semibold hover:bg-navy-800 shadow-sm transition-colors"
          >
            <Plus size={16} />
            {createLabel}
          </button>
        )}
        {moduleFormats && (
          <>
            <button
              type="button"
              onClick={() => void handleDownload('sudebip')}
              disabled={downloading !== null}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-navy-200 bg-white text-navy-800 rounded-lg text-sm font-medium hover:bg-navy-50 transition-colors disabled:opacity-60"
              title="Descargar plantilla oficial SUDEBIP"
            >
              <FileSpreadsheet size={16} />
              {downloading === 'sudebip' ? 'Descargando...' : 'Formato Sudebip'}
            </button>
            <button
              type="button"
              onClick={() => void handleDownload('interno')}
              disabled={downloading !== null}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 bg-white text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-60"
              title={`Descargar ${internoLabel}`}
            >
              <FileText size={16} />
              {downloading === 'interno' ? 'Descargando...' : internoLabel}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
