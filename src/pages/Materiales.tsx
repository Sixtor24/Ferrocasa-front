import { useState } from 'react';
import { bienesMuebles, bienesStats } from '../data/bienes';
import {
  SEDES, CONDICIONES_FISICAS, ESTADOS_USO, CATEGORIAS_GENERALES,
  FORMAS_ADQUISICION, MONEDAS,
} from '../types/bien';
import { bienMuebleSchema } from '../schemas/bien.schema';
import { validarConZod } from '../utils/validators';
import { formatMoneda } from '../utils/formatters';
import DataTable, { type Column, type FilterOption } from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import ImportExcelModal from '../components/ImportExcelModal';
import type { BienMueble } from '../types/bien';
import ModulePageHeader from '../components/module/ModulePageHeader';
import {
  Plus, Package, AlertTriangle, Upload,
  X, Save, XCircle, BarChart3, AlertCircle,
} from 'lucide-react';

export default function Materiales() {
  const [lista, setLista] = useState(bienesMuebles);
  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [detalle, setDetalle] = useState<BienMueble | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState('');

  // Form state
  const [form, setForm] = useState({
    sede: SEDES[0] as string, unidadAdministrativa: '', codigoInterno: '', sinCodigo: false,
    descripcion: '', formaAdquisicion: 'Compra' as string, fechaAdquisicion: '', numeroDocumento: '',
    moneda: 'Bs' as string, valorAdquisicion: '', estadoUso: 'En uso' as string,
    condicionFisica: 'Bueno' as string, marca: '', modelo: '', color: '', serial: '', sinSerial: false,
    categoriaGeneral: CATEGORIAS_GENERALES[0] as string, subcategoria: '', categoriaEspecifica: '',
    codigoCategoria: '', ubicacion: '', observaciones: '',
  });

  const updateForm = (key: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
  };

  const handleSubmit = () => {
    const parsed = {
      ...form,
      valorAdquisicion: form.valorAdquisicion ? parseFloat(form.valorAdquisicion) : null,
    };
    const result = validarConZod(bienMuebleSchema, parsed);
    if (!result.success) {
      setErrors(result.errors);
      return;
    }
    const nuevo: BienMueble = {
      id: lista.length + 1,
      ...parsed,
      valorAdquisicion: parsed.valorAdquisicion,
      condicionFisica: parsed.condicionFisica as BienMueble['condicionFisica'],
      estadoUso: parsed.estadoUso as BienMueble['estadoUso'],
      formaAdquisicion: parsed.formaAdquisicion as BienMueble['formaAdquisicion'],
      moneda: parsed.moneda as BienMueble['moneda'],
      fuenteRegistro: 'Manual',
      estatusCarga: 'Completo',
      creadoEn: new Date().toISOString().split('T')[0],
      actualizadoEn: new Date().toISOString().split('T')[0],
    };
    setLista([nuevo, ...lista]);
    setShowModal(false);
    resetForm();
    setSuccessMsg('Bien mueble registrado exitosamente');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const resetForm = () => {
    setForm({
      sede: SEDES[0] as string, unidadAdministrativa: '', codigoInterno: '', sinCodigo: false,
      descripcion: '', formaAdquisicion: 'Compra', fechaAdquisicion: '', numeroDocumento: '',
      moneda: 'Bs', valorAdquisicion: '', estadoUso: 'En uso', condicionFisica: 'Bueno',
      marca: '', modelo: '', color: '', serial: '', sinSerial: false,
      categoriaGeneral: CATEGORIAS_GENERALES[0] as string, subcategoria: '', categoriaEspecifica: '',
      codigoCategoria: '', ubicacion: '', observaciones: '',
    });
    setErrors({});
  };

  const columns: Column<BienMueble>[] = [
    { key: 'codigoInterno', label: 'Código', sortable: true, render: (b) => (
      <div className="flex items-center gap-2">
        <span className="font-mono font-bold text-navy-900">{b.codigoInterno}</span>
        {b.sinCodigo && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold">S/C</span>}
      </div>
    )},
    { key: 'descripcion', label: 'Descripción', sortable: true, render: (b) => (
      <div>
        <p className="text-sm font-medium text-navy-900 truncate max-w-[200px]">{b.descripcion}</p>
        <p className="text-xs text-gray-500">{b.categoriaGeneral}</p>
      </div>
    )},
    { key: 'marca', label: 'Marca', sortable: true, render: (b) => (
      <div>
        <p className="text-sm text-gray-700">{b.marca}</p>
        {b.modelo && <p className="text-xs text-gray-400">{b.modelo}</p>}
      </div>
    )},
    { key: 'sede', label: 'Sede', sortable: true },
    { key: 'valorAdquisicion', label: 'Valor', align: 'right', sortable: true, render: (b) => (
      <span className="text-sm font-medium">{formatMoneda(b.valorAdquisicion, b.moneda)}</span>
    )},
    { key: 'condicionFisica', label: 'Condición', render: (b) => <StatusBadge status={b.condicionFisica} showDot size="sm" /> },
    { key: 'estadoUso', label: 'Estado', render: (b) => <StatusBadge status={b.estadoUso} size="sm" /> },
    { key: 'estatusCarga', label: 'Carga', render: (b) => <StatusBadge status={b.estatusCarga} showDot size="sm" /> },
  ];

  const filters: FilterOption[] = [
    { key: 'condicionFisica', label: 'Condición física', options: ['Todas', ...CONDICIONES_FISICAS] },
    { key: 'estadoUso', label: 'Estado de uso', options: ['Todos', ...ESTADOS_USO] },
    { key: 'sede', label: 'Sede', options: ['Todas', ...SEDES] },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <ModulePageHeader
        title="Bienes e Inmuebles Administrativos"
        breadcrumb={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Bienes Administrativos' }]}
        onCreate={() => setShowModal(true)}
        extraActions={
          <>
            {successMsg && <span className="text-sm text-green-600 font-medium animate-pulse self-center">{successMsg}</span>}
            <button type="button" onClick={() => setShowImport(true)} className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
              <Upload size={16} /> Importar Excel
            </button>
          </>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-navy-100 rounded-xl flex items-center justify-center"><Package size={22} className="text-navy-600" /></div>
          <div>
            <p className="text-sm text-gray-500">Total Bienes</p>
            <p className="text-2xl font-bold text-navy-900">{bienesStats.totalRegistros.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center"><BarChart3 size={22} className="text-green-600" /></div>
          <div>
            <p className="text-sm text-gray-500">Carga Completa</p>
            <p className="text-2xl font-bold text-green-700">{bienesStats.cargaCompleta}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-amber-200 p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-amber-100 rounded-xl flex items-center justify-center"><AlertTriangle size={22} className="text-amber-500" /></div>
          <div>
            <p className="text-sm text-gray-500">Carga Parcial</p>
            <p className="text-2xl font-bold text-amber-700">{bienesStats.cargaParcial}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-red-200 p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-red-100 rounded-xl flex items-center justify-center"><AlertCircle size={22} className="text-red-500" /></div>
          <div>
            <p className="text-sm text-gray-500">Con Errores</p>
            <p className="text-2xl font-bold text-red-700">{bienesStats.cargaError}</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <DataTable
        data={lista}
        columns={columns}
        filters={filters}
        searchPlaceholder="Buscar por código, descripción, marca, serial..."
        searchKeys={['codigoInterno', 'descripcion', 'marca', 'serial', 'ubicacion']}
        perPage={10}
        onRowClick={setDetalle}
      />

      {/* Detail Panel */}
      {detalle && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-end" onClick={() => setDetalle(null)}>
          <div className="bg-white w-full max-w-lg h-full overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-navy-900">Detalle del Bien</h3>
              <button onClick={() => setDetalle(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex gap-3 flex-wrap">
                <StatusBadge status={detalle.condicionFisica} showDot size="md" />
                <StatusBadge status={detalle.estadoUso} size="md" />
                <StatusBadge status={detalle.estatusCarga} showDot size="md" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  ['Código', detalle.codigoInterno + (detalle.sinCodigo ? ' (Sin código)' : '')],
                  ['Descripción', detalle.descripcion],
                  ['Marca', detalle.marca],
                  ['Modelo', detalle.modelo || '—'],
                  ['Color', detalle.color || '—'],
                  ['Serial', detalle.sinSerial ? 'Sin serial' : (detalle.serial || '—')],
                  ['Sede', detalle.sede],
                  ['Unidad', detalle.unidadAdministrativa],
                  ['Ubicación', detalle.ubicacion],
                  ['Categoría', detalle.categoriaGeneral],
                  ['Forma adquisición', detalle.formaAdquisicion],
                  ['Fecha adquisición', detalle.fechaAdquisicion || '—'],
                  ['Documento', detalle.numeroDocumento || '—'],
                  ['Valor', formatMoneda(detalle.valorAdquisicion, detalle.moneda)],
                  ['Fuente', detalle.fuenteRegistro],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="text-sm font-medium text-navy-900">{value}</p>
                  </div>
                ))}
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

      {/* New Item Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-navy-900">Nuevo Bien Mueble</h3>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Sede *" error={errors.sede}>
                  <select value={form.sede} onChange={(e) => updateForm('sede', e.target.value)} className="input-field">
                    {SEDES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Unidad administrativa *" error={errors.unidadAdministrativa}>
                  <input value={form.unidadAdministrativa} onChange={(e) => updateForm('unidadAdministrativa', e.target.value)} className="input-field" />
                </Field>
              </div>
              <Field label="Código interno *" error={errors.codigoInterno}>
                <div className="flex items-center gap-3">
                  <input value={form.codigoInterno} onChange={(e) => updateForm('codigoInterno', e.target.value)} className="input-field flex-1" disabled={form.sinCodigo} placeholder="BM-013" />
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer whitespace-nowrap">
                    <input type="checkbox" checked={form.sinCodigo} onChange={(e) => { updateForm('sinCodigo', e.target.checked); if (e.target.checked) updateForm('codigoInterno', 'S/C'); }} className="rounded" />
                    Sin código
                  </label>
                </div>
              </Field>
              <Field label="Descripción *" error={errors.descripcion}>
                <input value={form.descripcion} onChange={(e) => updateForm('descripcion', e.target.value)} className="input-field" placeholder="Ej: Escritorio ejecutivo en madera" />
              </Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Marca *" error={errors.marca}>
                  <input value={form.marca} onChange={(e) => updateForm('marca', e.target.value)} className="input-field" />
                </Field>
                <Field label="Modelo" error={errors.modelo}>
                  <input value={form.modelo} onChange={(e) => updateForm('modelo', e.target.value)} className="input-field" />
                </Field>
                <Field label="Color" error={errors.color}>
                  <input value={form.color} onChange={(e) => updateForm('color', e.target.value)} className="input-field" />
                </Field>
              </div>
              <Field label="Serial" error={errors.serial}>
                <div className="flex items-center gap-3">
                  <input value={form.serial} onChange={(e) => updateForm('serial', e.target.value)} className="input-field flex-1" disabled={form.sinSerial} />
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer whitespace-nowrap">
                    <input type="checkbox" checked={form.sinSerial} onChange={(e) => updateForm('sinSerial', e.target.checked)} className="rounded" />
                    Sin serial
                  </label>
                </div>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Condición física *" error={errors.condicionFisica}>
                  <select value={form.condicionFisica} onChange={(e) => updateForm('condicionFisica', e.target.value)} className="input-field">
                    {CONDICIONES_FISICAS.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Estado de uso *" error={errors.estadoUso}>
                  <select value={form.estadoUso} onChange={(e) => updateForm('estadoUso', e.target.value)} className="input-field">
                    {ESTADOS_USO.map((e) => <option key={e}>{e}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Categoría general *" error={errors.categoriaGeneral}>
                <select value={form.categoriaGeneral} onChange={(e) => updateForm('categoriaGeneral', e.target.value)} className="input-field">
                  {CATEGORIAS_GENERALES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Forma de adquisición" error={errors.formaAdquisicion}>
                  <select value={form.formaAdquisicion} onChange={(e) => updateForm('formaAdquisicion', e.target.value)} className="input-field">
                    {FORMAS_ADQUISICION.map((f) => <option key={f}>{f}</option>)}
                  </select>
                </Field>
                <Field label="Moneda" error={errors.moneda}>
                  <select value={form.moneda} onChange={(e) => updateForm('moneda', e.target.value)} className="input-field">
                    {MONEDAS.map((m) => <option key={m}>{m}</option>)}
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Valor de adquisición" error={errors.valorAdquisicion}>
                  <input type="number" value={form.valorAdquisicion} onChange={(e) => updateForm('valorAdquisicion', e.target.value)} className="input-field" placeholder="0.00" />
                </Field>
                <Field label="Ubicación *" error={errors.ubicacion}>
                  <input value={form.ubicacion} onChange={(e) => updateForm('ubicacion', e.target.value)} className="input-field" placeholder="Piso 3, Oficina 301" />
                </Field>
              </div>
              <Field label="Observaciones" error={errors.observaciones}>
                <textarea value={form.observaciones} onChange={(e) => updateForm('observaciones', e.target.value)} className="input-field" rows={2} />
              </Field>
              <button onClick={handleSubmit} className="w-full bg-navy-900 text-white py-3 rounded-lg font-medium hover:bg-navy-800 transition-colors flex items-center justify-center gap-2">
                <Save size={18} /> Registrar Bien Mueble
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      <ImportExcelModal
        open={showImport}
        onClose={() => setShowImport(false)}
        tiposDisponibles={['Bienes Muebles SUDEBIP', 'Inventario por Área']}
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
