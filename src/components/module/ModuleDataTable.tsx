import { Eye } from 'lucide-react';
import type { Column } from '../DataTable';

interface ModuleDataTableProps<T extends { id: number | string }> {
  data: T[];
  columns: Column<T>[];
  onDetails?: (item: T) => void;
  emptyMessage?: string;
}

export default function ModuleDataTable<T extends { id: number | string }>({
  data,
  columns,
  onDetails,
  emptyMessage = 'No se encontraron registros.',
}: ModuleDataTableProps<T>) {
  const cols = onDetails
    ? [
        ...columns,
        {
          key: '_detalles',
          label: 'Detalles',
          align: 'center' as const,
          render: (item: T) => (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDetails(item);
              }}
              className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-navy-200 text-navy-600 hover:bg-navy-900 hover:text-white hover:border-navy-900 transition-colors"
              title="Ver detalles"
            >
              <Eye size={16} />
            </button>
          ),
        },
      ]
    : columns;

  return (
    <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="bg-navy-900/95">
              {cols.map((col) => (
                <th
                  key={col.key}
                  className={`text-left text-xs font-semibold text-white uppercase tracking-wider px-4 py-3.5 whitespace-nowrap ${
                    col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''
                  }`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={cols.length} className="px-6 py-16 text-center text-gray-400 text-sm">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, rowIdx) => (
                <tr
                  key={item.id}
                  className={`border-b border-gray-100 transition-colors hover:bg-navy-50/40 ${
                    rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'
                  }`}
                >
                  {cols.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3.5 text-sm text-gray-700 whitespace-nowrap ${
                        col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''
                      }`}
                    >
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
    </div>
  );
}
