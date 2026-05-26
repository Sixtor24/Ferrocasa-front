import { useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { inventarioCementerio, parcelasCementerio } from '../data/cementerio';
import { AREAS_CEMENTERIO, ESTADOS_BIEN_CEMENTERIO, SECTORES_CEMENTERIO, TIPOS_PARCELA, ESTATUS_PARCELA } from '../types/cementerio';
import { inventarioCementerioSchema } from '../schemas/cementerio.schema';
import { validarConZod } from '../utils/validators';
import { formatFecha } from '../utils/formatters';
import DataTable, { type Column, type FilterOption } from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import ImportExcelModal from '../components/ImportExcelModal';
import ModulePageHeader from '../components/module/ModulePageHeader';
import ModuleMetricCard from '../components/module/ModuleMetricCard';
import AssetDetailView from '../components/module/AssetDetailView';
import type { InventarioCementerio, ParcelaCementerio } from '../types/cementerio';
import {
  Landmark, MapPin, Package, AlertTriangle, AlertCircle,
  Upload, X, Save, XCircle, ClipboardList, BarChart3, ArrowLeft,
} from 'lucide-react';

type TabKey = 'inventario' | 'parcelas';

export default function Cementerio() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isParcelaRoute = location.pathname.includes('/parcela/');
  const [tab, setTab] = useState<TabKey>('inventario');
  const [invList, setInvList] = useState(inventarioCementerio);
  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState('');

  const [form, setForm] = useState({
    codigo: '', descripcion: '', marca: '', modelo: '', color: '', serial: '',
    estadoBien: 'Bueno' as string, area: AREAS_CEMENTERIO[0] as string, observaciones: '',
  });

  const bienesStats = useMemo(() => ({
    total: invList.length,
    enUso: invList.filter((b) => b.estadoBien === 'Bueno').length,
    regulares: invList.filter((b) => b.estadoBien === 'Regular').length,
    danados: invList.filter((b) =>
      ['Dañado', 'Averiado', 'Inservible'].includes(b.estadoBien)
    ).length,
  }), [invList]);

  const parcelasStats = useMemo(() => ({
    total: parcelasCementerio.length,
    disponibles: parcelasCementerio.filter((p) => p.estatus === 'Disponible').length,
    reservadas: parcelasCementerio.filter((p) => p.estatus === 'Reservada').length,
    ocupadas: parcelasCementerio.filter((p) => p.estatus === 'Ocupada').length,
    vencidas: parcelasCementerio.filter((p) => p.estatus === 'Vencida').length,
  }), []);

  const updateForm = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
  };

  const handleSubmit = () => {
    const result = validarConZod(inventarioCementerioSchema, form);
    if (!result.success) { setErrors(result.errors); return; }
    const nuevo: InventarioCementerio = {
      id: invList.length + 1,
      ...form,
      estadoBien: form.estadoBien as InventarioCementerio['estadoBien'],
      area: form.area as InventarioCementerio['area'],
    };
    setInvList([nuevo, ...invList]);
    setShowModal(false);
    setForm({
      codigo: '', descripcion: '', marca: '', modelo: '', color: '', serial: '',
      estadoBien: 'Bueno', area: AREAS_CEMENTERIO[0] as string, observaciones: '',
    });
    setErrors({});
    setSuccessMsg('Bien registrado exitosamente');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const invColumns: Column<InventarioCementerio>[] = [
    { key: 'codigo', label: 'Código', sortable: true, render: (b) => (
      <span className="font-mono font-bold text-navy-900">{b.codigo}</span>
    )},
    { key: 'descripcion', label: 'Descripción', sortable: true, render: (b) => (
      <span className="text-sm text-gray-700 truncate max-w-[200px] block">{b.descripcion}</span>
    )},
    { key: 'marca', label: 'Marca', sortable: true, render: (b) => (
      <span className="text-sm text-gray-700">{b.marca || '—'}</span>
    )},
    { key: 'modelo', label: 'Modelo', sortable: true, render: (b) => (
      <span className="text-sm text-gray-600">{b.modelo || '—'}</span>
    )},
    { key: 'area', label: 'Área', sortable: true, render: (b) => (
      <span className="text-xs bg-navy-50 text-navy-800 px-2 py-0.5 rounded font-medium">{b.area}</span>
    )},
    { key: 'estadoBien', label: 'Estado', render: (b) => <StatusBadge status={b.estadoBien} showDot size="sm" /> },
    { key: 'serial', label: 'Serial', render: (b) => (
      <span className="text-xs font-mono text-gray-500">{b.serial}</span>
    )},
  ];

  const invFilters: FilterOption[] = [
    { key: 'estadoBien', label: 'Estado del bien', options: ['Todos', ...ESTADOS_BIEN_CEMENTERIO] },
    { key: 'area', label: 'Área', options: ['Todas', ...AREAS_CEMENTERIO] },
  ];

  const parcColumns: Column<ParcelaCementerio>[] = [
    { key: 'identificacion', label: 'Parcela', sortable: true, render: (p) => (
      <span className="font-mono font-bold text-navy-900">{p.identificacion}</span>
    )},
    { key: 'sector', label: 'Sector', sortable: true },
    { key: 'tipo', label: 'Tipo', render: (p) => (
      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">{p.tipo}</span>
    )},
    { key: 'ocupante', label: 'Ocupante', render: (p) => (
      <span className="text-sm text-gray-700">{p.ocupante || '—'}</span>
    )},
    { key: 'fechaAsignacion', label: 'Asignación', render: (p) => (
      <span className="text-sm text-gray-500">{formatFecha(p.fechaAsignacion)}</span>
    )},
    { key: 'estatus', label: 'Estatus', render: (p) => <StatusBadge status={p.estatus} showDot size="sm" /> },
  ];

  const parcFilters: FilterOption[] = [
    { key: 'estatus', label: 'Estatus', options: ['Todos', ...ESTATUS_PARCELA] },
    { key: 'sector', label: 'Sector', options: ['Todos', ...SECTORES_CEMENTERIO] },
    { key: 'tipo', label: 'Tipo', options: ['Todos', ...TIPOS_PARCELA] },
  ];

  const pageTitle = tab === 'inventario'
    ? 'Bienes e Inmuebles del Cementerio'
    : 'Gestión de Parcelas — Cementerio';

  if (id) {
    const itemId = Number(id);

    if (isParcelaRoute) {
      const parcela = parcelasCementerio.find((p) => p.id === itemId);
      if (!parcela) {
        return (
          <div className="p-6 text-center">
            <p className="text-gray-500 mb-4">Parcela no encontrada.</p>
            <button type="button" onClick={() => navigate('/cementerio')} className="text-navy-700 font-medium">
              Volver al listado
            </button>
          </div>
        );
      }
      return (
        <AssetDetailView
          title="Gestión de Parcelas — Cementerio"
          breadcrumb={[
            { label: 'Dashboard', to: '/dashboard' },
            { label: 'Cementerio', to: '/cementerio' },
            { label: parcela.identificacion },
          ]}
          sections={[
            {
              title: 'Detalles',
              fields: [
                { label: 'Parcela', value: parcela.identificacion },
                { label: 'Sector', value: parcela.sector },
                { label: 'Tipo', value: parcela.tipo },
                { label: 'Ocupante', value: parcela.ocupante || '—' },
                { label: 'Fecha de asignación', value: formatFecha(parcela.fechaAsignacion) },
                { label: 'Fecha de vencimiento', value: formatFecha(parcela.fechaVencimiento) },
                { label: 'Contacto', value: parcela.contacto || '—' },
                { label: 'Estatus', value: <StatusBadge status={parcela.estatus} showDot size="sm" /> },
                { label: 'Observaciones', value: parcela.observaciones || '—' },
              ],
            },
          ]}
          actions={
            <button
              type="button"
              onClick={() => navigate('/cementerio')}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeft size={16} />
              Volver al listado
            </button>
          }
        />
      );
    }

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
        title="Bienes e Inmuebles del Cementerio"
        breadcrumb={[
          { label: 'Dashboard', to: '/dashboard' },
          { label: 'Cementerio', to: '/cementerio' },
          { label: bien.codigo },
        ]}
        sections={[
          {
            title: 'Detalles',
            fields: [
              { label: 'Descripción', value: bien.descripcion },
              { label: 'Color', value: bien.color || '—' },
              { label: 'Marca', value: bien.marca },
              { label: 'Modelo', value: bien.modelo || '—' },
              { label: 'Estado', value: <StatusBadge status={bien.estadoBien} showDot size="sm" /> },
              { label: 'Código', value: bien.codigo },
              { label: 'Serial', value: bien.serial },
              { label: 'Área', value: bien.area },
              { label: 'Estado del bien', value: <StatusBadge status={bien.estadoBien} showDot size="sm" /> },
              { label: 'Condición Física', value: <StatusBadge status={bien.estadoBien} showDot size="sm" /> },
              { label: 'Observaciones', value: bien.observaciones || '—' },
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
            <button type="button" className="px-5 py-2.5 border border-red-200 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-50">
              Retirar de Inventario
            </button>
          </>
        }
      />
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <ModulePageHeader
        title={pageTitle}
        breadcrumb={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Cementerio' }]}
        onCreate={tab === 'inventario' ? () => setShowModal(true) : undefined}
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

      {tab === 'inventario' ? (
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
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <ModuleMetricCard
            label="Total Parcelas"
            value={(parcelasStats.total ?? 0).toLocaleString()}
            icon={<Landmark size={22} className="text-navy-600" />}
            iconWrapClassName="bg-navy-100"
          />
          <ModuleMetricCard
            label="Disponibles"
            value={(parcelasStats.disponibles ?? 0).toLocaleString()}
            icon={<MapPin size={22} className="text-green-600" />}
            iconWrapClassName="bg-green-100"
            valueClassName="text-green-700"
          />
          <ModuleMetricCard
            label="Reservadas"
            value={(parcelasStats.reservadas ?? 0).toLocaleString()}
            icon={<AlertTriangle size={22} className="text-amber-500" />}
            iconWrapClassName="bg-amber-100"
            borderClassName="border-amber-200"
            valueClassName="text-amber-700"
          />
          <ModuleMetricCard
            label="Ocupadas"
            value={(parcelasStats.ocupadas ?? 0).toLocaleString()}
            icon={<Package size={22} className="text-blue-600" />}
            iconWrapClassName="bg-blue-100"
            valueClassName="text-blue-700"
          />
          <ModuleMetricCard
            label="Vencidas"
            value={(parcelasStats.vencidas ?? 0).toLocaleString()}
            icon={<AlertCircle size={22} className="text-red-500" />}
            iconWrapClassName="bg-red-100"
            borderClassName="border-red-200"
            valueClassName="text-red-700"
          />
        </div>
      )}

      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          type="button"
          onClick={() => setTab('inventario')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === 'inventario' ? 'bg-white text-navy-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <ClipboardList size={16} /> Inventario Físico
        </button>
        <button
          type="button"
          onClick={() => setTab('parcelas')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === 'parcelas' ? 'bg-white text-navy-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Landmark size={16} /> Parcelas
        </button>
      </div>

      {tab === 'inventario' && (
        <DataTable
          data={invList}
          columns={invColumns}
          filters={invFilters}
          searchPlaceholder="Buscar por código, descripción, marca, serial..."
          searchKeys={['codigo', 'descripcion', 'marca', 'modelo', 'serial']}
          perPage={10}
          exportFormats={['PDF']}
          onDetails={(b) => navigate(`/cementerio/${b.id}`)}
        />
      )}

      {tab === 'parcelas' && (
        <DataTable
          data={parcelasCementerio}
          columns={parcColumns}
          filters={parcFilters}
          searchPlaceholder="Buscar por parcela, ocupante, sector..."
          searchKeys={['identificacion', 'ocupante', 'sector']}
          perPage={10}
          exportFormats={['PDF']}
          onDetails={(p) => navigate(`/cementerio/parcela/${p.id}`)}
        />
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-navy-900">Nuevo Bien — Cementerio</h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <Field label="Código *" error={errors.codigo}>
                <input value={form.codigo} onChange={(e) => updateForm('codigo', e.target.value)} className="input-field" placeholder="CEM-016" />
              </Field>
              <Field label="Descripción *" error={errors.descripcion}>
                <input value={form.descripcion} onChange={(e) => updateForm('descripcion', e.target.value)} className="input-field" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Marca *" error={errors.marca}>
                  <input value={form.marca} onChange={(e) => updateForm('marca', e.target.value)} className="input-field" />
                </Field>
                <Field label="Modelo" error={errors.modelo}>
                  <input value={form.modelo} onChange={(e) => updateForm('modelo', e.target.value)} className="input-field" />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Color" error={errors.color}>
                  <input value={form.color} onChange={(e) => updateForm('color', e.target.value)} className="input-field" />
                </Field>
                <Field label="Serial" error={errors.serial}>
                  <input value={form.serial} onChange={(e) => updateForm('serial', e.target.value)} className="input-field" />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Estado del bien *" error={errors.estadoBien}>
                  <select value={form.estadoBien} onChange={(e) => updateForm('estadoBien', e.target.value)} className="input-field">
                    {ESTADOS_BIEN_CEMENTERIO.map((e) => <option key={e}>{e}</option>)}
                  </select>
                </Field>
                <Field label="Área *" error={errors.area}>
                  <select value={form.area} onChange={(e) => updateForm('area', e.target.value)} className="input-field">
                    {AREAS_CEMENTERIO.map((a) => <option key={a}>{a}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Observaciones" error={errors.observaciones}>
                <textarea value={form.observaciones} onChange={(e) => updateForm('observaciones', e.target.value)} className="input-field" rows={2} />
              </Field>
              <button type="button" onClick={handleSubmit} className="w-full bg-navy-900 text-white py-3 rounded-lg font-medium hover:bg-navy-800 transition-colors flex items-center justify-center gap-2">
                <Save size={18} /> Registrar Bien
              </button>
            </div>
          </div>
        </div>
      )}

      <ImportExcelModal
        open={showImport}
        onClose={() => setShowImport(false)}
        tiposDisponibles={['Inventario Cementerio', 'Parcelas']}
      />
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm text-gray-600 mb-1 block">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><XCircle size={12} />{error}</p>}
    </div>
  );
}
