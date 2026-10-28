import { Search, SlidersHorizontal, X } from 'lucide-react'
import type { FormEvent } from 'react'
import type { Filters, PartidaMeta } from '@/types/importaciones'
import { SectionCard } from '@/components/ui/SectionCard'
import { Combobox2 } from '@/components/ui/Combobox2'

interface FilterBarProps {
  draft: Filters
  onChange: (next: Filters) => void
  onApply: () => void
  onClear: () => void
  aduanas: string[]
  paises: string[]
  partidas: PartidaMeta[]
  activeCount: number
  loading?: boolean
}

const inputClass =
  'h-9 w-full rounded-lg border border-brand-200/80 bg-white px-3 text-sm text-slate-800 shadow-xs outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 disabled:cursor-not-allowed disabled:bg-slate-50'

const labelClass = 'mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-brand-700/70'

export function FilterBar({
  draft,
  onChange,
  onApply,
  onClear,
  aduanas,
  paises,
  partidas,
  activeCount,
  loading = false,
}: FilterBarProps) {
  const set = (key: keyof Filters, value: string) => {
    onChange({ ...draft, [key]: value || undefined })
  }

  const draftCount = Object.values(draft).filter(Boolean).length

  const submit = (event: FormEvent) => {
    event.preventDefault()
    onApply()
  }

  return (
    <SectionCard
      title="Filtros de consulta"
      subtitle="Se aplican a los indicadores, gráficas, rankings y a la tabla de operaciones."
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
            <label htmlFor="fecha-desde" className={labelClass}>
              Fecha desde
            </label>
            <input
              id="fecha-desde"
              type="date"
              className={inputClass}
              value={draft.fecha_desde ?? ''}
              max={draft.fecha_hasta}
              onChange={(event) => set('fecha_desde', event.target.value)}
            />
          </div>

          <div className="xl:col-span-2">
            <label htmlFor="fecha-hasta" className={labelClass}>
              Fecha hasta
            </label>
            <input
              id="fecha-hasta"
              type="date"
              className={inputClass}
              value={draft.fecha_hasta ?? ''}
              min={draft.fecha_desde}
              onChange={(event) => set('fecha_hasta', event.target.value)}
            />
          </div>

          <div className="xl:col-span-2">
            <label htmlFor="aduana" className={labelClass}>
              Aduana
            </label>
            <Combobox2
              id="aduana"
              className={inputClass}
              value={draft.aduana ?? ''}
              onChange={(value) => set('aduana', value)}
              options={[
                { value: '', label: 'Todas las aduanas' },
                ...aduanas.map((aduana) => ({ value: aduana, label: aduana })),
              ]}
              clearable
            />
          </div>

          <div className="xl:col-span-2">
            <label htmlFor="pais" className={labelClass}>
              País de origen
            </label>
            <Combobox2
              id="pais"
              className={inputClass}
              value={draft.pais_origen ?? ''}
              onChange={(value) => set('pais_origen', value)}
              options={[
                { value: '', label: 'Todos los países' },
                ...paises.map((pais) => ({ value: pais, label: pais })),
              ]}
              clearable
            />
          </div>

          <div className="sm:col-span-2 xl:col-span-4">
            <label htmlFor="partida" className={labelClass}>
              Partida arancelaria
            </label>
            <Combobox2
              id="partida"
              className={inputClass}
              value={draft.partida ?? ''}
              onChange={(value) => set('partida', value)}
              options={[
                { value: '', label: 'Todas las partidas' },
                ...partidas.map((partida) => ({
                  value: partida.partida_arancelaria,
                  label: partida.descripcion_partida
                    ? `${partida.partida_arancelaria} · ${partida.descripcion_partida}`
                    : partida.partida_arancelaria,
                })),
              ]}
              clearable
            />
          </div>

          <div className="sm:col-span-2 xl:col-span-4">
            <label htmlFor="importador" className={labelClass}>
              Importador
            </label>
            <input
              id="importador"
              type="search"
              className={inputClass}
              placeholder="Buscar por nombre…"
              value={draft.importador ?? ''}
              onChange={(event) => set('importador', event.target.value)}
            />
          </div>

          <div className="sm:col-span-2 xl:col-span-4">
            <label htmlFor="exportador" className={labelClass}>
              Exportador / proveedor
            </label>
            <input
              id="exportador"
              type="search"
              className={inputClass}
              placeholder="Buscar por nombre…"
              value={draft.exportador ?? ''}
              onChange={(event) => set('exportador', event.target.value)}
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
              disabled={draftCount === 0}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-brand-200 bg-white px-3 text-sm font-medium text-brand-700 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <X className="size-4" />
              Limpiar
            </button>
          </div>
        </div>
      </form>
    </SectionCard>
  )
}
