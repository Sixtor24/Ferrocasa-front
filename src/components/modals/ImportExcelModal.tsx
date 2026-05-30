import { useState } from 'react';
import { X, Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, XCircle, Loader2 } from 'lucide-react';

type ImportStep = 'upload' | 'preview' | 'validating' | 'result';

interface ImportResult {
  total: number;
  creados: number;
  actualizados: number;
  omitidos: number;
  errores: { fila: number; campo: string; mensaje: string }[];
}

interface ImportExcelModalProps {
  open: boolean;
  onClose: () => void;
  tiposDisponibles: string[];
  onImportComplete?: (result: ImportResult) => void;
}

// Datos simulados de preview
const MOCK_PREVIEW = [
  { fila: 1, codigo: 'BM-001', descripcion: 'Escritorio ejecutivo', marca: 'Ofimuebles', estado: 'Bueno' },
  { fila: 2, codigo: 'BM-002', descripcion: 'Silla ergonómica', marca: 'Ergotec', estado: 'Regular' },
  { fila: 3, codigo: 'S/C', descripcion: 'Monitor LED 24"', marca: 'Samsung', estado: 'Bueno' },
  { fila: 4, codigo: 'BM-004', descripcion: 'Impresora multifuncional', marca: 'HP', estado: 'Dañado' },
  { fila: 5, codigo: 'BM-005', descripcion: 'Aire acondicionado split', marca: 'LG', estado: '' },
];

export default function ImportExcelModal({ open, onClose, tiposDisponibles, onImportComplete }: ImportExcelModalProps) {
  const [step, setStep] = useState<ImportStep>('upload');
  const [fileName, setFileName] = useState('');
  const [tipoSeleccionado, setTipoSeleccionado] = useState(tiposDisponibles[0] || '');
  const [result, setResult] = useState<ImportResult | null>(null);

  if (!open) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
    }
  };

  const handlePreview = () => {
    if (!fileName) return;
    setStep('preview');
  };

  const handleValidate = () => {
    setStep('validating');
    // Simular validación
    setTimeout(() => {
      const mockResult: ImportResult = {
        total: 48,
        creados: 41,
        actualizados: 3,
        omitidos: 2,
        errores: [
          { fila: 3, campo: 'codigo', mensaje: 'Código "S/C" detectado — marcado como sin código' },
          { fila: 5, campo: 'estado', mensaje: 'Campo "estado" vacío — asignado "Por verificar"' },
        ],
      };
      setResult(mockResult);
      setStep('result');
      onImportComplete?.(mockResult);
    }, 2500);
  };

  const handleReset = () => {
    setStep('upload');
    setFileName('');
    setResult(null);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-bold text-navy-900">Importar desde Excel/CSV</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {step === 'upload' && 'Seleccione el archivo y tipo de inventario'}
              {step === 'preview' && 'Previsualización de registros detectados'}
              {step === 'validating' && 'Validando registros...'}
              {step === 'result' && 'Resultado de la importación'}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Steps indicator */}
        <div className="px-6 pt-4">
          <div className="flex items-center gap-2">
            {['Archivo', 'Previsualizar', 'Validar', 'Resultado'].map((label, i) => {
              const stepIndex = ['upload', 'preview', 'validating', 'result'].indexOf(step);
              const isActive = i === stepIndex;
              const isDone = i < stepIndex;
              return (
                <div key={label} className="flex items-center gap-2 flex-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    isDone ? 'bg-green-500 text-white' : isActive ? 'bg-navy-900 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {isDone ? '✓' : i + 1}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${isActive ? 'text-navy-900' : 'text-gray-400'}`}>{label}</span>
                  {i < 3 && <div className={`flex-1 h-0.5 ${isDone ? 'bg-green-500' : 'bg-gray-200'}`} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step: Upload */}
          {step === 'upload' && (
            <div className="space-y-5">
              <div>
                <label className="text-sm text-gray-600 mb-1.5 block">Tipo de inventario</label>
                <select
                  value={tipoSeleccionado}
                  onChange={(e) => setTipoSeleccionado(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-navy-500"
                >
                  {tiposDisponibles.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-navy-400 transition-colors">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="import-file"
                />
                <label htmlFor="import-file" className="cursor-pointer">
                  <Upload size={40} className="mx-auto text-gray-400 mb-3" />
                  <p className="text-sm font-medium text-navy-900">
                    {fileName || 'Haga clic para seleccionar archivo'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Excel (.xlsx, .xls) o CSV</p>
                </label>
              </div>

              {fileName && (
                <div className="flex items-center gap-3 bg-navy-50 rounded-lg p-3">
                  <FileSpreadsheet size={20} className="text-navy-600" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-navy-900 truncate">{fileName}</p>
                    <p className="text-xs text-gray-500">{tipoSeleccionado}</p>
                  </div>
                  <button onClick={() => setFileName('')} className="text-gray-400 hover:text-gray-600">
                    <X size={16} />
                  </button>
                </div>
              )}

              <button
                onClick={handlePreview}
                disabled={!fileName}
                className="w-full bg-navy-900 text-white py-3 rounded-lg font-medium hover:bg-navy-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previsualizar Registros
              </button>
            </div>
          )}

          {/* Step: Preview */}
          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Se detectaron <strong className="text-navy-900">48 registros</strong> en el archivo
                </p>
                <span className="text-xs bg-navy-100 text-navy-800 px-2 py-1 rounded font-medium">{tipoSeleccionado}</span>
              </div>

              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full min-w-[500px] text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">#</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Código</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Descripción</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Marca</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_PREVIEW.map((row) => (
                      <tr key={row.fila} className="border-b border-gray-100">
                        <td className="px-3 py-2 text-gray-400">{row.fila}</td>
                        <td className={`px-3 py-2 font-mono ${row.codigo === 'S/C' ? 'text-amber-600 font-bold' : 'text-navy-900'}`}>
                          {row.codigo}
                          {row.codigo === 'S/C' && <span className="ml-1 text-[10px] bg-amber-100 text-amber-700 px-1 rounded">⚠</span>}
                        </td>
                        <td className="px-3 py-2 text-gray-700">{row.descripcion}</td>
                        <td className="px-3 py-2 text-gray-600">{row.marca}</td>
                        <td className="px-3 py-2">
                          {row.estado
                            ? <span className="text-xs font-medium">{row.estado}</span>
                            : <span className="text-xs text-red-500 font-bold">Vacío ⚠</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-400 text-center">Mostrando 5 de 48 registros</p>

              <div className="flex gap-3">
                <button onClick={handleReset} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
                  Volver
                </button>
                <button onClick={handleValidate} className="flex-1 py-2.5 bg-navy-900 text-white rounded-lg text-sm font-medium hover:bg-navy-800">
                  Validar e Importar
                </button>
              </div>
            </div>
          )}

          {/* Step: Validating */}
          {step === 'validating' && (
            <div className="py-12 text-center">
              <Loader2 size={48} className="mx-auto text-navy-600 animate-spin mb-4" />
              <p className="text-lg font-semibold text-navy-900">Validando registros...</p>
              <p className="text-sm text-gray-500 mt-1">Verificando duplicados, campos y formatos</p>
            </div>
          )}

          {/* Step: Result */}
          {step === 'result' && result && (
            <div className="space-y-5">
              <div className="text-center">
                <CheckCircle2 size={48} className="mx-auto text-green-500 mb-3" />
                <p className="text-lg font-bold text-navy-900">Importación completada</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-navy-900">{result.total}</p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-700">{result.creados}</p>
                  <p className="text-xs text-gray-500">Creados</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-700">{result.actualizados}</p>
                  <p className="text-xs text-gray-500">Actualizados</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-amber-700">{result.omitidos}</p>
                  <p className="text-xs text-gray-500">Omitidos</p>
                </div>
              </div>

              {result.errores.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={16} className="text-amber-600" />
                    <span className="text-sm font-semibold text-amber-800">Advertencias ({result.errores.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {result.errores.map((err, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-amber-700">
                        <XCircle size={12} className="mt-0.5 shrink-0" />
                        <span>Fila {err.fila}: <strong>{err.campo}</strong> — {err.mensaje}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={handleReset} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
                  Importar otro archivo
                </button>
                <button onClick={onClose} className="flex-1 py-2.5 bg-navy-900 text-white rounded-lg text-sm font-medium hover:bg-navy-800">
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
