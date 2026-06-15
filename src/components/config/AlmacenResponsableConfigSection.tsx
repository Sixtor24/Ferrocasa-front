import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Pencil, Warehouse } from 'lucide-react';
import { toast } from 'sonner';
import { fetchAlmacenesAll } from '../../api/services/almacenes.service';
import { fetchAllDepartamentos } from '../../api/services/departamentos.service';
import { fetchSedes } from '../../api/services/sedes.service';
import { API_MAX_LIMIT } from '../../api/pagination';
import { ALMACEN_TERRENOS_NOMBRE } from '../../constants/almacenes';
import { useApiQuery } from '../../hooks/useApiQuery';
import SearchableSelect from '../forms/SearchableSelect';
import type { ApiAlmacen } from '../../api/types';
import { findAlmacenByNombre } from '../../utils/registroBienMappers';
import {
  almacenResponsableLabel,
  createAlmacenResponsableConfig,
  saveAlmacenResponsableConfig,
} from '../../utils/almacenResponsableConfig';

type ConfigMode = 'existing' | 'new';

type AlmacenResponsableForm = {
  nombreAlmacen: string;
  idSede: string;
  nombreResponsable: string;
  ciResponsable: string;
  departamentoNombre: string;
};

const emptyForm: AlmacenResponsableForm = {
  nombreAlmacen: '',
  idSede: '',
  nombreResponsable: '',
  ciResponsable: '',
  departamentoNombre: '',
};

/** Carga datos ya guardados en el API (solo al editar desde la tabla). */
function formFromAlmacenConfig(almacen: ApiAlmacen): AlmacenResponsableForm {
  return {
    nombreAlmacen: almacen.nombre,
    idSede: String(almacen.id_sede ?? almacen.sede?.id_sede ?? ''),
    nombreResponsable: almacen.responsable?.nombre ?? '',
    ciResponsable: almacen.ci_responsable ?? almacen.responsable?.ci_responsable ?? '',
    departamentoNombre:
      almacen.departamento?.nombre
      ?? almacen.responsable?.departamento?.nombre
      ?? '',
  };
}

/** Al elegir un almacén en el selector: formulario vacío para registrar manualmente. */
function formForNewAlmacenSelection(): AlmacenResponsableForm {
  return emptyForm;
}

function formForNewTerrenosAlmacen(): AlmacenResponsableForm {
  return {
    ...emptyForm,
    nombreAlmacen: ALMACEN_TERRENOS_NOMBRE,
  };
}

function almacenTieneResponsableConfigurado(almacen: ApiAlmacen): boolean {
  return Boolean(
    (almacen.ci_responsable?.trim() && almacen.responsable?.nombre?.trim())
    || (almacen.ci_responsable?.trim() && almacen.responsable?.ci_responsable?.trim()),
  );
}

export default function AlmacenResponsableConfigSection({
  onSuccess,
  onError,
}: {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [selectedAlmacenId, setSelectedAlmacenId] = useState('');
  const [mode, setMode] = useState<ConfigMode>('existing');
  const [form, setForm] = useState<AlmacenResponsableForm>(emptyForm);
  const [editingExisting, setEditingExisting] = useState(false);
  const [saving, setSaving] = useState(false);

  const almacenesQuery = useApiQuery(() => fetchAlmacenesAll(), []);
  const departamentosQuery = useApiQuery(() => fetchAllDepartamentos(), []);
  const sedesQuery = useApiQuery(
    () => fetchSedes({ page: 1, limit: API_MAX_LIMIT }),
    [],
  );

  const almacenes = almacenesQuery.data?.data ?? [];
  const departamentos = departamentosQuery.data ?? [];
  const sedes = sedesQuery.data?.data ?? [];

  const terrenosAlmacen = useMemo(
    () => findAlmacenByNombre(ALMACEN_TERRENOS_NOMBRE, almacenes),
    [almacenes],
  );

  const sedeOptions = useMemo(
    () => sedes.map((sede) => ({ value: String(sede.id_sede), label: sede.nombre })),
    [sedes],
  );

  const almacenOptions = useMemo(
    () =>
      [...almacenes]
        .sort((a, b) => almacenResponsableLabel(a).localeCompare(almacenResponsableLabel(b), 'es'))
        .map((almacen) => ({
          value: String(almacen.id_almacen),
          label: almacenResponsableLabel(almacen),
        })),
    [almacenes],
  );

  const selectedAlmacen = useMemo(
    () => almacenes.find((almacen) => String(almacen.id_almacen) === selectedAlmacenId) ?? null,
    [almacenes, selectedAlmacenId],
  );

  const handleAlmacenChange = (id: string) => {
    setSelectedAlmacenId(id);
    setMode('existing');
    setEditingExisting(false);
    setForm(formForNewAlmacenSelection());
  };

  const handleEditAlmacen = (almacen: ApiAlmacen) => {
    setMode('existing');
    setSelectedAlmacenId(String(almacen.id_almacen));
    setEditingExisting(true);
    setForm(formFromAlmacenConfig(almacen));
  };

  const handleStartNewAlmacen = (presetTerrenos = false) => {
    setMode('new');
    setSelectedAlmacenId('');
    setEditingExisting(false);
    setForm(presetTerrenos ? formForNewTerrenosAlmacen() : emptyForm);
  };

  const handleClearForm = () => {
    setSelectedAlmacenId('');
    setMode('existing');
    setEditingExisting(false);
    setForm(emptyForm);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();

    const wasEditing = editingExisting;
    setSaving(true);
    try {
      if (mode === 'new') {
        const idSede = Number(form.idSede);
        if (!Number.isInteger(idSede) || idSede <= 0) {
          throw new Error('Seleccione una sede válida');
        }

        const created = await createAlmacenResponsableConfig(
          {
            nombreAlmacen: form.nombreAlmacen,
            idSede,
            nombreResponsable: form.nombreResponsable,
            ciResponsable: form.ciResponsable,
            departamentoNombre: form.departamentoNombre,
          },
          departamentos,
        );
        const successMessage = `Almacén ${created.nombre} creado con responsable asignado`;
        toast.success('Almacén creado', { description: successMessage });
        onSuccess(successMessage);
        setMode('existing');
        setSelectedAlmacenId(String(created.id_almacen));
        setEditingExisting(true);
        setForm(formFromAlmacenConfig(created));
      } else {
        if (!selectedAlmacen) {
          throw new Error('Seleccione un almacén');
        }

        await saveAlmacenResponsableConfig(
          {
            almacen: selectedAlmacen,
            nombreResponsable: form.nombreResponsable,
            ciResponsable: form.ciResponsable,
            departamentoNombre: form.departamentoNombre,
          },
          departamentos,
        );
        const successMessage = wasEditing
          ? `Responsable actualizado en ${selectedAlmacen.nombre}`
          : `Responsable creado y asignado a ${selectedAlmacen.nombre}`;
        toast.success(wasEditing ? 'Responsable actualizado' : 'Responsable creado y asignado', {
          description: successMessage,
        });
        onSuccess(successMessage);
        setEditingExisting(true);
      }

      await almacenesQuery.refetch();
      await departamentosQuery.refetch();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo guardar la configuración';
      const isNew = mode === 'new';
      toast.error(
        isNew ? 'No se pudo crear el almacén' : wasEditing ? 'No se pudo actualizar el responsable' : 'No se pudo crear el responsable',
        { description: message },
      );
      onError(message);
    } finally {
      setSaving(false);
    }
  };

  const configuredCount = useMemo(
    () => almacenes.filter((almacen) => almacenTieneResponsableConfigurado(almacen)).length,
    [almacenes],
  );

  return (
    <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3 bg-gray-50/60">
        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
          <Warehouse size={20} className="text-emerald-700" />
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-bold text-navy-900">Almacenes y responsables</h2>
          <p className="text-sm text-gray-500">
            Cree almacenes (p. ej. «Terrenos») y asigne su responsable. Los registros de bienes,
            cementerio, vehículos y parcelas tomarán ese responsable automáticamente.
          </p>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {!terrenosAlmacen && !almacenesQuery.loading && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-amber-900">
              No existe el almacén <strong>{ALMACEN_TERRENOS_NOMBRE}</strong>. Créelo y asigne un
              responsable para registrar parcelas con responsable automático.
            </p>
            <button
              type="button"
              onClick={() => handleStartNewAlmacen(true)}
              className="shrink-0 px-4 py-2 bg-amber-800 text-white rounded-lg text-sm font-semibold hover:bg-amber-900"
            >
              Crear almacén Terrenos
            </button>
          </div>
        )}

        <form
          onSubmit={handleSave}
          className="rounded-xl border border-gray-200 bg-gradient-to-b from-gray-50/80 to-white p-5 space-y-4"
        >
          <div>
            <p className="text-sm font-bold text-navy-900">
              {mode === 'new'
                ? 'Registrar nuevo almacén'
                : editingExisting
                  ? 'Editar responsable asignado'
                  : 'Registrar nuevo responsable'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
              {mode === 'new'
                ? 'Indique sede, nombre del almacén y datos del responsable. Se creará en el API al guardar.'
                : editingExisting
                  ? 'Modifique los datos y guarde. El responsable se actualiza en el API.'
                  : 'Elija un almacén existente y complete nombre, cédula y departamento.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setMode('existing');
                if (!selectedAlmacenId) setForm(emptyForm);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                mode === 'existing'
                  ? 'bg-navy-900 text-white border-navy-900'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
              }`}
            >
              Almacén existente
            </button>
            <button
              type="button"
              onClick={() => handleStartNewAlmacen()}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                mode === 'new'
                  ? 'bg-navy-900 text-white border-navy-900'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
              }`}
            >
              Nuevo almacén
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mode === 'new' ? (
              <>
                <TextField
                  label="Nombre del almacén"
                  hint="Ej. Terrenos, Galpón 6"
                  value={form.nombreAlmacen}
                  onChange={(value) => setForm((prev) => ({ ...prev, nombreAlmacen: value }))}
                  placeholder={ALMACEN_TERRENOS_NOMBRE}
                />
                <ConfigField label="Sede" hint="Sede a la que pertenece el almacén" required>
                  <SearchableSelect
                    value={form.idSede}
                    onChange={(value) => setForm((prev) => ({ ...prev, idSede: value }))}
                    options={sedeOptions}
                    placeholder={sedesQuery.loading ? 'Cargando sedes…' : 'Seleccionar sede…'}
                    searchPlaceholder="Buscar sede…"
                    disabled={sedesQuery.loading || sedeOptions.length === 0}
                  />
                </ConfigField>
              </>
            ) : (
              <ConfigField
                label="Almacén"
                hint="Todas las sedes: administrativa, externa, cementerio y terrenos"
                required
                className="md:col-span-2"
              >
                <SearchableSelect
                  value={selectedAlmacenId}
                  onChange={handleAlmacenChange}
                  options={almacenOptions}
                  placeholder={almacenesQuery.loading ? 'Cargando almacenes…' : 'Seleccionar almacén…'}
                  searchPlaceholder="Buscar por sede o nombre…"
                  disabled={almacenesQuery.loading || almacenOptions.length === 0}
                  minSearchLength={1}
                />
              </ConfigField>
            )}

            <TextField
              label="Nombre del responsable"
              hint="Persona encargada del almacén seleccionado"
              value={form.nombreResponsable}
              onChange={(value) => setForm((prev) => ({ ...prev, nombreResponsable: value }))}
              disabled={mode === 'existing' && !selectedAlmacen}
              placeholder="Ej. Ingeniero Pedrito Navaja"
            />
            <TextField
              label="Cédula del responsable"
              hint="6 a 12 dígitos; puede usar V- o E-. Al guardar se envía solo el número al API"
              value={form.ciResponsable}
              onChange={(value) => setForm((prev) => ({ ...prev, ciResponsable: value }))}
              disabled={mode === 'existing' && !selectedAlmacen}
              placeholder="Ej. V-31881820 o solo dígitos"
            />
            <TextField
              label="Departamento"
              hint="Área de la sede a la que pertenece el responsable"
              value={form.departamentoNombre}
              onChange={(value) => setForm((prev) => ({ ...prev, departamentoNombre: value }))}
              disabled={mode === 'existing' && !selectedAlmacen}
              className="md:col-span-2"
              placeholder="Ej. Recursos Humanos"
            />
          </div>

          <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-gray-200/80">
            {(selectedAlmacenId || editingExisting || mode === 'new') && (
              <button
                type="button"
                onClick={handleClearForm}
                className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-white"
              >
                Limpiar formulario
              </button>
            )}
            <button
              type="submit"
              disabled={saving || (mode === 'existing' && !selectedAlmacen)}
              className="px-6 py-2.5 bg-navy-900 text-white rounded-lg text-sm font-semibold hover:bg-navy-800 disabled:opacity-60"
            >
              {saving
                ? 'Guardando…'
                : mode === 'new'
                  ? 'Crear almacén y asignar responsable'
                  : editingExisting
                    ? 'Actualizar responsable'
                    : 'Crear y asignar responsable'}
            </button>
          </div>
        </form>

        {(almacenesQuery.error || departamentosQuery.error || sedesQuery.error) && (
          <p className="text-sm text-red-600">
            {almacenesQuery.error || departamentosQuery.error || sedesQuery.error}
          </p>
        )}

        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left text-xs font-semibold text-gray-600 px-3 py-2.5">Sede</th>
                <th className="text-left text-xs font-semibold text-gray-600 px-3 py-2.5">Almacén</th>
                <th className="text-left text-xs font-semibold text-gray-600 px-3 py-2.5 hidden md:table-cell">Responsable</th>
                <th className="text-left text-xs font-semibold text-gray-600 px-3 py-2.5">Cédula</th>
                <th className="text-left text-xs font-semibold text-gray-600 px-3 py-2.5 hidden lg:table-cell">Departamento</th>
                <th className="text-left text-xs font-semibold text-gray-600 px-3 py-2.5">Estado</th>
                <th className="text-right text-xs font-semibold text-gray-600 px-3 py-2.5 w-20">Editar</th>
              </tr>
            </thead>
            <tbody>
              {almacenesQuery.loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">Cargando almacenes...</td>
                </tr>
              ) : almacenes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">No hay almacenes registrados.</td>
                </tr>
              ) : (
                [...almacenes]
                  .sort((a, b) => almacenResponsableLabel(a).localeCompare(almacenResponsableLabel(b), 'es'))
                  .map((almacen) => (
                    <tr
                      key={almacen.id_almacen}
                      className={`border-b border-gray-100 last:border-0 hover:bg-gray-50/80 ${
                        String(almacen.id_almacen) === selectedAlmacenId ? 'bg-emerald-50/50' : ''
                      }`}
                    >
                      <td className="px-3 py-3 text-gray-700 text-xs sm:text-sm">{almacen.sede?.nombre ?? '—'}</td>
                      <td className="px-3 py-3 font-medium text-navy-900">{almacen.nombre}</td>
                      <td className="px-3 py-3 text-gray-800 hidden md:table-cell">
                        {almacen.responsable?.nombre ?? '—'}
                      </td>
                      <td className="px-3 py-3 font-mono text-xs text-gray-700">{almacen.ci_responsable ?? '—'}</td>
                      <td className="px-3 py-3 text-gray-700 hidden lg:table-cell">
                        {almacen.departamento?.nombre ?? almacen.responsable?.departamento?.nombre ?? '—'}
                      </td>
                      <td className="px-3 py-3">
                        {almacenTieneResponsableConfigurado(almacen) ? (
                          <span className="text-xs font-medium text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                            Asignado
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                            Pendiente
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleEditAlmacen(almacen)}
                          title="Cargar en el formulario para editar"
                          className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-white hover:border-emerald-300"
                        >
                          <Pencil size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-gray-500">
          {configuredCount} de {almacenes.length} almacenes con responsable asignado en el sistema.
        </p>
      </div>
    </section>
  );
}

function ConfigField({
  label,
  hint,
  required,
  children,
  className = '',
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-sm font-medium text-navy-900">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </p>
      {hint && <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{hint}</p>}
      <div className={hint ? 'mt-2' : 'mt-1.5'}>{children}</div>
    </div>
  );
}

function TextField({
  label,
  hint,
  value,
  onChange,
  disabled,
  placeholder,
  className = '',
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}) {
  return (
    <ConfigField label={label} hint={hint} required className={className}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        required
        className="input-field disabled:bg-gray-100 disabled:text-gray-500"
      />
    </ConfigField>
  );
}
