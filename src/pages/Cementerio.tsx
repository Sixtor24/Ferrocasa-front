import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  fetchAllBienesCementerio,
  fetchBienCementerioByCodigo,
  fetchBienesCementerio,
} from "../api/services/bienes-sedes.service";
import {
  fetchApiBienByCodigo,
  updateBien,
} from "../api/services/bienes.service";
import { fetchAlmacenes } from "../api/services/almacenes.service";
import { fetchSedes } from "../api/services/sedes.service";
import { API_MAX_LIMIT } from "../api/pagination";
import { aggregateBienesMetricsFromList } from "../utils/bienesStats";
import {
  INVENTARIO_VIEW_OPTIONS,
  isInventarioActivo,
  matchesInventarioView,
  resolveInventarioView,
} from "../utils/inventarioActivo";
import { useApiQuery } from "../hooks/useApiQuery";
import { formatFecha, formatMoneda, fechaCalendarioIso } from "../utils/formatters";
import { notifyBienActualizado } from "../utils/assetNotify";
import { apiBienToUpdatePayload } from "../utils/assetUpdateMappers";
import { bienCodigoPk } from "../utils/bienCodigo";
import { estadoUsoToApi } from "../utils/registroBienMappers";
import { useUnsavedChangesGuard } from "../hooks/useUnsavedChangesGuard";
import UnsavedChangesModal from "../components/modals/UnsavedChangesModal";
import type { Column } from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import ApiState from "../components/ApiState";
import { RegistroBienesCementerioModal } from "../components/modals";
import RetirarInventarioModal from "../components/modals/RetirarInventarioModal";
import TransferirAlmacenModal from "../components/modals/TransferirAlmacenModal";
import {
  useBienInventarioActions,
  type InventarioBienActionResult,
} from "../hooks/useBienInventarioActions";
import type { ApiAlmacen } from "../api/types";
import ModulePageHeader from "../components/module/ModulePageHeader";
import { useRolePermissions } from "../hooks/useRolePermissions";
import ModuleFilterBar from "../components/module/ModuleFilterBar";
import SearchableSelect from "../components/forms/SearchableSelect";
import { FILTROS_INVENTARIO_VACIOS } from "../constants/moduleFilters";
import ModuleDataTable from "../components/module/ModuleDataTable";
import ModulePagination from "../components/module/ModulePagination";
import AssetDetailView from "../components/module/AssetDetailView";
import { useModuleUiState } from "../stores/moduleUiStore";
import type { BienMueble } from "../types/bien";
import { ESTADOS_USO } from "../types/bien";
import { nombresAlmacenesCementerio } from "../utils/cementerioAlmacenes";
import {
  ArrowLeft,
  FileText,
  Landmark,
  Package,
  AlertTriangle,
  AlertCircle,
} from "lucide-react";

function CementerioBienDetail({
  bien,
  almacenes,
  onVolver,
  onSaved,
  onInventarioAction,
}: {
  bien: BienMueble;
  almacenes: ApiAlmacen[];
  onVolver: () => void;
  onSaved?: () => void | Promise<void>;
  onInventarioAction?: (result: InventarioBienActionResult) => void;
}) {
  const { canWriteAssets, canTransferBien, canRetireBien } =
    useRolePermissions();
  const navigate = useNavigate();
  const [estadoUso, setEstadoUso] = useState(bien.estadoUso);
  const [saving, setSaving] = useState(false);
  const inventario = useBienInventarioActions({
    bien,
    almacenes,
    onActionSuccess: onInventarioAction,
  });

  useEffect(() => {
    setEstadoUso(bien.estadoUso);
  }, [bien.estadoUso]);

  const isDirty = estadoUso !== bien.estadoUso;
  const unsaved = useUnsavedChangesGuard(isDirty);

  const guardarCambio = async () => {
    setSaving(true);
    try {
      const codigo = bienCodigoPk(bien);
      const apiBien = await fetchApiBienByCodigo(codigo);
      const payload = apiBienToUpdatePayload(apiBien, {
        estado_uso: estadoUsoToApi(estadoUso),
      });
      await updateBien(codigo, payload);
      notifyBienActualizado(bien, { estadoUso });
      await onSaved?.();
    } catch (err) {
      toast.error("No se pudo guardar el cambio", {
        description: err instanceof Error ? err.message : "Intente nuevamente.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AssetDetailView
        title="Bienes e Inmuebles: Cementerio"
        onNavigateTo={(to) =>
          unsaved.requestLeave(() =>
            to === "/cementerio" ? onVolver() : navigate(to),
          )
        }
        breadcrumb={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Cementerio", to: "/cementerio" },
          { label: bien.sinCodigo ? "Sin código" : bien.codigoInterno },
        ]}
        categoryFields={[
          { label: "Categoría", value: bien.categoriaGeneral },
          { label: "Sub Categoría", value: bien.subcategoria },
          { label: "Categoría Específica", value: bien.categoriaEspecifica },
        ]}
        sections={[
          {
            title: "Detalles",
            fields: [
              { label: "Descripción", value: bien.descripcion },
              {
                label: "Fecha de Ingreso",
                value: formatFecha(bien.fechaIngreso || bien.fechaAdquisicion),
              },
              { label: "Color", value: bien.color || "—" },
              { label: "Marca", value: bien.marca || "—" },
              { label: "Modelo", value: bien.modelo || "—" },
              {
                label: "Valor de Adquisición",
                value: formatMoneda(bien.valorAdquisicion, bien.moneda),
              },
              {
                label: "Código",
                value: bien.sinCodigo ? "Sin código" : bien.codigoInterno,
              },
              {
                label: "Serial",
                value: bien.sinSerial ? "Sin serial" : bien.serial || "—",
              },
              {
                label: "Responsable",
                value:
                  bien.responsable !== "—"
                    ? bien.responsable
                    : bien.ciResponsable
                      ? `CI ${bien.ciResponsable}`
                      : "—",
              },
              {
                label: "Unidad Administrativa",
                value: bien.unidadAdministrativa,
              },
              {
                label: "Estado de uso",
                value: (
                  <SearchableSelect
                    value={estadoUso}
                    onChange={(value) =>
                      setEstadoUso(value as BienMueble["estadoUso"])
                    }
                    options={ESTADOS_USO}
                    className="max-w-xs"
                    disabled={inventario.retirado || !canWriteAssets}
                    disableSearch
                  />
                ),
              },
              { label: "Almacén", value: bien.ubicacion },
              { label: "Sede", value: bien.sede },
            ],
          },
          {
            title: "Detalles del documento de Ingreso",
            fields: [
              { label: "Nro de Documento", value: bien.numeroDocumento || "—" },
              {
                label: "Fecha Adquisición",
                value: formatFecha(bien.fechaAdquisicion),
              },
              { label: "Forma de Adquisición", value: bien.formaAdquisicion },
              { label: "Nombre de Proveedor", value: bien.nombreProveedor },
              {
                label: "Valor del Bien",
                value: formatMoneda(bien.valorAdquisicion, bien.moneda),
              },
            ],
          },
        ]}
        actions={
          <>
            <button
              type="button"
              onClick={() => unsaved.requestLeave(onVolver)}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeft size={16} />
              Volver al listado
            </button>
            {canWriteAssets && (
              <button
                type="button"
                onClick={guardarCambio}
                disabled={saving}
                className="px-5 py-2.5 bg-navy-900 text-white rounded-lg text-sm font-semibold hover:bg-navy-800 disabled:opacity-60"
              >
                {saving ? "Guardando..." : "Guardar cambio"}
              </button>
            )}
            {canTransferBien && (
              <button
                type="button"
                onClick={() => inventario.setTransferOpen(true)}
                disabled={
                  inventario.retirado ||
                  inventario.transferLoading ||
                  inventario.retireLoading
                }
                className="px-5 py-2.5 border border-navy-200 text-navy-800 rounded-lg text-sm font-semibold hover:bg-navy-50 disabled:opacity-50"
              >
                Transferir a otro almacén
              </button>
            )}
            {canRetireBien && (
              <button
                type="button"
                onClick={() => inventario.setRetireOpen(true)}
                disabled={
                  inventario.retirado ||
                  inventario.transferLoading ||
                  inventario.retireLoading
                }
                className="px-5 py-2.5 border border-red-200 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-50 disabled:opacity-50"
              >
                Retirar de Inventario
              </button>
            )}
          </>
        }
      />
      <TransferirAlmacenModal
        open={inventario.transferOpen}
        onClose={() => inventario.setTransferOpen(false)}
        assetLabel={inventario.assetLabel}
        sedeActual={inventario.sedeActual}
        almacenActual={inventario.almacenActual}
        almacenes={inventario.almacenes}
        onConfirm={inventario.handleTransfer}
        loading={inventario.transferLoading}
      />
      <RetirarInventarioModal
        open={inventario.retireOpen}
        onClose={() => inventario.setRetireOpen(false)}
        assetLabel={inventario.assetLabel}
        onConfirm={inventario.handleRetire}
        loading={inventario.retireLoading}
      />
      <UnsavedChangesModal
        open={unsaved.modalOpen}
        onClose={unsaved.cancelLeave}
        onConfirm={unsaved.confirmLeave}
        subject="del bien"
      />
    </>
  );
}

const CEMENTERIO_COLUMNS: Column<BienMueble>[] = [
  {
    key: "codigoInterno",
    label: "Código",
    render: (b) => (
      <span className="font-mono font-bold text-navy-900">
        {b.codigoInterno}
      </span>
    ),
  },
  {
    key: "descripcion",
    label: "Descripción",
    render: (b) => (
      <span className="max-w-[220px] truncate block">{b.descripcion}</span>
    ),
  },
  {
    key: "marca",
    label: "Marca",
    render: (b) => <span>{b.marca || "—"}</span>,
  },
  {
    key: "modelo",
    label: "Modelo",
    render: (b) => <span>{b.modelo || "—"}</span>,
  },
  {
    key: "color",
    label: "Color",
    render: (b) => <span>{b.color || "—"}</span>,
  },
  {
    key: "serial",
    label: "Serial",
    render: (b) => <span className="font-mono text-sm">{b.serial || "—"}</span>,
  },
  {
    key: "fechaAdquisicion",
    label: "Fecha",
    render: (b) => <span>{formatFecha(b.fechaAdquisicion)}</span>,
  },
  { key: "sede", label: "Sede" },
  { key: "ubicacion", label: "Almacén" },
  {
    key: "estadoUso",
    label: "Estado de uso",
    render: (b) => <StatusBadge status={b.estadoUso} size="sm" />,
  },
];

export default function Cementerio() {
  const { canWriteAssets, canExportInventory, canViewRetirados } =
    useRolePermissions();
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    page,
    filters: filtros,
    modals,
    setPage,
    setFilter: setModuleFilter,
    resetFilters,
    setModal,
  } = useModuleUiState("cementerio", FILTROS_INVENTARIO_VACIOS);
  const showRegistro = modals.registro ?? false;
  const [perPage, setPerPage] = useState(50);
  const apiSearch = useMemo(
    () => filtros.buscar.trim() || undefined,
    [filtros.buscar],
  );

  const bienesQuery = useApiQuery(
    () => fetchBienesCementerio({ page, limit: perPage, search: apiSearch }),
    [page, perPage, apiSearch],
  );
  const metricsQuery = useApiQuery(async () => {
    const bienes = await fetchAllBienesCementerio({ search: apiSearch });
    return aggregateBienesMetricsFromList(bienes.filter(isInventarioActivo));
  }, [apiSearch]);
  const almacenesQuery = useApiQuery(
    () => fetchAlmacenes({ page: 1, limit: API_MAX_LIMIT }),
    [],
  );
  const sedesQuery = useApiQuery(
    () => fetchSedes({ page: 1, limit: API_MAX_LIMIT }),
    [],
  );
  const detailQuery = useApiQuery(
    () => fetchBienCementerioByCodigo(id as string),
    [id],
    Boolean(id),
  );
  const bienes = bienesQuery.data?.data ?? [];
  const totalPages = bienesQuery.data?.meta.totalPages ?? 1;

  const metricas = metricsQuery.data ?? {
    total: 0,
    enUso: 0,
    enObsolescencia: 0,
    obsoletos: 0,
  };
  const metricsLoading = metricsQuery.loading && !metricsQuery.data;

  const almacenes = almacenesQuery.data?.data ?? [];
  const sedes = sedesQuery.data?.data ?? [];
  const almacenOptions = useMemo(
    () => nombresAlmacenesCementerio(almacenes, sedes),
    [almacenes, sedes],
  );
  const departamentoOptions = almacenOptions;
  const inventarioView = resolveInventarioView(
    filtros.inventario,
    canViewRetirados,
  );

  // Filtrar bienes
  const filteredBienes = useMemo(() => {
    const q = filtros.buscar.toLowerCase();
    return bienes.filter((b) => {
      if (!matchesInventarioView(b, inventarioView)) return false;
      if (
        filtros.codigo &&
        !b.codigoInterno.toLowerCase().includes(filtros.codigo.toLowerCase())
      )
        return false;
      if (
        filtros.descripcion &&
        !b.descripcion.toLowerCase().includes(filtros.descripcion.toLowerCase())
      )
        return false;
      if (filtros.almacen && b.ubicacion !== filtros.almacen) return false;
      if (
        filtros.departamento &&
        b.unidadAdministrativa !== filtros.departamento
      )
        return false;
      if (
        filtros.numeroDocumento &&
        !b.numeroDocumento.includes(filtros.numeroDocumento)
      )
        return false;
      if (filtros.fecha && fechaCalendarioIso(b.fechaAdquisicion) !== filtros.fecha)
        return false;
      if (
        filtros.estadoUso &&
        filtros.estadoUso !== "Todos" &&
        b.estadoUso !== filtros.estadoUso
      )
        return false;
      if (q) {
        const hay =
          b.codigoInterno.toLowerCase().includes(q) ||
          b.descripcion.toLowerCase().includes(q) ||
          b.marca.toLowerCase().includes(q) ||
          b.serial.toLowerCase().includes(q) ||
          b.ubicacion.toLowerCase().includes(q);
        if (!hay) return false;
      }
      return true;
    });
  }, [bienes, filtros, inventarioView]);

  const paginatedBienes = filteredBienes;

  const setFiltro = (key: keyof typeof filtros, value: string) => {
    setModuleFilter(key, value);
    setPage(1);
  };

  if (id) {
    return (
      <ApiState
        loading={detailQuery.loading && !detailQuery.data}
        error={detailQuery.error}
        onRetry={detailQuery.refetch}
      >
        {detailQuery.data && (
          <CementerioBienDetail
            bien={detailQuery.data}
            almacenes={almacenes}
            onVolver={() => {
              void bienesQuery.refetch();
              navigate("/cementerio");
            }}
            onSaved={async () => {
              await Promise.all([bienesQuery.refetch(), detailQuery.refetch()]);
            }}
            onInventarioAction={async (result) => {
              if (result.type === "transfer") {
                void bienesQuery.refetch();
                setModuleFilter("almacen", result.almacenDestino);
                try {
                  await fetchBienCementerioByCodigo(id);
                  await detailQuery.refetch();
                } catch {
                  navigate("/cementerio");
                }
                return;
              }
              void bienesQuery.refetch();
              await detailQuery.refetch();
            }}
          />
        )}
      </ApiState>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px]">
      {/* Header */}
      <ModulePageHeader
        title="Bienes e Inmuebles: Cementerio"
        breadcrumb={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Cementerio" },
        ]}
        formatModule={canExportInventory ? "cementerio" : undefined}
        onCreate={canWriteAssets ? () => setModal("registro", true) : undefined}
        createLabel="Crear Registro"
      />

      {/* Resumen de inventario */}
      <section
        aria-label="Métricas del cementerio"
      >
        {/* Loader */}
        {metricsLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-[92px] rounded-xl border border-gray-200 bg-white animate-pulse"
              />
            ))}
          </div>
        ) : (
          /* Content */
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <CementerioMetricCard
                label="Total Bienes"
                value={metricas.total}
                icon={<Landmark size={22} className="text-blue-600" />}
                iconClassName="bg-blue-100"
                valueClassName="text-blue-700"
              />
              <CementerioMetricCard
                label="Bienes en uso"
                value={metricas.enUso}
                icon={<Package size={22} className="text-green-600" />}
                iconClassName="bg-green-100"
                valueClassName="text-green-700"
              />
              <CementerioMetricCard
                label="Bienes en obsolescencia"
                value={metricas.enObsolescencia}
                icon={<AlertTriangle size={22} className="text-amber-500" />}
                iconClassName="bg-amber-100"
                borderClassName="border-amber-200"
                valueClassName="text-amber-700"
              />
              <CementerioMetricCard
                label="Bienes obsoletos"
                value={metricas.obsoletos}
                icon={<AlertCircle size={22} className="text-red-500" />}
                iconClassName="bg-red-100"
                borderClassName="border-red-200"
                valueClassName="text-red-700"
              />
            </div>
            {metricas.total === 0 && !metricsLoading && (
              <p className="mt-4 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                No hay bienes registrados en la sede Cementerio.
              </p>
            )}
          </>
        )}
      </section>

      <ModuleFilterBar
        onClearFilters={() => {
          resetFilters();
        }}
        fields={[
          {
            key: "codigo",
            label: "Código",
            type: "text",
            value: filtros.codigo,
            onChange: (v) => setFiltro("codigo", v),
          },
          {
            key: "descripcion",
            label: "Descripción",
            type: "text",
            value: filtros.descripcion,
            onChange: (v) => setFiltro("descripcion", v),
          },
          {
            key: "almacen",
            label: "Almacén",
            type: "select",
            value: filtros.almacen,
            onChange: (v) => setFiltro("almacen", v),
            options: almacenOptions,
          },
          {
            key: "departamento",
            label: "Unidad Administrativa",
            type: "select",
            value: filtros.departamento,
            onChange: (v) => setFiltro("departamento", v),
            options: departamentoOptions,
          },
          {
            key: "documento",
            label: "Número de documento",
            type: "text",
            value: filtros.numeroDocumento,
            onChange: (v) => setFiltro("numeroDocumento", v),
          },
          {
            key: "fecha",
            label: "Fecha de adquisición",
            type: "date",
            value: filtros.fecha,
            onChange: (v) => setFiltro("fecha", v),
          },
          {
            key: "estadoUso",
            label: "Estado de uso",
            type: "select",
            value: filtros.estadoUso,
            onChange: (v) => setFiltro("estadoUso", v),
            options: ["Todos", ...ESTADOS_USO],
          },
          ...(canViewRetirados
            ? [
                {
                  key: "inventario",
                  label: "Ver retirados",
                  type: "select" as const,
                  value: inventarioView,
                  onChange: (v: string) => setFiltro("inventario", v),
                  options: [...INVENTARIO_VIEW_OPTIONS],
                },
              ]
            : []),
          {
            key: "buscar",
            label: "Buscar",
            type: "search",
            value: filtros.buscar,
            onChange: (v) => setFiltro("buscar", v),
            placeholder: "Buscar por código, descripción, marca, serial...",
            className: "sm:col-span-2 lg:col-span-1",
          },
        ]}
      >
        <p className="text-sm text-gray-500 tabular-nums" aria-live="polite">
          {filteredBienes.length === bienes.length
            ? `${bienes.length} registro${bienes.length === 1 ? "" : "s"} en esta página`
            : `${filteredBienes.length} de ${bienes.length} en esta página`}
        </p>
      </ModuleFilterBar>

      <ApiState
        loading={bienesQuery.loading && !bienesQuery.data}
        error={bienesQuery.error}
        onRetry={bienesQuery.refetch}
        empty={!bienesQuery.loading && filteredBienes.length === 0}
        emptyMessage="No hay bienes asociados a la sede Cementerio en el backend."
      >
        <ModuleDataTable
          data={paginatedBienes}
          columns={CEMENTERIO_COLUMNS}
          loading={bienesQuery.loading && Boolean(bienesQuery.data)}
          onDetails={(b) =>
            navigate(`/cementerio/${encodeURIComponent(b.codigoInterno)}`)
          }
          emptyMessage="No hay registros del cementerio."
        />
        <div className="flex items-center justify-between flex-wrap gap-3 py-1">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Filas por página:</span>
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setPage(1);
              }}
              className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-navy-500"
            >
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
          </div>
          <ModulePagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      </ApiState>

      <RegistroBienesCementerioModal
        open={showRegistro}
        onClose={() => setModal("registro", false)}
        sedes={sedes}
        onSuccess={() => {
          bienesQuery.refetch();
          metricsQuery.refetch();
        }}
        onError={() => {}}
      />
    </div>
  );
}

function CementerioMetricCard({
  label,
  value,
  icon,
  iconClassName,
  borderClassName = "border-gray-200",
  valueClassName = "text-navy-900",
}: {
  label: string;
  value: number;
  icon: ReactNode;
  iconClassName: string;
  borderClassName?: string;
  valueClassName?: string;
}) {
  return (
    <div
      className={`bg-white rounded-xl border p-5 flex items-center gap-4 shadow-sm ${borderClassName}`}
    >
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iconClassName}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-600">{label}</p>
        <p
          className={`text-3xl font-bold tabular-nums leading-tight ${valueClassName}`}
        >
          {value.toLocaleString("es-VE")}
        </p>
      </div>
    </div>
  );
}
