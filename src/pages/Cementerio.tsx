import { useState } from 'react';
import { Link } from 'react-router-dom';
import { inventarioCementerio, parcelasCementerio, cementerioStats } from '../data/cementerio';
import { AREAS_CEMENTERIO, ESTADOS_BIEN_CEMENTERIO, SECTORES_CEMENTERIO, TIPOS_PARCELA, ESTATUS_PARCELA } from '../types/cementerio';
import { inventarioCementerioSchema } from '../schemas/cementerio.schema';
import { validarConZod } from '../utils/validators';
import { formatFecha } from '../utils/formatters';
import DataTable, { type Column, type FilterOption } from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import ImportExcelModal from '../components/ImportExcelModal';
import type { InventarioCementerio, ParcelaCementerio } from '../types/cementerio';
import {
  Landmark, MapPin, Package, AlertTriangle, Wrench,
  Plus, Upload, X, Save, XCircle, ClipboardList,
} from 'lucide-react';

type TabKey = 'inventario' | 'parcelas';

export default function Cementerio() {
  const [tab, setTab] = useState<TabKey>('inventario');
  const [invList, setInvList] = useState(inventarioCementerio);
  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [detalleInv, setDetalleInv] = useState<InventarioCementerio | null>(null);
  const [detalleParcela, setDetalleParcela] = useState<ParcelaCementerio | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState('');

  // Form state for new inventory item
  const [form, setForm] = useState({
    codigo: '', descripcion: '', marca: '', modelo: '', color: '', serial: '',
    estadoBien: 'Bueno' as string, area: AREAS_CEMENTERIO[0] as string, observaciones: '',
  });

  const updateForm = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
  };

  const handleSubmit = () => {
    const result = validarConZod(inventarioCementerioSchema, form);
    if (!result.success) { setErrors(result.errors); return; }
    const nuevo: InventarioCementerio = { id: invList.length + 1, ...form, estadoBien: form.estadoBien as InventarioCementerio['estadoBien'], area: form.area as InventarioCementerio['area'] };
    setInvList([nuevo, ...invList]);
    setShowModal(false);
    setForm({ codigo: '', descripcion: '', marca: '', modelo: '', color: '', serial: '', estadoBien: 'Bueno', area: AREAS_CEMENTERIO[0] as string, observaciones: '' });
    setErrors({});
    setSuccessMsg('Bien registrado exitosamente');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // --- Columns: Inventario ---
  const invColumns: Column<InventarioCementerio>[] = [
    { key: 'codigo', label: 'Código', sortable: true, render: (b) => <span className="font-mono font-bold text-navy-900">{b.codigo}</span> },
    { key: 'descripcion', label: 'Descripción', sortable: true, render: (b) => <span className="text-sm text-gray-700 truncate max-w-[200px] block">{b.descripcion}</span> },
    { key: 'marca', label: 'Marca', sortable: true, render: (b) => (
      <div><p className="text-sm text-gray-700">{b.marca}</p>{b.modelo && <p className="text-xs text-gray-400">{b.modelo}</p>}</div>
    )},
    { key: 'area', label: 'Área', sortable: true, render: (b) => <span className="text-xs bg-navy-50 text-navy-800 px-2 py-0.5 rounded font-medium">{b.area}</span> },
    { key: 'estadoBien', label: 'Estado', render: (b) => <StatusBadge status={b.estadoBien} showDot size="sm" /> },
    { key: 'serial', label: 'Serial', render: (b) => <span className="text-xs font-mono text-gray-500">{b.serial}</span> },
  ];

  const invFilters: FilterOption[] = [
    { key: 'estadoBien', label: 'Estado del bien', options: ['Todos', ...ESTADOS_BIEN_CEMENTERIO] },
    { key: 'area', label: 'Área', options: ['Todas', ...AREAS_CEMENTERIO] },
  ];

  // --- Columns: Parcelas ---
  const parcColumns: Column<ParcelaCementerio>[] = [
    { key: 'identificacion', label: 'Parcela', sortable: true, render: (p) => <span className="font-mono font-bold text-navy-900">{p.identificacion}</span> },
    { key: 'sector', label: 'Sector', sortable: true },
    { key: 'tipo', label: 'Tipo', render: (p) => <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">{p.tipo}</span> },
    { key: 'ocupante', label: 'Ocupante', render: (p) => <span className="text-sm text-gray-700">{p.ocupante || '—'}</span> },
    { key: 'fechaAsignacion', label: 'Asignación', render: (p) => <span className="text-sm text-gray-500">{formatFecha(p.fechaAsignacion)}</span> },
    { key: 'estatus', label: 'Estatus', render: (p) => <StatusBadge status={p.estatus} showDot size="sm" /> },
  ];

  const parcFilters: FilterOption[] = [
    { key: 'estatus', label: 'Estatus', options: ['Todos', ...ESTATUS_PARCELA] },
    { key: 'sector', label: 'Sector', options: ['Todos', ...SECTORES_CEMENTERIO] },
    { key: 'tipo', label: 'Tipo', options: ['Todos', ...TIPOS_PARCELA] },
  ];

  const occupancyPct = Math.round((cementerioStats.parcelasOcupadas / cementerioStats.totalParcelas) * 100);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link to="/dashboard" className="hover:text-navy-600">Dashboard</Link>
            <span>/</span>
            <span className="font-medium text-navy-800">Cementerio</span>
          </div>
          <h1 className="text-2xl font-bold text-navy-900 font-display">
            {tab === 'inventario' ? 'Bienes e Inmuebles del Cementerio' : 'Gestión de Parcelas'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {tab === 'inventario'
              ? `Inventario físico — ${cementerioStats.totalInventario} bienes registrados`
              : `Control de parcelas — ${cementerioStats.totalParcelas} registros`}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {successMsg && <span className="text-sm text-green-600 font-medium animate-pulse self-center">{successMsg}</span>}
          <button onClick={() => setShowImport(true)} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
            <Upload size={16} /> Importar
          </button>
          {tab === 'inventario' && (
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-navy-900 text-white rounded-lg text-sm font-medium hover:bg-navy-800">
              <Plus size={18} /> Nuevo Bien
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={<Package size={18} className="text-navy-600" />} bg="bg-navy-100" label="Inventario" value={cementerioStats.totalInventario.toString()} />
        <StatCard icon={<Landmark size={18} className="text-blue-600" />} bg="bg-blue-100" label="Parcelas" value={cementerioStats.totalParcelas.toString()} />
        <StatCard icon={<MapPin size={18} className="text-green-600" />} bg="bg-green-100" label="Disponibles" value={cementerioStats.parcelasDisponibles.toString()} />
        <StatCard icon={<AlertTriangle size={18} className="text-amber-600" />} bg="bg-amber-100" label="Reservadas" value={cementerioStats.parcelasReservadas.toString()} />
        <StatCard icon={<Wrench size={18} className="text-red-600" />} bg="bg-red-100" label="Vencidas" value={cementerioStats.parcelasVencidas.toString()} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        <button onClick={() => setTab('inventario')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'inventario' ? 'bg-white text-navy-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          <ClipboardList size={16} /> Inventario Físico
        </button>
        <button onClick={() => setTab('parcelas')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'parcelas' ? 'bg-white text-navy-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          <Landmark size={16} /> Parcelas
        </button>
      </div>

      {/* Table: Inventario */}
      {tab === 'inventario' && (
        <DataTable
          data={invList}
          columns={invColumns}
          filters={invFilters}
          searchPlaceholder="Buscar por código, descripción, marca, serial..."
          searchKeys={['codigo', 'descripcion', 'marca', 'serial']}
          perPage={8}
          onRowClick={setDetalleInv}
        />
      )}

      {/* Table: Parcelas */}
      {tab === 'parcelas' && (
        <DataTable
          data={parcelasCementerio}
          columns={parcColumns}
          filters={parcFilters}
          searchPlaceholder="Buscar por parcela, ocupante, sector..."
          searchKeys={['identificacion', 'ocupante', 'sector']}
          perPage={8}
          onRowClick={setDetalleParcela}
        />
      )}

      {/* Capacity bar */}
      <div className="bg-navy-900 rounded-xl p-5 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-lg">Capacidad General</h3>
            <p className="text-sm text-white/70">Ocupación actual del cementerio municipal</p>
          </div>
          <p className="text-3xl font-bold">{occupancyPct}%</p>
        </div>
        <div className="mt-4 w-full bg-white/20 rounded-full h-3">
          <div className="bg-white h-3 rounded-full transition-all" style={{ width: `${occupancyPct}%` }} />
        </div>
      </div>

      {/* Detail: Inventario */}
      {detalleInv && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-end" onClick={() => setDetalleInv(null)}>
          <div className="bg-white w-full max-w-lg h-full overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-navy-900">Detalle del Bien</h3>
              <button onClick={() => setDetalleInv(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <StatusBadge status={detalleInv.estadoBien} showDot size="md" />
              <div className="grid grid-cols-2 gap-4">
                {[['Código', detalleInv.codigo], ['Descripción', detalleInv.descripcion], ['Marca', detalleInv.marca], ['Modelo', detalleInv.modelo || '—'], ['Color', detalleInv.color || '—'], ['Serial', detalleInv.serial], ['Área', detalleInv.area]].map(([l, v]) => (
                  <div key={l}><p className="text-xs text-gray-500">{l}</p><p className="text-sm font-medium text-navy-900">{v}</p></div>
                ))}
              </div>
              {detalleInv.observaciones && <div><p className="text-xs text-gray-500 mb-1">Observaciones</p><p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{detalleInv.observaciones}</p></div>}
            </div>
          </div>
        </div>
      )}

      {/* Detail: Parcela */}
      {detalleParcela && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-end" onClick={() => setDetalleParcela(null)}>
          <div className="bg-white w-full max-w-lg h-full overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-navy-900">Detalle de Parcela</h3>
              <button onClick={() => setDetalleParcela(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <StatusBadge status={detalleParcela.estatus} showDot size="md" />
              <div className="grid grid-cols-2 gap-4">
                {[['Parcela', detalleParcela.identificacion], ['Sector', detalleParcela.sector], ['Tipo', detalleParcela.tipo], ['Ocupante', detalleParcela.ocupante || '—'], ['Asignación', formatFecha(detalleParcela.fechaAsignacion)], ['Vencimiento', formatFecha(detalleParcela.fechaVencimiento)], ['Contacto', detalleParcela.contacto || '—']].map(([l, v]) => (
                  <div key={l}><p className="text-xs text-gray-500">{l}</p><p className="text-sm font-medium text-navy-900">{v}</p></div>
                ))}
              </div>
              {detalleParcela.observaciones && <div><p className="text-xs text-gray-500 mb-1">Observaciones</p><p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{detalleParcela.observaciones}</p></div>}
            </div>
          </div>
        </div>
      )}

      {/* New Inventory Item Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-navy-900">Nuevo Bien — Cementerio</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
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
              <button onClick={handleSubmit} className="w-full bg-navy-900 text-white py-3 rounded-lg font-medium hover:bg-navy-800 transition-colors flex items-center justify-center gap-2">
                <Save size={18} /> Registrar Bien
              </button>
            </div>
          </div>
        </div>
      )}

      <ImportExcelModal open={showImport} onClose={() => setShowImport(false)} tiposDisponibles={['Inventario Cementerio', 'Parcelas']} />
    </div>
  );
}

function StatCard({ icon, bg, label, value }: { icon: React.ReactNode; bg: string; label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs sm:text-sm text-gray-500">{label}</p>
        <div className={`w-8 h-8 sm:w-9 sm:h-9 ${bg} rounded-lg flex items-center justify-center`}>{icon}</div>
      </div>
      <p className="text-xl sm:text-2xl font-bold text-navy-900">{value}</p>
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
