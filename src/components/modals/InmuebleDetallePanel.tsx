import { X } from 'lucide-react';
import StatusBadge from '../StatusBadge';
import type { Inmueble } from '../../types/inmueble';
import { formatArea, formatMoneda } from '../../utils/formatters';

type InmuebleDetallePanelProps = {
  inmueble: Inmueble | null;
  onClose: () => void;
};

export default function InmuebleDetallePanel({ inmueble, onClose }: InmuebleDetallePanelProps) {
  if (!inmueble) return null;

  const detalle = inmueble;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex justify-end" onClick={onClose}>
      <div
        className="bg-white w-full max-w-lg h-full overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="inmueble-detalle-title"
      >
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 id="inmueble-detalle-title" className="text-lg font-bold text-navy-900">
            Detalle del Inmueble
          </h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <StatusBadge status={detalle.estadoOcupacion} showDot size="md" />
          <div className="grid grid-cols-2 gap-4">
            {(
              [
                ['Parcela', detalle.identificacionParcela],
                ['Tipo', detalle.tipoInmueble],
                ['Ubicación', detalle.ubicacion],
                ['Zonificación', detalle.zonificacion],
                ['Uso actual', detalle.usoActual],
                ['Proyecto', detalle.proyecto || '—'],
                ['Área s/documento', formatArea(detalle.areaSegunDocumento)],
                ['Área disponible', formatArea(detalle.areaDisponible)],
                ['Área comprometida', formatArea(detalle.areaComprometida)],
                ['Área desincorporada', formatArea(detalle.areaDesincorporada)],
                ['Precio', formatMoneda(detalle.precio, 'USD')],
                ['Coordenadas', detalle.coordenadas || '—'],
              ] as const
            ).map(([l, v]) => (
              <div key={l}>
                <p className="text-xs text-gray-500">{l}</p>
                <p className="text-sm font-medium text-navy-900">{v}</p>
              </div>
            ))}
          </div>
          {detalle.linderos && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Linderos</p>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{detalle.linderos}</p>
            </div>
          )}
          {detalle.datosRegistrales && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Datos registrales</p>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{detalle.datosRegistrales}</p>
            </div>
          )}
          {detalle.observaciones && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Observaciones</p>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{detalle.observaciones}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
