import { useState, useMemo } from 'react';
import {
  Search, X, ChevronLeft, ChevronRight,
  ArrowUpDown, ArrowUp, ArrowDown,
  Download, FileText,
} from 'lucide-react';

export interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  hidden?: boolean;
}

export interface FilterOption {
  key: string;
  label: string;
  options: string[];
  defaultValue?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  filters?: FilterOption[];
  searchPlaceholder?: string;
  searchKeys?: (keyof T)[];
  perPage?: number;
  onRowClick?: (item: T) => void;
  onExport?: (type: 'PDF' | 'Excel' | 'CSV') => void;
  emptyMessage?: string;
  title?: string;
}

type SortDir = 'asc' | 'desc' | null;

export default function DataTable<T extends { id: number | string }>({
  data,
  columns,
  filters = [],
  searchPlaceholder = 'Buscar...',
  searchKeys = [],
  perPage = 10,
  onRowClick,
  onExport,
  emptyMessage = 'No se encontraron registros.',
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [filterValues, setFilterValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    filters.forEach((f) => { init[f.key] = f.defaultValue || f.options[0] || ''; });
    return init;
  });
  const [exportMsg, setExportMsg] = useState('');

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : sortDir === 'desc' ? null : 'asc');
      if (sortDir === 'desc') setSortKey(null);
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const handleFilter = (key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleExport = (type: 'PDF' | 'Excel' | 'CSV') => {
    if (onExport) {
      onExport(type);
    } else {
      setExportMsg(`Generando ${type}...`);
      setTimeout(() => setExportMsg(`${type} exportado exitosamente`), 1500);
      setTimeout(() => setExportMsg(''), 4000);
    }
  };

  const filtered = useMemo(() => {
    let result = [...data];

    // Search
    if (search.length >= 2 && searchKeys.length > 0) {
      const q = search.toLowerCase();
      result = result.filter((item) =>
        searchKeys.some((key) => {
          const val = item[key];
          return val !== null && val !== undefined && String(val).toLowerCase().includes(q);
        })
      );
    }

    // Filters
    filters.forEach((f) => {
      const val = filterValues[f.key];
      if (val && val !== f.options[0]) {
        result = result.filter((item) => {
          const itemVal = (item as Record<string, unknown>)[f.key];
          return String(itemVal) === val;
        });
      }
    });

    // Sort
    if (sortKey && sortDir) {
      result.sort((a, b) => {
        const aVal = (a as Record<string, unknown>)[sortKey];
        const bVal = (b as Record<string, unknown>)[sortKey];
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        const cmp = String(aVal).localeCompare(String(bVal), 'es', { numeric: true });
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }

    return result;
  }, [data, search, searchKeys, filters, filterValues, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const visibleCols = columns.filter((c) => !c.hidden);

  const hasActiveFilters = search !== '' || filters.some((f) => filterValues[f.key] !== f.options[0]);

  const clearAll = () => {
    setSearch('');
    const init: Record<string, string> = {};
    filters.forEach((f) => { init[f.key] = f.options[0] || ''; });
    setFilterValues(init);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 bg-white"
          />
          {search && (
            <button onClick={() => { setSearch(''); setPage(1); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {exportMsg && <span className="text-sm text-green-600 font-medium animate-pulse">{exportMsg}</span>}
          <button onClick={() => handleExport('PDF')} className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            <FileText size={14} /> PDF
          </button>
          <button onClick={() => handleExport('Excel')} className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            <Download size={14} /> Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      {filters.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {filters.map((f) => (
            <div key={f.key}>
              <label className="text-xs text-gray-500 mb-1 block">{f.label}</label>
              <select
                value={filterValues[f.key] || ''}
                onChange={(e) => handleFilter(f.key, e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-navy-500"
              >
                {f.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          ))}
          {hasActiveFilters && (
            <div className="flex items-end">
              <button onClick={clearAll} className="flex items-center gap-1 px-3 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50">
                <X size={14} /> Limpiar
              </button>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-200">
                {visibleCols.map((col) => (
                  <th
                    key={col.key}
                    className={`text-${col.align || 'left'} text-xs font-semibold text-gray-500 uppercase px-4 py-3 ${col.sortable ? 'cursor-pointer select-none hover:text-gray-700' : ''}`}
                    onClick={col.sortable ? () => handleSort(col.key) : undefined}
                  >
                    <div className={`flex items-center gap-1 ${col.align === 'center' ? 'justify-center' : col.align === 'right' ? 'justify-end' : ''}`}>
                      {col.label}
                      {col.sortable && (
                        sortKey === col.key
                          ? sortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                          : <ArrowUpDown size={12} className="opacity-30" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={visibleCols.length} className="px-4 py-12 text-center text-gray-400 text-sm">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                paginated.map((item) => (
                  <tr
                    key={item.id}
                    className={`border-b border-gray-100 hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
                    onClick={() => onRowClick?.(item)}
                  >
                    {visibleCols.map((col) => (
                      <td key={col.key} className={`px-4 py-3.5 text-sm ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''}`}>
                        {col.render
                          ? col.render(item)
                          : String((item as Record<string, unknown>)[col.key] ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-gray-200 gap-2">
          <p className="text-sm text-gray-500">
            {filtered.length === 0
              ? 'Sin resultados'
              : `Mostrando ${(page - 1) * perPage + 1}–${Math.min(page * perPage, filtered.length)} de ${filtered.length}`}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 disabled:opacity-30"
            >
              <ChevronLeft size={18} />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let p: number;
              if (totalPages <= 5) {
                p = i + 1;
              } else if (page <= 3) {
                p = i + 1;
              } else if (page >= totalPages - 2) {
                p = totalPages - 4 + i;
              } else {
                p = page - 2 + i;
              }
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium ${
                    page === p ? 'bg-navy-900 text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {p}
                </button>
              );
            })}
            {totalPages > 5 && page < totalPages - 2 && <span className="text-gray-400 px-1">...</span>}
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 disabled:opacity-30"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
