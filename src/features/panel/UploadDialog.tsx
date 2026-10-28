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
import type { Job } from '../../types/api'
import { api } from '../../services/api'
import { formatNumber } from '../../lib/format'

interface UploadDialogProps {
  open: boolean
  onClose: () => void
  onLoaded: () => void
}

type Status = 'idle' | 'procesando' | 'cargando' | 'ok' | 'error'
type ModoCarga = 'agregar' | 'reemplazar'

export function UploadDialog({ open, onClose, onLoaded }: UploadDialogProps) {
  const [files, setFiles] = useState<File[]>([])
  const [hoja, setHoja] = useState('Veritrade')
  const [filaHeader, setFilaHeader] = useState(5)
  const [modo, setModo] = useState<ModoCarga>('agregar')
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState<string | null>(null)
  const [proceso, setProceso] = useState<Job | null>(null)
  const [carga, setCarga] = useState<Job | null>(null)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && status !== 'procesando' && status !== 'cargando') {
        onClose()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, status, onClose])

  if (!open) return null

  const busy = status === 'procesando' || status === 'cargando'

  const reset = () => {
    setFiles([])
    setModo('agregar')
    setStatus('idle')
    setMessage(null)
    setProceso(null)
    setCarga(null)
  }

  const close = () => {
    if (busy) return
    reset()
    onClose()
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (files.length === 0) return

    setStatus('procesando')
    setMessage(null)
    setProceso(null)
    setCarga(null)

    try {
      const jobProceso = await api.subirExcels(files, { hoja, filaHeader })
      setProceso(jobProceso)

      if (jobProceso.estado === 'error') {
        setStatus('error')
        setMessage(jobProceso.mensaje ?? 'El backend no pudo procesar los archivos.')
        return
      }

      setStatus('cargando')
      const jobCarga = await api.cargarEnMysql(modo)
      setCarga(jobCarga)

      if (jobCarga.estado === 'error') {
        setStatus('error')
        setMessage(jobCarga.mensaje ?? 'El backend no pudo cargar los datos en MySQL.')
        return
      }

      setStatus('ok')
      setMessage(
        modo === 'agregar'
          ? 'Datos procesados y agregados a MySQL correctamente.'
          : 'Datos procesados y cargados en MySQL correctamente.',
      )
      onLoaded()
    } catch (error) {
      setStatus('error')
      setMessage(
        error instanceof Error ? error.message : 'Ocurrió un error inesperado.',
      )
    }
  }

  const filasEntrada = numberFrom(proceso?.detalle?.filas_entrada)
  const filasLimpias = numberFrom(proceso?.detalle?.filas_limpias)
  const columnas = numberFrom(proceso?.detalle?.columnas)
  const filasInsertadas = numberFrom(carga?.detalle?.filas_insertadas)
  const filasTotales = numberFrom(carga?.detalle?.filas_totales_en_bd)
  const copia = stringFrom(carga?.detalle?.copia)
  const copiaError = stringFrom(carga?.detalle?.copia_error)
  const archivosProcesados = Array.isArray(proceso?.detalle?.archivos)
    ? proceso.detalle.archivos.length
    : files.length
  const totalKb = files.reduce((total, item) => total + item.size, 0) / 1024

  const agregarArchivos = (seleccionados: FileList | null) => {
    if (!seleccionados?.length) return
    setFiles((actuales) => {
      const existentes = new Set(actuales.map(fileKey))
      const nuevos = Array.from(seleccionados).filter(
        (item) => !existentes.has(fileKey(item)),
      )
      return [...actuales, ...nuevos]
    })
  }

  const quitarArchivo = (indice: number) => {
    setFiles((actuales) => actuales.filter((_, posicion) => posicion !== indice))
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
        aria-labelledby="importar-titulo"
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-700">
              Procesamiento de datos
            </p>
            <h2
              id="importar-titulo"
              className="mt-1 text-lg font-semibold tracking-tight text-slate-900"
            >
              Importar Excel de Veritrade
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {modo === 'agregar'
                ? 'Limpia los archivos y agrega los registros a la tabla de importaciones.'
                : 'Limpia los archivos y reemplaza el contenido de la tabla de importaciones.'}
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
            htmlFor="archivos"
            className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-7 text-center transition ${
              files.length > 0
                ? 'border-brand-300 bg-brand-50/40'
                : 'border-slate-200 bg-slate-50/50 hover:border-brand-300 hover:bg-brand-50/30'
            }`}
          >
            <span className="grid size-10 place-items-center rounded-full bg-white text-brand-700 shadow-sm ring-1 ring-slate-200">
              {files.length > 0 ? (
                <FileSpreadsheet className="size-5" />
              ) : (
                <Upload className="size-5" />
              )}
            </span>
            <span className="text-sm font-medium text-slate-700">
              {files.length > 1
                ? `${files.length} archivos seleccionados`
                : files[0]?.name ?? 'Selecciona uno o varios archivos .xlsx'}
            </span>
            <span className="text-[11px] text-slate-400">
              {files.length > 0
                ? `${totalKb.toFixed(0)} KB en total · haz clic para agregar más`
                : 'Puedes seleccionar varios archivos a la vez'}
            </span>
            <input
              id="archivos"
              type="file"
              accept=".xlsx,.xls"
              multiple
              className="sr-only"
              disabled={busy}
              onChange={(event) => {
                agregarArchivos(event.target.files)
                event.target.value = ''
              }}
            />
          </label>

          {files.length > 0 && (
            <ul className="max-h-32 space-y-1 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50/60 p-2">
              {files.map((item, indice) => (
                <li
                  key={fileKey(item)}
                  className="flex items-center gap-2 rounded-md bg-white px-2 py-1.5 text-xs text-slate-700"
                >
                  <FileSpreadsheet className="size-3.5 shrink-0 text-brand-700" />
                  <span className="min-w-0 flex-1 truncate" title={item.name}>
                    {item.name}
                  </span>
                  <span className="shrink-0 tabular-nums text-slate-400">
                    {(item.size / 1024).toFixed(0)} KB
                  </span>
                  <button
                    type="button"
                    onClick={() => quitarArchivo(indice)}
                    disabled={busy}
                    className="grid size-6 shrink-0 place-items-center rounded text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                    aria-label={`Quitar ${item.name}`}
                  >
                    <X className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="hoja"
                className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500"
              >
                Hoja
              </label>
              <input
                id="hoja"
                value={hoja}
                onChange={(event) => setHoja(event.target.value)}
                disabled={busy}
                className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 disabled:bg-slate-50"
              />
            </div>
            <div>
              <label
                htmlFor="fila-header"
                className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500"
              >
                Fila de encabezado
              </label>
              <input
                id="fila-header"
                type="number"
                min={0}
                value={filaHeader}
                onChange={(event) => setFilaHeader(Number(event.target.value))}
                disabled={busy}
                className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 disabled:bg-slate-50"
              />
            </div>
          </div>

          <div>
            <p className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Modo de carga
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(['agregar', 'reemplazar'] as const).map((value) => {
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
                      name="modo-carga"
                      value={value}
                      checked={activo}
                      disabled={busy}
                      onChange={() => setModo(value)}
                      className="sr-only"
                    />
                    <span className="block text-xs font-semibold text-slate-800">
                      {value === 'agregar' ? 'Agregar' : 'Reemplazar'}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-slate-500">
                      {value === 'agregar'
                        ? 'Conserva los datos actuales'
                        : 'Reemplaza con los archivos'}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>

          {modo === 'reemplazar' ? (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-800">
              <AlertTriangle className="mr-1 inline size-3.5 align-text-bottom" />
              Se eliminarán los registros actuales de{' '}
              <code className="font-mono">importaciones</code> y se cargarán únicamente
              los archivos seleccionados. La operación es transaccional.
            </p>
          ) : (
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-[11px] leading-relaxed text-slate-600">
              <Database className="mr-1 inline size-3.5 align-text-bottom text-slate-500" />
              Se añadirán los registros de los archivos a los existentes. Si vuelves a
              subir un archivo ya cargado, sus filas se duplicarán.
            </p>
          )}

          {(busy || status === 'ok' || status === 'error') && (
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
                {status === 'procesando' && 'Limpiando y procesando los Excel…'}
                {status === 'cargando' && 'Insertando registros en MySQL…'}
                {status === 'ok' && 'Importación completada'}
                {status === 'error' && 'No se pudo completar la importación'}
              </div>
              {message && <p className="mt-1 leading-relaxed">{message}</p>}
              {status === 'ok' && (
                <dl className="mt-2 space-y-1 border-t border-emerald-200/70 pt-2">
                  <SummaryRow
                    label="Archivos"
                    value={formatNumber(archivosProcesados)}
                  />
                  {filasEntrada != null && (
                    <SummaryRow label="Filas leídas" value={formatNumber(filasEntrada)} />
                  )}
                  {filasLimpias != null && (
                    <SummaryRow label="Filas limpias" value={formatNumber(filasLimpias)} />
                  )}
                  {columnas != null && (
                    <SummaryRow label="Columnas" value={formatNumber(columnas)} />
                  )}
                  {filasInsertadas != null && (
                    <SummaryRow label="Insertadas" value={formatNumber(filasInsertadas)} />
                  )}
                  {filasTotales != null && (
                    <SummaryRow
                      label="Total en la tabla"
                      value={formatNumber(filasTotales)}
                    />
                  )}
                  {copia && <SummaryRow label="Copia" value={copia} />}
                </dl>
              )}
              {status === 'ok' && copiaError && (
                <p className="mt-2 border-t border-emerald-200/70 pt-2 leading-relaxed text-amber-800">
                  No se pudo guardar la copia: {copiaError}
                </p>
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
              disabled={files.length === 0 || busy || status === 'ok'}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2 text-xs font-medium text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Database className="size-3.5" />
              )}
              {status === 'ok'
                ? 'Importación completada'
                : modo === 'agregar'
                  ? 'Procesar y agregar'
                  : 'Procesar y reemplazar'}
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

function fileKey(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`
}

function numberFrom(value: unknown): number | null {
  return typeof value === 'number' ? value : null
}

function stringFrom(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}
