import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Package, Search } from 'lucide-react';
import type { ApiAlmacen } from '../../api/types';
import {
  filterAlmacenesMismaSede,
  resolveSedeEtiqueta,
} from '../../utils/almacenSedeFilters';
import { normalizeCatalogValue } from '../../utils/registroBienMappers';
import Modal from './Modal';

type TransferirAlmacenModalProps = {
  open: boolean;
  onClose: () => void;
  assetLabel: string;
  sedeActual: string;
  almacenActual: string;
  almacenes: ApiAlmacen[];
  onConfirm: (idAlmacen: number, nombreAlmacen: string) => void | Promise<void>;
  loading?: boolean;
};

function almacenDetalle(almacen: ApiAlmacen) {
  const partes = [almacen.departamento?.nombre, almacen.responsable?.nombre].filter(Boolean);
  return partes.join(' · ') || 'Sin datos adicionales';
}

export default function TransferirAlmacenModal({
  open,
  onClose,
  assetLabel,
  sedeActual,
  almacenActual,
  almacenes,
  onConfirm,
  loading = false,
}: TransferirAlmacenModalProps) {
  const sedeEtiqueta = useMemo(
    () => resolveSedeEtiqueta(almacenes, almacenActual, sedeActual),
    [almacenes, almacenActual, sedeActual],
  );

  const destinos = useMemo(() => {
    const actualNorm = normalizeCatalogValue(almacenActual);
    return filterAlmacenesMismaSede(almacenes, almacenActual, sedeActual)
      .filter((almacen) => normalizeCatalogValue(almacen.nombre) !== actualNorm)
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }, [almacenes, almacenActual, sedeActual]);

  const [destinoId, setDestinoId] = useState<number | null>(null);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    if (open) {
      setDestinoId(destinos[0]?.id_almacen ?? null);
      setBusqueda('');
    }
  }, [open, destinos]);

  const destinosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return destinos;
    return destinos.filter((almacen) => {
      const texto = [
        almacen.nombre,
        almacen.sede?.nombre,
        almacen.departamento?.nombre,
        almacen.responsable?.nombre,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return texto.includes(q);
    });
  }, [busqueda, destinos]);

  const destinoSeleccionado = destinos.find((almacen) => almacen.id_almacen === destinoId);

  const handleConfirm = async () => {
    if (!destinoSeleccionado) return;
    await onConfirm(destinoSeleccionado.id_almacen, destinoSeleccionado.nombre);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Transferir a otro almacén"
      maxWidth="2xl"
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading || !destinoSeleccionado}
            className="px-6 py-2.5 bg-navy-900 text-white rounded-lg text-sm font-semibold hover:bg-navy-800 disabled:opacity-60"
          >
            {loading ? 'Transfiriendo...' : 'Confirmar transferencia'}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-white border border-gray-200 p-2 text-navy-800">
              <Package size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Ítem a transferir</p>
              <p className="text-base font-semibold text-navy-900 break-words">{assetLabel}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
          <div className="rounded-xl border border-gray-200 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Origen</p>
            <p className="text-sm font-semibold text-navy-900">{almacenActual || '—'}</p>
            <p className="text-xs text-gray-500 mt-1">Sede: {sedeEtiqueta}</p>
          </div>
          <div className="hidden md:flex items-center justify-center text-gray-400">
            <ArrowRight size={20} />
          </div>
          <div className="rounded-xl border border-navy-200 bg-navy-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-navy-700 mb-1">Destino</p>
            <p className="text-sm font-semibold text-navy-900">
              {destinoSeleccionado?.nombre ?? 'Seleccione un almacén'}
            </p>
            {destinoSeleccionado && (
              <p className="text-xs text-navy-700 mt-1">{almacenDetalle(destinoSeleccionado)}</p>
            )}
          </div>
        </div>

        {destinos.length === 0 ? (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            No hay otros almacenes en la sede «{sedeEtiqueta}» para transferir este ítem.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="block text-sm font-medium text-gray-700">
                Seleccione almacén destino
              </label>
              <span className="text-xs font-medium text-navy-700 bg-navy-50 border border-navy-100 rounded-full px-3 py-1">
                Solo sede: {sedeEtiqueta}
              </span>
            </div>
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                type="search"
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
                placeholder="Buscar por nombre, departamento o responsable..."
                className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy-200"
              />
            </div>
            <div className="max-h-72 overflow-y-auto rounded-xl border border-gray-200 divide-y divide-gray-100">
              {destinosFiltrados.length === 0 ? (
                <p className="px-4 py-6 text-sm text-gray-500 text-center">
                  No se encontraron almacenes con ese criterio.
                </p>
              ) : (
                destinosFiltrados.map((almacen) => {
                  const selected = destinoId === almacen.id_almacen;
                  return (
                    <label
                      key={almacen.id_almacen}
                      className={`flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors ${
                        selected ? 'bg-navy-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="almacen-destino"
                        checked={selected}
                        onChange={() => setDestinoId(almacen.id_almacen)}
                        className="mt-1 shrink-0"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-navy-900">{almacen.nombre}</span>
                        <span className="block text-xs text-gray-500 mt-0.5">{almacenDetalle(almacen)}</span>
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
