import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import {
  Building2,
  CalendarDays,
  MapPin,
  Package,
  ReceiptText,
  Ship,
  X,
  type LucideIcon,
} from 'lucide-react'
import type { Importacion } from '../../types/api'
import {
  formatDate,
  formatDecimal,
  formatKg,
  formatNumber,
  formatUsd,
  formatUsdDetailed,
} from '../../lib/format'

interface ImportacionModalProps {
  importacion: Importacion | null
  onClose: () => void
}

export function ImportacionModal({
  importacion,
  onClose,
}: ImportacionModalProps) {
  useEffect(() => {
    if (!importacion) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [importacion, onClose])

  if (!importacion) return null

  const item = importacion

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="detalle-titulo"
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-700">
              Detalle de operación #{formatNumber(item.id)}
            </p>
            <h2
              id="detalle-titulo"
              className="mt-1 truncate text-lg font-semibold tracking-tight text-slate-900"
            >
              {item.descripcion_comercial ?? item.descripcion_partida ?? 'Importación'}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-mono text-[11px] text-slate-600">
                {item.partida_arancelaria}
              </span>
              {item.tipo_importacion && (
                <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-medium text-brand-700">
                  {item.tipo_importacion}
                </span>
              )}
              {item.es_cancun === 1 && (
                <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-700">
                  Cancún
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Cerrar detalle"
          >
            <X className="size-4.5" />
          </button>
        </header>

        <div className="space-y-6 overflow-y-auto px-6 py-5">
          <section className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Metric label="Valor total" value={formatUsd(item.valor_total_usd)} />
              <Metric label="Volumen" value={formatKg(item.qty1)} />
              <Metric
                label="Costo por kg"
                value={formatUsdDetailed(item.costo_unitario_kg)}
              />
              <Metric label="Fecha" value={formatDate(item.fecha)} />
            </div>
          </section>

          <DataGroup icon={ReceiptText} title="Datos de la operación">
            <Field label="Aduana" value={item.aduana} />
            <Field label="DUA" value={item.dua} />
            <Field label="Número de serie" value={item.numero_serie} />
            <Field label="Código tributario" value={item.codigo_tributario} />
            <Field label="Régimen" value={item.regimen} />
            <Field label="Vía" value={item.via} />
            <Field label="Año" value={item.anio} />
            <Field label="Mes" value={item.mes} />
          </DataGroup>

          <DataGroup icon={Building2} title="Importador">
            <Field label="Razón social" value={item.importador} />
            <Field label="Ciudad" value={item.ciudad_importador} />
            <Field label="Estado" value={item.estado_importador} />
            <Field label="Dirección" value={item.direccion_importador} wide />
          </DataGroup>

          <DataGroup icon={Ship} title="Exportador / proveedor">
            <Field label="Razón social" value={item.exportador} />
            <Field label="Ciudad" value={item.ciudad_exportador} />
            <Field label="Dirección" value={item.direccion_exportador} wide />
          </DataGroup>

          <DataGroup icon={MapPin} title="Origen y producto">
            <Field label="País de origen" value={item.pais_origen} />
            <Field label="País de compra" value={item.pais_compra} />
            <Field
              label="Partida arancelaria"
              value={<span className="font-mono">{item.partida_arancelaria}</span>}
            />
            <Field label="Descripción de partida" value={item.descripcion_partida} wide />
          </DataGroup>

          <DataGroup icon={Package} title="Cantidades y valores">
            <Field
              label="Cantidad 1"
              value={
                item.qty1 == null
                  ? '—'
                  : `${formatDecimal(item.qty1)} ${item.und1 ?? 'kg'}`.trim()
              }
            />
            <Field
              label="Cantidad 2"
              value={
                item.qty2 == null
                  ? '—'
                  : `${formatDecimal(item.qty2)} ${item.und2 ?? ''}`.trim()
              }
            />
            <Field label="Valor unitario 1" value={formatUsdDetailed(item.valor_unit1_usd)} />
            <Field label="Valor unitario 2" value={formatUsdDetailed(item.valor_unit2_usd)} />
            <Field label="Valor total USD" value={formatUsd(item.valor_total_usd)} />
            <Field
              label="Costo unitario kg"
              value={formatUsdDetailed(item.costo_unitario_kg)}
            />
          </DataGroup>

          {item.descripcion_comercial && (
            <section>
              <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <CalendarDays className="size-3.5" />
                Descripción comercial
              </h3>
              <p className="rounded-xl border border-slate-200/80 bg-white p-4 text-sm leading-relaxed text-slate-700">
                {item.descripcion_comercial}
              </p>
            </section>
          )}
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white transition hover:bg-slate-800"
          >
            Cerrar
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  )
}

function Metric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-slate-900 tabular-nums">{value}</p>
    </div>
  )
}

function DataGroup({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon
  title: string
  children: ReactNode
}) {
  return (
    <section>
      <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <Icon className="size-3.5" />
        {title}
      </h3>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
        {children}
      </dl>
    </section>
  )
}

function Field({
  label,
  value,
  wide = false,
}: {
  label: string
  value: ReactNode
  wide?: boolean
}) {
  const display =
    value === null || value === undefined || value === '' ? '—' : value

  return (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm break-words text-slate-700">{display}</dd>
    </div>
  )
}
