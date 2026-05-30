import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { inventarioCementerio } from '../data/cementerio';
import {
  AREAS_CEMENTERIO,
  ESTADOS_BIEN_CEMENTERIO,
  ESTADOS_USO_CEMENTERIO,
  DEPARTAMENTOS_CEMENTERIO,
  SEDES_CEMENTERIO,
} from '../types/cementerio';
import { formatFecha, formatMoneda } from '../utils/formatters';
import type { Column } from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { ImportExcelModal, NuevoBienCementerioModal, type NuevoBienCementerioForm } from '../components/modals';
import ModulePageHeader from '../components/module/ModulePageHeader';
import ModuleMetricCard from '../components/module/ModuleMetricCard';
import ModuleFilterBar from '../components/module/ModuleFilterBar';
import ModuleDataTable from '../components/module/ModuleDataTable';
import ModulePagination from '../components/module/ModulePagination';
import AssetDetailView from '../components/module/AssetDetailView';
import type { InventarioCementerio } from '../types/cementerio';
import {
  Package,
  AlertTriangle,
  AlertCircle,
  Upload,
  BarChart3,
  ArrowLeft,
  FileText,
} from 'lucide-react';

const PER_PAGE = 10;

export default function Cementerio() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [exportMsg, setExportMsg] = useState('');
  const [invList, setInvList] = useState(inventarioCementerio);
  const [filtros, setFiltros] = useState({
    codigo: '',
    descripcion: '',
    almacen: '',
    condicionFisica: '',
    departamento: '',
    numeroDocumento: '',
    estadoUso: '',
    buscar: '',
  });
  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const bienesStats = useMemo(() => ({
    total: invList.length,
    enUso: invList.filter((b) => b.estadoUso === 'En uso').length,
    regulares: invList.filter((b) => b.estadoBien === 'Regular').length,
    danados: invList.filter((b) =>
      ['Dañado', 'Averiado', 'Inservible'].includes(b.estadoBien)
    ).length,
  }), [invList]);

  const almacenOptions = useMemo(() => {
    const names = [...new Set(invList.map((b) => b.almacen).filter(Boolean))].sort();
    return ['Todas', ...names];
  }, [invList]);

  const filteredInventario = useMemo(() => {
    const q = filtros.buscar.toLowerCase();
    return invList.filter((b) => {
      if (filtros.codigo && !b.codigo.toLowerCase().includes(filtros.codigo.toLowerCase())) return false;
      if (filtros.descripcion && !b.descripcion.toLowerCase().includes(filtros.descripcion.toLowerCase())) return false;
      if (filtros.almacen && filtros.almacen !== 'Todas' && b.almacen !== filtros.almacen) return false;
      if (filtros.condicionFisica && filtros.condicionFisica !== 'Todas' && b.estadoBien !== filtros.condicionFisica) return false;
      if (filtros.departamento && filtros.departamento !== 'Todos' && b.departamento !== filtros.departamento) return false;
      if (filtros.numeroDocumento && !b.numeroDocumento.includes(filtros.numeroDocumento)) return false;
      if (filtros.estadoUso && filtros.estadoUso !== 'Todos' && b.estadoUso !== filtros.estadoUso) return false;
      if (q) {
        const hay =
          b.codigo.toLowerCase().includes(q) ||
          b.descripcion.toLowerCase().includes(q) ||
          b.marca.toLowerCase().includes(q) ||
          b.serial.toLowerCase().includes(q);
        if (!hay) return false;
      }
      return true;
    });
  }, [invList, filtros]);

  const totalPages = Math.max(1, Math.ceil(filteredInventario.length / PER_PAGE));
  const paginatedInventario = filteredInventario.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const setFiltro = (key: keyof typeof filtros, value: string) => {
    setFiltros((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const simularExportPdf = () => {
    setExportMsg('Generando PDF...');
    setTimeout(() => setExportMsg('PDF generado'), 1500);
    setTimeout(() => setExportMsg(''), 4000);
  };

  const handleNuevoBien = (form: NuevoBienCementerioForm) => {
    const nuevo: InventarioCementerio = {
      id: invList.length + 1,
      ...form,
      sede: SEDES_CEMENTERIO[0],
      almacen: form.area,
      departamento: 'Administración',
      numeroDocumento: '',
      estadoUso: 'En uso',
      categoriaGeneral: 'Mobiliario y equipos',
      subcategoria: form.area,
      categoriaEspecifica: form.descripcion,
      fechaIngreso: new Date().toISOString().split('T')[0],
      formaAdquisicion: 'Compra',
      valorAdquisicion: null,
      moneda: 'Bs',
      nombreProveedor: form.marca ? `${form.marca} C.A.` : '—',
      responsable: 'Coord. Administración',
    };
    setInvList([nuevo, ...invList]);
    setShowModal(false);
    setSuccessMsg('Bien registrado exitosamente');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const invColumns: Column<InventarioCementerio>[] = [
    {
      key: 'codigo',
      label: 'Código',
      render: (b) => <span className="font-mono font-bold text-navy-900">{b.codigo}</span>,
    },
    {
      key: 'descripcion',
      label: 'Descripción',
      render: (b) => <span className="max-w-[200px] truncate block">{b.descripcion}</span>,
    },
    { key: 'marca', label: 'Marca', render: (b) => <span>{b.marca || '—'}</span> },
    { key: 'modelo', label: 'Modelo', render: (b) => <span>{b.modelo || '—'}</span> },
    { key: 'color', label: 'Color', render: (b) => <span>{b.color || '—'}</span> },
    {
      key: 'serial',
      label: 'Serial',
      render: (b) => <span className="font-mono text-sm">{b.serial || '—'}</span>,
    },
    { key: 'sede', label: 'Sede' },
    { key: 'almacen', label: 'Almacén' },
    { key: 'estadoUso', label: 'Estado de uso', render: (b) => <StatusBadge status={b.estadoUso} size="sm" /> },
    {
      key: 'estadoBien',
      label: 'Condición Física',
      render: (b) => <StatusBadge status={b.estadoBien} showDot size="sm" />,
    },
  ];

  if (id) {
    const itemId = Number(id);
    const bien = invList.find((b) => b.id === itemId);
    if (!bien) {
      return (
        <div className="p-6 text-center">
          <p className="text-gray-500 mb-4">Bien no encontrado.</p>
          <button type="button" onClick={() => navigate('/cementerio')} className="text-navy-700 font-medium">
            Volver al listado
          </button>
        </div>
      );
    }

    return (
      <AssetDetailView
        title="Bienes e Inmuebles: Cementerio"
        breadcrumb={[
          { label: 'Dashboard', to: '/dashboard' },
          { label: 'Cementerio', to: '/cementerio' },
          { label: bien.codigo },
        ]}
        categoryFields={[
          { label: 'Categoría', value: bien.categoriaGeneral },
          { label: 'Sub Categoría', value: bien.subcategoria },
          { label: 'Categoría Específica', value: bien.categoriaEspecifica },
        ]}
        sections={[
          {
            title: 'Detalles',
            fields: [
              { label: 'Descripción', value: bien.descripcion },
              { label: 'Fecha de Ingreso', value: formatFecha(bien.fechaIngreso) },
              { label: 'Color', value: bien.color || '—' },
              { label: 'Marca', value: bien.marca },
              { label: 'Modelo', value: bien.modelo || '—' },
              { label: 'Valor de Adquisición', value: formatMoneda(bien.valorAdquisicion, bien.moneda) },
              { label: 'Código', value: bien.codigo },
              { label: 'Serial', value: bien.serial || '—' },
              { label: 'Responsable', value: bien.responsable },
              { label: 'Unidad Administrativa', value: bien.departamento },
              { label: 'Estado de uso', value: <StatusBadge status={bien.estadoUso} size="sm" /> },
              { label: 'Condición Física', value: <StatusBadge status={bien.estadoBien} showDot size="sm" /> },
              { label: 'Almacén', value: bien.almacen },
              { label: 'Departamento', value: bien.departamento },
              { label: 'Sede', value: bien.sede },
              { label: 'Área', value: bien.area },
              { label: 'Observaciones', value: bien.observaciones || '—' },
            ],
          },
          {
            title: 'Detalles del documento de Ingreso',
            fields: [
              { label: 'Nro de Documento', value: bien.numeroDocumento || '—' },
              { label: 'Fecha Adquisición', value: formatFecha(bien.fechaIngreso) },
              { label: 'Forma de Adquisición', value: bien.formaAdquisicion },
              { label: 'Nombre de Proveedor', value: bien.nombreProveedor },
              { label: 'Valor Total de Documento', value: formatMoneda(bien.valorAdquisicion, bien.moneda) },
            ],
          },
        ]}
        actions={
          <>
            <button
              type="button"
              onClick={() => navigate('/cementerio')}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeft size={16} />
              Volver al listado
            </button>
            <button
              type="button"
              className="px-5 py-2.5 border border-navy-200 text-navy-800 rounded-lg text-sm font-semibold hover:bg-navy-50"
            >
              Transferir a otro almacén
            </button>
            <button type="button" className="px-5 py-2.5 border border-red-200 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-50">
              Retirar de Inventario
            </button>
          </>
        }
      />
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px]">
      <ModulePageHeader
        title="Bienes e Inmuebles del Cementerio"
        breadcrumb={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Cementerio' }]}
        onCreate={() => setShowModal(true)}
        createLabel="Nuevo Bien"
        extraActions={
          <>
            {successMsg && (
              <span className="text-sm text-green-600 font-medium animate-pulse self-center">{successMsg}</span>
            )}
            <button
              type="button"
              onClick={() => setShowImport(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              <Upload size={16} /> Importar Excel
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <ModuleMetricCard
          label="Total Bienes"
          value={(bienesStats.total ?? 0).toLocaleString()}
          icon={<Package size={22} className="text-navy-600" />}
          iconWrapClassName="bg-navy-100"
        />
        <ModuleMetricCard
          label="Bienes en uso"
          value={(bienesStats.enUso ?? 0).toLocaleString()}
          icon={<BarChart3 size={22} className="text-green-600" />}
          iconWrapClassName="bg-green-100"
          valueClassName="text-green-700"
        />
        <ModuleMetricCard
          label="Bienes Regulares"
          value={(bienesStats.regulares ?? 0).toLocaleString()}
          icon={<AlertTriangle size={22} className="text-amber-500" />}
          iconWrapClassName="bg-amber-100"
          borderClassName="border-amber-200"
          valueClassName="text-amber-700"
        />
        <ModuleMetricCard
          label="Bienes dañados"
          value={(bienesStats.danados ?? 0).toLocaleString()}
          icon={<AlertCircle size={22} className="text-red-500" />}
          iconWrapClassName="bg-red-100"
          borderClassName="border-red-200"
          valueClassName="text-red-700"
        />
      </div>

      <ModuleFilterBar
        fields={[
          { key: 'codigo', label: 'Código', type: 'text', value: filtros.codigo, onChange: (v) => setFiltro('codigo', v) },
          { key: 'descripcion', label: 'Descripción', type: 'text', value: filtros.descripcion, onChange: (v) => setFiltro('descripcion', v) },
          {
            key: 'almacen',
            label: 'Almacén',
            type: 'select',
            value: filtros.almacen,
            onChange: (v) => setFiltro('almacen', v),
            options: almacenOptions,
          },
          {
            key: 'condicion',
            label: 'Condición Física',
            type: 'select',
            value: filtros.condicionFisica,
            onChange: (v) => setFiltro('condicionFisica', v),
            options: ['Todas', ...ESTADOS_BIEN_CEMENTERIO],
          },
          {
            key: 'departamento',
            label: 'Departamento',
            type: 'select',
            value: filtros.departamento,
            onChange: (v) => setFiltro('departamento', v),
            options: ['Todos', ...DEPARTAMENTOS_CEMENTERIO],
          },
          {
            key: 'documento',
            label: 'Número de documento',
            type: 'text',
            value: filtros.numeroDocumento,
            onChange: (v) => setFiltro('numeroDocumento', v),
          },
          {
            key: 'estado',
            label: 'Estado de uso',
            type: 'select',
            value: filtros.estadoUso,
            onChange: (v) => setFiltro('estadoUso', v),
            options: ['Todos', ...ESTADOS_USO_CEMENTERIO],
          },
          {
            key: 'buscar',
            label: 'Buscar',
            type: 'search',
            value: filtros.buscar,
            onChange: (v) => setFiltro('buscar', v),
            placeholder: 'Buscar por código, descripción, marca, serial...',
            className: 'sm:col-span-2 lg:col-span-1',
          },
        ]}
      >
        <div className="flex flex-wrap items-center justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
          {exportMsg && <span className="text-sm text-green-600 font-medium">{exportMsg}</span>}
          <button
            type="button"
            onClick={simularExportPdf}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            <FileText size={14} />
            PDF
          </button>
        </div>
      </ModuleFilterBar>

      <ModuleDataTable
        data={paginatedInventario}
        columns={invColumns}
        onDetails={(b) => navigate(`/cementerio/${b.id}`)}
        emptyMessage="No hay bienes en el inventario del cementerio."
      />
      <ModulePagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <NuevoBienCementerioModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleNuevoBien}
      />

      <ImportExcelModal
        open={showImport}
        onClose={() => setShowImport(false)}
        tiposDisponibles={['Inventario Cementerio']}
      />
    </div>
  );
}
