import ModulePagination from './ModulePagination';

export const MODULE_TABLE_PAGE_SIZES = [50, 100, 200] as const;

type ModuleTablePaginationBarProps = {
  perPage: number;
  onPerPageChange: (size: number) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSizeOptions?: readonly number[];
};

export default function ModuleTablePaginationBar({
  perPage,
  onPerPageChange,
  page,
  totalPages,
  onPageChange,
  pageSizeOptions = MODULE_TABLE_PAGE_SIZES,
}: ModuleTablePaginationBarProps) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-3 py-1">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>Filas por página:</span>
        <select
          value={perPage}
          onChange={(e) => onPerPageChange(Number(e.target.value))}
          className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-navy-500"
          aria-label="Filas por página"
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>
      <ModulePagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
    </div>
  );
}
