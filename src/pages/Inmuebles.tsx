import { useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchParcelas } from '../api/services/parcelas.service';
import { useApiQuery } from '../hooks/useApiQuery';
import ApiState from '../components/ApiState';
import { inmuebleStats as inmuebleStatsMock } from '../data/inmuebles';
import { ESTADOS_OCUPACION, ZONIFICACIONES, TIPOS_INMUEBLE } from '../types/inmueble';
import { inmuebleSchema } from '../schemas/inmueble.schema';
import { validarConZod } from '../utils/validators';
import { formatArea, formatMoneda } from '../utils/formatters';
import DataTable, { type Column, type FilterOption } from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import ImportExcelModal from '../components/ImportExcelModal';
import type { Inmueble } from '../types/inmueble';
import {
  Building2, MapPin, AlertTriangle, Gavel,
  Plus, Upload, X, Save, XCircle,
} from 'lucide-react';

export default function Inmuebles() {
  const parcelasQuery = useApiQuery(() => fetchParcelas({ limit: 500 }), []);
  const listaFromApi = parcelasQuery.data?.inmuebles ?? [];
  const [localExtras, setLocalExtras] = useState<Inmueble[]>([]);
  const lista = [...localExtras, ...listaFromApi];
  const inmuebleStats = {
    ...inmuebleStatsMock,
    totalRegistros: parcelasQuery.data?.meta.total ?? lista.length,
    disponibles: listaFromApi.length
      ? listaFromApi.filter((i) => i.estadoOcupacion === 'Disponible').length
      : inmuebleStatsMock.disponibles,
    comprometidos: listaFromApi.filter((i) => i.estadoOcupacion === 'Comprometido').length,
    desincorporados: listaFromApi.filter((i) => i.estadoOcupacion === 'Desincorporado').length,
    ocupados: listaFromApi.filter((i) => i.estadoOcupacion === 'Ocupado').length,
  };
  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [detalle, setDetalle] = useState<Inmueble | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState('');

  // Form state
  const [form, setForm] = useState({
    ubicacion: '', identificacionParcela: '', zonificacion: 'Residencial' as string,
    estadoOcupacion: 'Disponible' as string, usoActual: 'Vivienda' as string,
    tipoInmueble: 'Apartamento' as string, areaSegunDocumento: '', precio: '',
    proyecto: '', linderos: '', coordenadas: '', datosRegistrales: '', observaciones: '',
  });

  const updateForm = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
  };

  const handleSubmit = () => {
    const parsed = {
      ...form,
      areaSegunDocumento: form.areaSegunDocumento ? parseFloat(form.areaSegunDocumento) : null,
      areaDesincorporada: null, areaComprometida: null, areaDisponible: form.areaSegunDocumento ? parseFloat(form.areaSegunDocumento) : null,
      precio: form.precio ? parseFloat(form.precio) : null,
    };
    const result = validarConZod(inmuebleSchema, parsed);
    if (!result.success) { setErrors(result.errors); return; }
    const nuevo: Inmueble = {
      id: lista.length + 1, ...parsed,
      zonificacion: parsed.zonificacion as Inmueble['zonificacion'],
      estadoOcupacion: parsed.estadoOcupacion as Inmueble['estadoOcupacion'],
      usoActual: parsed.usoActual as Inmueble['usoActual'],
    };
    setLocalExtras([nuevo, ...localExtras]);
    setShowModal(false);
    resetForm();
    setSuccessMsg('Inmueble registrado exitosamente');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const resetForm = () => {
    setForm({ ubicacion: '', identificacionParcela: '', zonificacion: 'Residencial', estadoOcupacion: 'Disponible', usoActual: 'Vivienda', tipoInmueble: 'Apartamento', areaSegunDocumento: '', precio: '', proyecto: '', linderos: '', coordenadas: '', datosRegistrales: '', observaciones: '' });
    setErrors({});
  };

  const columns: Column<Inmueble>[] = [
    { key: 'identificacionParcela', label: 'Parcela', sortable: true, render: (i) => <span className="font-mono font-bold text-navy-900">{i.identificacionParcela}</span> },
    { key: 'ubicacion', label: 'Ubicación', sortable: true, render: (i) => (
      <div><p className="text-sm font-medium text-navy-900 truncate max-w-[220px]">{i.ubicacion}</p><p className="text-xs text-gray-500">{i.tipoInmueble} · {i.zonificacion}</p></div>
    )},
    { key: 'areaSegunDocumento', label: 'Área', align: 'right', sortable: true, render: (i) => <span className="text-sm">{formatArea(i.areaSegunDocumento)}</span> },
    { key: 'areaDisponible', label: 'Disponible', align: 'right', render: (i) => <span className="text-sm text-green-700 font-medium">{formatArea(i.areaDisponible)}</span> },
    { key: 'precio', label: 'Precio', align: 'right', sortable: true, render: (i) => <span className="text-sm font-medium">{formatMoneda(i.precio, 'USD')}</span> },
    { key: 'estadoOcupacion', label: 'Estado', render: (i) => <StatusBadge status={i.estadoOcupacion} showDot size="sm" /> },
  ];

  const filters: FilterOption[] = [
    { key: 'estadoOcupacion', label: 'Estado', options: ['Todos', ...ESTADOS_OCUPACION] },
    { key: 'zonificacion', label: 'Zonificación', options: ['Todas', ...ZONIFICACIONES] },
    { key: 'tipoInmueble', label: 'Tipo', options: ['Todos', ...TIPOS_INMUEBLE] },
  ];

  const dispPct = Math.round((inmuebleStats.disponibles / inmuebleStats.totalRegistros) * 100);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link to="/dashboard" className="hover:text-navy-600">Dashboard</Link>
            <span>/</span>
            <span className="font-medium text-navy-800">Inmuebles</span>
          </div>
          <h1 className="text-2xl font-bold text-navy-900">Registro de Inmuebles</h1>
          <p className="text-sm text-gray-500 mt-1">Control patrimonial de parcelas y activos inmobiliarios ({inmuebleStats.totalRegistros} registros).</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {successMsg && <span className="text-sm text-green-600 font-medium animate-pulse self-center">{successMsg}</span>}
          <button onClick={() => setShowImport(true)} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
            <Upload size={16} /> Importar
          </button>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-navy-900 text-white rounded-lg text-sm font-medium hover:bg-navy-800">
            <Plus size={18} /> Nuevo Inmueble
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-navy-100 rounded-xl flex items-center justify-center"><Building2 size={22} className="text-navy-600" /></div>
          <div><p className="text-sm text-gray-500">Total</p><p className="text-2xl font-bold text-navy-900">{inmuebleStats.totalRegistros}</p></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center"><MapPin size={22} className="text-green-600" /></div>
          <div><p className="text-sm text-gray-500">Disponibles</p><p className="text-2xl font-bold text-green-700">{inmuebleStats.disponibles}</p></div>
        </div>
        <div className="bg-white rounded-xl border border-amber-200 p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-amber-100 rounded-xl flex items-center justify-center"><AlertTriangle size={22} className="text-amber-500" /></div>
          <div><p className="text-sm text-gray-500">Comprometidos</p><p className="text-2xl font-bold text-amber-700">{inmuebleStats.comprometidos}</p></div>
        </div>
        <div className="bg-white rounded-xl border border-purple-200 p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-purple-100 rounded-xl flex items-center justify-center"><Gavel size={22} className="text-purple-600" /></div>
          <div><p className="text-sm text-gray-500">En Litigio</p><p className="text-2xl font-bold text-purple-700">{inmuebleStats.enLitigio}</p></div>
        </div>
      </div>

      <ApiState
        loading={parcelasQuery.loading}
        error={parcelasQuery.error}
        onRetry={parcelasQuery.refetch}
        empty={!parcelasQuery.loading && lista.length === 0}
        emptyMessage="No hay parcelas/inmuebles en el sistema."
      >
        <DataTable
          data={lista}
          columns={columns}
          filters={filters}
          searchPlaceholder="Buscar por parcela, ubicación, proyecto..."
          searchKeys={['identificacionParcela', 'ubicacion', 'proyecto', 'tipoInmueble']}
          perPage={8}
          onRowClick={setDetalle}
        />
      </ApiState>

      {/* Summary bar */}
      <div className="bg-navy-900 rounded-xl p-5 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-lg">Disponibilidad Inmobiliaria</h3>
            <p className="text-sm text-white/70">{formatArea(inmuebleStats.areaDisponible)} disponibles de {formatArea(inmuebleStats.areaTotal)} totales</p>
          </div>
          <p className="text-3xl font-bold">{dispPct}%</p>
        </div>
        <div className="mt-4 w-full bg-white/20 rounded-full h-3">
          <div className="bg-white h-3 rounded-full transition-all" style={{ width: `${dispPct}%` }} />
        </div>
      </div>

      {/* Detail Panel */}
      {detalle && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-end" onClick={() => setDetalle(null)}>
          <div className="bg-white w-full max-w-lg h-full overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-navy-900">Detalle del Inmueble</h3>
              <button onClick={() => setDetalle(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-5">
              <StatusBadge status={detalle.estadoOcupacion} showDot size="md" />
              <div className="grid grid-cols-2 gap-4">
                {[
                  ['Parcela', detalle.identificacionParcela], ['Tipo', detalle.tipoInmueble],
                  ['Ubicación', detalle.ubicacion], ['Zonificación', detalle.zonificacion],
                  ['Uso actual', detalle.usoActual], ['Proyecto', detalle.proyecto || '—'],
                  ['Área s/documento', formatArea(detalle.areaSegunDocumento)],
                  ['Área disponible', formatArea(detalle.areaDisponible)],
                  ['Área comprometida', formatArea(detalle.areaComprometida)],
                  ['Área desincorporada', formatArea(detalle.areaDesincorporada)],
                  ['Precio', formatMoneda(detalle.precio, 'USD')],
                  ['Coordenadas', detalle.coordenadas || '—'],
                ].map(([l, v]) => (
                  <div key={l}><p className="text-xs text-gray-500">{l}</p><p className="text-sm font-medium text-navy-900">{v}</p></div>
                ))}
              </div>
              {detalle.linderos && <div><p className="text-xs text-gray-500 mb-1">Linderos</p><p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{detalle.linderos}</p></div>}
              {detalle.datosRegistrales && <div><p className="text-xs text-gray-500 mb-1">Datos registrales</p><p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{detalle.datosRegistrales}</p></div>}
              {detalle.observaciones && <div><p className="text-xs text-gray-500 mb-1">Observaciones</p><p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{detalle.observaciones}</p></div>}
            </div>
          </div>
        </div>
      )}

      {/* New Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-navy-900">Nuevo Inmueble</h3>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <Field label="Ubicación *" error={errors.ubicacion}>
                <input value={form.ubicacion} onChange={(e) => updateForm('ubicacion', e.target.value)} className="input-field" placeholder="Urbanización Villa Rosa, Parcela 150" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Identificación de parcela *" error={errors.identificacionParcela}>
                  <input value={form.identificacionParcela} onChange={(e) => updateForm('identificacionParcela', e.target.value)} className="input-field" placeholder="VR-P-150" />
                </Field>
                <Field label="Tipo de inmueble *" error={errors.tipoInmueble}>
                  <select value={form.tipoInmueble} onChange={(e) => updateForm('tipoInmueble', e.target.value)} className="input-field">
                    {TIPOS_INMUEBLE.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Zonificación *" error={errors.zonificacion}>
                  <select value={form.zonificacion} onChange={(e) => updateForm('zonificacion', e.target.value)} className="input-field">
                    {ZONIFICACIONES.map((z) => <option key={z}>{z}</option>)}
                  </select>
                </Field>
                <Field label="Estado *" error={errors.estadoOcupacion}>
                  <select value={form.estadoOcupacion} onChange={(e) => updateForm('estadoOcupacion', e.target.value)} className="input-field">
                    {ESTADOS_OCUPACION.map((e) => <option key={e}>{e}</option>)}
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Área (m²)" error={errors.areaSegunDocumento}>
                  <input type="number" value={form.areaSegunDocumento} onChange={(e) => updateForm('areaSegunDocumento', e.target.value)} className="input-field" placeholder="0.00" />
                </Field>
                <Field label="Precio (USD)" error={errors.precio}>
                  <input type="number" value={form.precio} onChange={(e) => updateForm('precio', e.target.value)} className="input-field" placeholder="0.00" />
                </Field>
              </div>
              <Field label="Proyecto" error={errors.proyecto}>
                <input value={form.proyecto} onChange={(e) => updateForm('proyecto', e.target.value)} className="input-field" placeholder="Urbanización Villa Rosa" />
              </Field>
              <Field label="Observaciones" error={errors.observaciones}>
                <textarea value={form.observaciones} onChange={(e) => updateForm('observaciones', e.target.value)} className="input-field" rows={2} />
              </Field>
              <button onClick={handleSubmit} className="w-full bg-navy-900 text-white py-3 rounded-lg font-medium hover:bg-navy-800 transition-colors flex items-center justify-center gap-2">
                <Save size={18} /> Registrar Inmueble
              </button>
            </div>
          </div>
        </div>
      )}

      <ImportExcelModal open={showImport} onClose={() => setShowImport(false)} tiposDisponibles={['Parcelas / Inmuebles']} />
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
