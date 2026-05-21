import { useState } from 'react';
import { Link } from 'react-router-dom';
import { vehiculos, vehiculosStats } from '../data/vehiculos';
import { CONDICIONES_VEHICULO, ESTADOS_USO_VEHICULO, CATEGORIAS_VEHICULO } from '../types/vehiculo';
import { vehiculoSchema } from '../schemas/vehiculo.schema';
import { validarConZod } from '../utils/validators';
import DataTable, { type Column, type FilterOption } from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import ImportExcelModal from '../components/ImportExcelModal';
import {
  ChevronRight, Truck, AlertTriangle, Wrench, XCircle,
  Plus, Upload, X, Save,
} from 'lucide-react';
import type { Vehiculo } from '../types/vehiculo';

export default function Vehiculos() {
  const [lista, setLista] = useState(vehiculos);
  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [detalle, setDetalle] = useState<Vehiculo | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState('');

  // Form state
  const [form, setForm] = useState({
    codigoInterno: '', marca: '', modelo: '', color: '', anioFabricacion: '',
    serialMotor: '', sinSerialMotor: false, serialCarroceria: '', sinSerialCarroceria: false,
    placa: '', sinPlaca: false, condicionFisica: 'Bueno' as string, estadoUso: 'Disponible' as string,
    categoriaGeneral: 'Sedan' as string, subcategoria: '', documentoAdquisicion: '',
    valorAdquisicion: '', observaciones: '',
  });

  const updateForm = (key: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
  };

  const handleSubmit = () => {
    const parsed = {
      ...form,
      anioFabricacion: form.anioFabricacion ? parseInt(form.anioFabricacion) : null,
      valorAdquisicion: form.valorAdquisicion ? parseFloat(form.valorAdquisicion) : null,
    };
    const result = validarConZod(vehiculoSchema, parsed);
    if (!result.success) {
      setErrors(result.errors);
      return;
    }
    const nuevo: Vehiculo = {
      id: lista.length + 1,
      ...parsed,
      anioFabricacion: parsed.anioFabricacion,
      valorAdquisicion: parsed.valorAdquisicion,
      condicionFisica: parsed.condicionFisica as Vehiculo['condicionFisica'],
      estadoUso: parsed.estadoUso as Vehiculo['estadoUso'],
      estatusCarga: 'Completo',
    };
    setLista([nuevo, ...lista]);
    setShowModal(false);
    setForm({ codigoInterno: '', marca: '', modelo: '', color: '', anioFabricacion: '', serialMotor: '', sinSerialMotor: false, serialCarroceria: '', sinSerialCarroceria: false, placa: '', sinPlaca: false, condicionFisica: 'Bueno', estadoUso: 'Disponible', categoriaGeneral: 'Sedan', subcategoria: '', documentoAdquisicion: '', valorAdquisicion: '', observaciones: '' });
    setErrors({});
    setSuccessMsg('Vehículo registrado exitosamente');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const columns: Column<Vehiculo>[] = [
    { key: 'codigoInterno', label: 'Código', sortable: true, render: (v) => <span className="font-mono font-bold text-navy-900">{v.codigoInterno}</span> },
    { key: 'marca', label: 'Marca / Modelo', sortable: true, render: (v) => (
      <div>
        <p className="font-semibold text-navy-900">{v.marca}</p>
        <p className="text-xs text-gray-500">{v.modelo}</p>
      </div>
    )},
    { key: 'placa', label: 'Placa', render: (v) => v.sinPlaca ? <span className="text-amber-600 text-xs font-bold">Sin placa</span> : <span className="font-mono">{v.placa}</span> },
    { key: 'anioFabricacion', label: 'Año', sortable: true, align: 'center' },
    { key: 'categoriaGeneral', label: 'Categoría', render: (v) => <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{v.categoriaGeneral}</span> },
    { key: 'condicionFisica', label: 'Condición', render: (v) => <StatusBadge status={v.condicionFisica} showDot size="sm" /> },
    { key: 'estadoUso', label: 'Estado', render: (v) => <StatusBadge status={v.estadoUso} size="sm" /> },
    { key: 'estatusCarga', label: 'Carga', render: (v) => <StatusBadge status={v.estatusCarga} showDot size="sm" /> },
  ];

  const filters: FilterOption[] = [
    { key: 'condicionFisica', label: 'Condición', options: ['Todas', ...CONDICIONES_VEHICULO] },
    { key: 'estadoUso', label: 'Estado de uso', options: ['Todos', ...ESTADOS_USO_VEHICULO] },
    { key: 'categoriaGeneral', label: 'Categoría', options: ['Todas', ...CATEGORIAS_VEHICULO] },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link to="/dashboard" className="hover:text-navy-600">Dashboard</Link>
            <ChevronRight size={14} />
            <span className="font-medium text-navy-800">Vehículos</span>
          </div>
          <h1 className="text-2xl font-bold text-navy-900">Gestión de Vehículos</h1>
          <p className="text-sm text-gray-500 mt-1">Control de flota vehicular y maquinaria pesada.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {successMsg && <span className="text-sm text-green-600 font-medium animate-pulse self-center">{successMsg}</span>}
          <button onClick={() => setShowImport(true)} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
            <Upload size={16} /> Importar
          </button>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-navy-900 text-white rounded-lg text-sm font-medium hover:bg-navy-800">
            <Plus size={18} /> Nuevo Vehículo
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-navy-100 rounded-xl flex items-center justify-center"><Truck size={22} className="text-navy-600" /></div>
          <div>
            <p className="text-sm text-gray-500">Total Vehículos</p>
            <p className="text-2xl font-bold text-navy-900">{vehiculosStats.total}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center"><Truck size={22} className="text-green-600" /></div>
          <div>
            <p className="text-sm text-gray-500">En Uso</p>
            <p className="text-2xl font-bold text-navy-900">{vehiculosStats.enUso}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-amber-200 p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-amber-100 rounded-xl flex items-center justify-center"><AlertTriangle size={22} className="text-amber-500" /></div>
          <div>
            <p className="text-sm text-gray-500">Sin Placa</p>
            <p className="text-2xl font-bold text-amber-700">{vehiculosStats.sinPlaca}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-orange-200 p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-orange-100 rounded-xl flex items-center justify-center"><Wrench size={22} className="text-orange-600" /></div>
          <div>
            <p className="text-sm text-gray-500">En Taller</p>
            <p className="text-2xl font-bold text-navy-900">{vehiculosStats.enTaller}</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <DataTable
        data={lista}
        columns={columns}
        filters={filters}
        searchPlaceholder="Buscar por código, marca, modelo, placa..."
        searchKeys={['codigoInterno', 'marca', 'modelo', 'placa']}
        perPage={5}
        onRowClick={setDetalle}
      />

      {/* Detail Panel */}
      {detalle && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-end" onClick={() => setDetalle(null)}>
          <div className="bg-white w-full max-w-lg h-full overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-navy-900">Detalle del Vehículo</h3>
              <button onClick={() => setDetalle(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  ['Código', detalle.codigoInterno],
                  ['Marca', detalle.marca],
                  ['Modelo', detalle.modelo],
                  ['Color', detalle.color],
                  ['Año', detalle.anioFabricacion?.toString() || '—'],
                  ['Placa', detalle.sinPlaca ? 'Sin placa' : detalle.placa],
                  ['Serial Motor', detalle.sinSerialMotor ? 'Sin serial' : detalle.serialMotor],
                  ['Serial Carrocería', detalle.sinSerialCarroceria ? 'Sin serial' : (detalle.serialCarroceria || '—')],
                  ['Categoría', detalle.categoriaGeneral],
                  ['Documento', detalle.documentoAdquisicion || '—'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="text-sm font-medium text-navy-900">{value}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <div><p className="text-xs text-gray-500 mb-1">Condición</p><StatusBadge status={detalle.condicionFisica} showDot size="md" /></div>
                <div><p className="text-xs text-gray-500 mb-1">Estado</p><StatusBadge status={detalle.estadoUso} size="md" /></div>
                <div><p className="text-xs text-gray-500 mb-1">Carga</p><StatusBadge status={detalle.estatusCarga} showDot size="md" /></div>
              </div>
              {detalle.observaciones && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Observaciones</p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{detalle.observaciones}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Vehicle Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-navy-900">Nuevo Vehículo</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <Field label="Código interno *" error={errors.codigoInterno}>
                <input value={form.codigoInterno} onChange={(e) => updateForm('codigoInterno', e.target.value)} className="input-field" placeholder="VH-006" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Marca *" error={errors.marca}>
                  <input value={form.marca} onChange={(e) => updateForm('marca', e.target.value)} className="input-field" />
                </Field>
                <Field label="Modelo *" error={errors.modelo}>
                  <input value={form.modelo} onChange={(e) => updateForm('modelo', e.target.value)} className="input-field" />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Color" error={errors.color}>
                  <input value={form.color} onChange={(e) => updateForm('color', e.target.value)} className="input-field" />
                </Field>
                <Field label="Año de fabricación" error={errors.anioFabricacion}>
                  <input type="number" value={form.anioFabricacion} onChange={(e) => updateForm('anioFabricacion', e.target.value)} className="input-field" placeholder="2024" />
                </Field>
              </div>
              <Field label="Placa" error={errors.placa}>
                <div className="flex items-center gap-3">
                  <input value={form.placa} onChange={(e) => updateForm('placa', e.target.value)} className="input-field flex-1" disabled={form.sinPlaca} placeholder="AB123CD" />
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer whitespace-nowrap">
                    <input type="checkbox" checked={form.sinPlaca} onChange={(e) => updateForm('sinPlaca', e.target.checked)} className="rounded" />
                    Sin placa
                  </label>
                </div>
              </Field>
              <Field label="Serial carrocería" error={errors.serialCarroceria}>
                <div className="flex items-center gap-3">
                  <input value={form.serialCarroceria} onChange={(e) => updateForm('serialCarroceria', e.target.value)} className="input-field flex-1" disabled={form.sinSerialCarroceria} />
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer whitespace-nowrap">
                    <input type="checkbox" checked={form.sinSerialCarroceria} onChange={(e) => updateForm('sinSerialCarroceria', e.target.checked)} className="rounded" />
                    Sin serial
                  </label>
                </div>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Condición física *" error={errors.condicionFisica}>
                  <select value={form.condicionFisica} onChange={(e) => updateForm('condicionFisica', e.target.value)} className="input-field">
                    {CONDICIONES_VEHICULO.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Estado de uso *" error={errors.estadoUso}>
                  <select value={form.estadoUso} onChange={(e) => updateForm('estadoUso', e.target.value)} className="input-field">
                    {ESTADOS_USO_VEHICULO.map((e) => <option key={e}>{e}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Categoría *" error={errors.categoriaGeneral}>
                <select value={form.categoriaGeneral} onChange={(e) => updateForm('categoriaGeneral', e.target.value)} className="input-field">
                  {CATEGORIAS_VEHICULO.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Observaciones" error={errors.observaciones}>
                <textarea value={form.observaciones} onChange={(e) => updateForm('observaciones', e.target.value)} className="input-field" rows={2} />
              </Field>
              <button onClick={handleSubmit} className="w-full bg-navy-900 text-white py-3 rounded-lg font-medium hover:bg-navy-800 transition-colors flex items-center justify-center gap-2">
                <Save size={18} /> Registrar Vehículo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      <ImportExcelModal
        open={showImport}
        onClose={() => setShowImport(false)}
        tiposDisponibles={['Vehículos']}
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
