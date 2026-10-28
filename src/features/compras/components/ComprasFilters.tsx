import { Search, SlidersHorizontal, X } from 'lucide-react'
import type { FormEvent } from 'react'
import type { ComprasFilters as Filters, ComprasMeta } from '@/types/compras'
import { SectionCard } from '@/components/ui/SectionCard'
import { Combobox2 } from '@/components/ui/Combobox2'

interface ComprasFiltersProps {
  draft: Filters
  onChange: (next: Filters) => void
  onApply: () => void
  onClear: () => void
  meta: ComprasMeta | undefined
  activeCount: number
  loading?: boolean
}

const inputClass =
  'h-9 w-full rounded-lg border border-brand-200/80 bg-white px-3 text-sm text-slate-800 shadow-xs outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400'

const labelClass =
  'mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-brand-700/70'

export function ComprasFilters({
  draft,
  onChange,
  onApply,
  onClear,
  meta,
  activeCount,
  loading = false,
}: ComprasFiltersProps) {
  const set = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    onChange({ ...draft, [key]: value || undefined })
  }

  const draftCount = Object.values(draft).filter(Boolean).length
  const sinFracciones = (meta?.fracciones.length ?? 0) === 0

  const submit = (event: FormEvent) => {
    event.preventDefault()
    onApply()
  }

  return (
    <SectionCard
      title="Filtros de compras"
      subtitle="Se aplican a los indicadores, gráficas, tabla y exportación."
      actions={
        <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50 px-2.5 py-1 text-[11px] font-medium text-brand-700">
          <SlidersHorizontal className="size-3" />
          {activeCount === 0
            ? 'Sin filtros activos'
            : `${activeCount} filtro${activeCount === 1 ? '' : 's'} activo${activeCount === 1 ? '' : 's'}`}
        </span>
      }
      bodyClassName="p-5"
    >
      <form onSubmit={submit}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-12">
          <div className="xl:col-span-2">
            <label htmlFor="compras-fecha-desde" className={labelClass}>
              Fecha desde
            </label>
            <input
              id="compras-fecha-desde"
              type="date"
              className={inputClass}
              value={draft.fecha_desde ?? ''}
              max={draft.fecha_hasta ?? meta?.fecha_max ?? undefined}
              min={meta?.fecha_min ?? undefined}
              onChange={(event) => set('fecha_desde', event.target.value)}
            />
          </div>

          <div className="xl:col-span-2">
            <label htmlFor="compras-fecha-hasta" className={labelClass}>
              Fecha hasta
            </label>
            <input
              id="compras-fecha-hasta"
              type="date"
              className={inputClass}
              value={draft.fecha_hasta ?? ''}
              min={draft.fecha_desde ?? meta?.fecha_min ?? undefined}
              max={meta?.fecha_max ?? undefined}
              onChange={(event) => set('fecha_hasta', event.target.value)}
            />
          </div>

          <div className="xl:col-span-2">
            <label htmlFor="compras-categoria" className={labelClass}>
              Categoría
            </label>
            <Combobox2
              id="compras-categoria"
              className={inputClass}
              value={draft.categoria ?? ''}
              onChange={(value) => set('categoria', value)}
              options={[
                { value: '', label: 'Todas las categorías' },
                ...(meta?.categorias ?? []).map((categoria) => ({
                  value: categoria,
                  label: categoria,
                })),
              ]}
              clearable
            />
          </div>

          <div className="xl:col-span-2">
            <label htmlFor="compras-ambito" className={labelClass}>
              Ámbito
            </label>
            <Combobox2
              id="compras-ambito"
              className={inputClass}
              value={draft.ambito ?? ''}
              onChange={(value) =>
                set('ambito', (value || undefined) as Filters['ambito'])
              }
              options={[
                { value: '', label: 'Nacional e internacional' },
                { value: 'nacional', label: 'Nacional' },
                { value: 'internacional', label: 'Internacional' },
              ]}
              clearable
            />
          </div>

          <div className="sm:col-span-2 xl:col-span-4">
            <label htmlFor="compras-proveedor" className={labelClass}>
              Proveedor
            </label>
            <input
              id="compras-proveedor"
              type="search"
              className={inputClass}
              placeholder="Buscar proveedor…"
              value={draft.proveedor ?? ''}
              onChange={(event) => set('proveedor', event.target.value)}
            />
          </div>

          <div className="sm:col-span-2 xl:col-span-4">
            <label htmlFor="compras-fraccion" className={labelClass}>
              Fracción arancelaria
            </label>
            <Combobox2
              id="compras-fraccion"
              className={inputClass}
              value={draft.fraccion ?? ''}
              onChange={(value) => set('fraccion', value)}
              disabled={sinFracciones}
              title={
                sinFracciones
                  ? 'Se habilitará cuando se capturen fracciones válidas en el CSV.'
                  : undefined
              }
              options={[
                {
                  value: '',
                  label: sinFracciones
                    ? 'Sin fracciones capturadas'
                    : 'Todas las fracciones',
                },
                ...(meta?.fracciones ?? []).map((fraccion) => ({
                  value: fraccion,
                  label: fraccion,
                })),
              ]}
              clearable
            />
          </div>

          <div className="sm:col-span-2 xl:col-span-4">
            <label htmlFor="compras-descripcion" className={labelClass}>
              Buscar artículo
            </label>
            <Combobox2
              id="compras-descripcion"
              className={inputClass}
              value={draft.descripcion ?? ''}
              onChange={(value) => set('descripcion', value)}
              options={[
                { value: '', label: 'Todos los artículos' },
                ...(meta?.descripciones ?? []).map((descripcion) => ({
                  value: descripcion,
                  label: descripcion,
                })),
              ]}
              placeholder="Seleccionar artículo..."
              emptyMessage="No hay artículos registrados"
              clearable
            />
          </div>

          <div className="flex items-end gap-2 sm:col-span-2 xl:col-span-4">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg bg-linear-to-r from-brand-700 to-brand-500 px-4 text-sm font-medium text-white shadow-md shadow-brand-900/20 transition hover:from-brand-800 hover:to-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Search className="size-4" />
              {loading ? 'Consultando…' : 'Aplicar filtros'}
            </button>
            <button
              type="button"
              onClick={onClear}
              disabled={draftCount === 0 && activeCount === 0}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-brand-200 bg-white px-3 text-sm font-medium text-brand-700 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <X className="size-4" />
              Borrar filtros
            </button>
          </div>
        </div>
      </form>
    </SectionCard>
  )
}
