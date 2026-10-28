import { useEffect, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  FileSpreadsheet,
  Loader2,
  Upload,
  X,
} from 'lucide-react'
import type { ComprasImportResult } from '../../types/compras'
import { api } from '../../services/api'
import {
  formatDate,
  formatMxn,
  formatMxnCompact,
  formatNumber,
} from '../../lib/format'

interface ImportComprasDialogProps {
  open: boolean
  onClose: () => void
  onImported: () => void
}

type Status = 'idle' | 'importando' | 'ok' | 'error'
type ModoCarga = 'reemplazar' | 'agregar'

export function ImportComprasDialog({
  open,
  onClose,
  onImported,
}: ImportComprasDialogProps) {
  const [archivo, setArchivo] = useState<File | null>(null)
  const [modo, setModo] = useState<ModoCarga>('reemplazar')
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState<string | null>(null)
  const [resultado, setResultado] = useState<ComprasImportResult | null>(null)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || status === 'importando') return
      setArchivo(null)
      setModo('reemplazar')
      setStatus('idle')
      setMessage(null)
      setResultado(null)
      onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, status, onClose])

  if (!open) return null

  const busy = status === 'importando'

  function reset() {
    setArchivo(null)
    setModo('reemplazar')
    setStatus('idle')
    setMessage(null)
    setResultado(null)
  }

  function close() {
    if (busy) return
    reset()
    onClose()
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!archivo) return
    setStatus('importando')
    setMessage(null)
    setResultado(null)
    try {
      const data = await api.importarCompras(archivo, modo)
      setResultado(data)
      setStatus('ok')
      setMessage(
        modo === 'reemplazar'
          ? 'Las compras se reemplazaron correctamente.'
          : 'Las compras se agregaron correctamente.',
      )
      onImported()
    } catch (error) {
      setStatus('error')
      setMessage(
        error instanceof Error ? error.message : 'Ocurrió un error inesperado.',
      )
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="importar-compras-titulo"
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-700">
              Compras por artículo
            </p>
            <h2
              id="importar-compras-titulo"
              className="mt-1 text-lg font-semibold tracking-tight text-slate-900"
            >
              Importar CSV de compras
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              El archivo se valida contra su renglón Total antes de cargarse en MySQL.
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            disabled={busy}
            className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
            aria-label="Cerrar"
          >
            <X className="size-4.5" />
          </button>
        </header>

        <form onSubmit={submit} className="space-y-4 px-6 py-5">
          <label
            htmlFor="archivo-compras"
            className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-7 text-center transition ${
              archivo
                ? 'border-brand-300 bg-brand-50/40'
                : 'border-slate-200 bg-slate-50/50 hover:border-brand-300 hover:bg-brand-50/30'
            }`}
          >
            <span className="grid size-10 place-items-center rounded-full bg-white text-brand-700 shadow-sm ring-1 ring-slate-200">
              {archivo ? (
                <FileSpreadsheet className="size-5" />
              ) : (
                <Upload className="size-5" />
              )}
            </span>
            <span className="text-sm font-medium text-slate-700">
              {archivo?.name ?? 'Selecciona un archivo .csv'}
            </span>
            <span className="text-[11px] text-slate-400">
              {archivo
                ? `${(archivo.size / 1024).toFixed(0)} KB · haz clic para cambiarlo`
                : 'Formato esperado: Fecha, Categoría, Fracción, Descripción, Cantidad, Importe, Precio y Proveedor'}
            </span>
            <input
              id="archivo-compras"
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              disabled={busy}
              onChange={(event) => {
                setArchivo(event.target.files?.[0] ?? null)
                event.target.value = ''
              }}
            />
          </label>

          <div>
            <p className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Modo de carga
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(['reemplazar', 'agregar'] as const).map((value) => {
                const activo = modo === value
                return (
                  <label
                    key={value}
                    className={`cursor-pointer rounded-lg border px-3 py-2 transition ${
                      activo
                        ? 'border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/15'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    } ${busy ? 'cursor-not-allowed opacity-60' : ''}`}
                  >
                    <input
                      type="radio"
                      name="modo-compras"
                      value={value}
                      checked={activo}
                      disabled={busy}
                      onChange={() => setModo(value)}
                      className="sr-only"
                    />
                    <span className="block text-xs font-semibold text-slate-800">
                      {value === 'reemplazar' ? 'Reemplazar' : 'Agregar'}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-slate-500">
                      {value === 'reemplazar'
                        ? 'Sustituye el contenido actual'
                        : 'Conserva las compras existentes'}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>

          {modo === 'reemplazar' ? (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-800">
              <AlertTriangle className="mr-1 inline size-3.5 align-text-bottom" />
              Se eliminarán las compras actuales de{' '}
              <code className="font-mono">compras_articulos</code> y se cargará
              únicamente el CSV seleccionado. La operación es transaccional.
            </p>
          ) : (
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-[11px] leading-relaxed text-slate-600">
              <Database className="mr-1 inline size-3.5 align-text-bottom text-slate-500" />
              Se añadirán las filas del CSV a las existentes. Los registros
              duplicados se conservan y no se deduplican.
            </p>
          )}

          {(busy || status !== 'idle') && (
            <div
              className={`rounded-xl border px-4 py-3 text-xs ${
                status === 'error'
                  ? 'border-rose-200 bg-rose-50 text-rose-800'
                  : status === 'ok'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-aqua-200 bg-aqua-50 text-aqua-800'
              }`}
            >
              <div className="flex items-center gap-2 font-medium">
                {busy && <Loader2 className="size-4 animate-spin" />}
                {status === 'ok' && <CheckCircle2 className="size-4" />}
                {status === 'error' && <AlertTriangle className="size-4" />}
                {status === 'importando' && 'Validando e insertando compras…'}
                {status === 'ok' && 'Importación completada'}
                {status === 'error' && 'No se pudo completar la importación'}
              </div>
              {message && <p className="mt-1 leading-relaxed">{message}</p>}
              {status === 'ok' && resultado && (
                <dl className="mt-2 space-y-1 border-t border-emerald-200/70 pt-2">
                  <SummaryRow
                    label="Filas insertadas"
                    value={formatNumber(resultado.filas_insertadas)}
                  />
                  <SummaryRow
                    label="Total en la tabla"
                    value={formatNumber(resultado.filas_totales_en_bd)}
                  />
                  <SummaryRow
                    label="Importe del CSV"
                    value={formatMxn(resultado.total_csv_mxn)}
                  />
                  <SummaryRow
                    label="Nacional"
                    value={`${formatNumber(resultado.nacional.registros)} · ${formatMxnCompact(resultado.nacional.importe_mxn)}`}
                  />
                  <SummaryRow
                    label="Internacional"
                    value={`${formatNumber(resultado.internacional.registros)} · ${formatMxnCompact(resultado.internacional.importe_mxn)}`}
                  />
                  <SummaryRow
                    label="Duplicados conservados"
                    value={formatNumber(resultado.duplicados_exactos)}
                  />
                  {resultado.fecha_min && resultado.fecha_max && (
                    <SummaryRow
                      label="Período"
                      value={`${formatDate(resultado.fecha_min)} — ${formatDate(resultado.fecha_max)}`}
                    />
                  )}
                  {resultado.copia && (
                    <SummaryRow label="Copia" value={resultado.copia} />
                  )}
                </dl>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={close}
              disabled={busy}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
            >
              {status === 'ok' ? 'Cerrar' : 'Cancelar'}
            </button>
            <button
              type="submit"
              disabled={!archivo || busy || status === 'ok'}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2 text-xs font-medium text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Database className="size-3.5" />
              )}
              {status === 'ok' ? 'Importación completada' : 'Importar compras'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="shrink-0 text-emerald-700/80">{label}</dt>
      <dd className="break-all text-right font-semibold tabular-nums">{value}</dd>
    </div>
  )
}
