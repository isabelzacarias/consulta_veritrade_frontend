import type { Filters, PartidaMeta } from '@/types/importaciones'
import { formatDate } from '@/lib/format'
import {
  UnifiedFilterPanel,
  type UnifiedFilterChip,
  type UnifiedFilterField,
} from '@/components/ui/UnifiedFilterPanel'

interface FilterBarProps {
  draft: Filters
  filters: Filters
  onChange: (next: Filters) => void
  onApply: () => void
  onClear: () => void
  onRemoveFilter: (field: string, value?: string) => void
  aduanas: string[]
  paises: string[]
  partidas: PartidaMeta[]
  activeCount: number
  loading?: boolean
  dirty?: boolean
}

export function FilterBar({
  draft,
  filters,
  onChange,
  onApply,
  onClear,
  onRemoveFilter,
  aduanas,
  paises,
  partidas,
  activeCount,
  loading = false,
  dirty = false,
}: FilterBarProps) {
  const setMulti = (
    key: 'aduana' | 'pais_origen' | 'partida',
    values: string[],
  ) => {
    onChange({ ...draft, [key]: values.length > 0 ? values : undefined })
  }

  const setText = (key: 'importador' | 'exportador', value: string) => {
    onChange({ ...draft, [key]: value || undefined })
  }

  const fields: UnifiedFilterField[] = [
    {
      key: 'fecha_desde',
      label: 'Fecha desde',
      type: 'date',
      value: draft.fecha_desde ?? '',
      max: draft.fecha_hasta,
      onChange: (value) =>
        onChange({ ...draft, fecha_desde: (value as string) || undefined }),
    },
    {
      key: 'fecha_hasta',
      label: 'Fecha hasta',
      type: 'date',
      value: draft.fecha_hasta ?? '',
      min: draft.fecha_desde,
      onChange: (value) =>
        onChange({ ...draft, fecha_hasta: (value as string) || undefined }),
    },
    {
      key: 'aduana',
      label: 'Aduana',
      type: 'multiselect',
      value: draft.aduana ?? [],
      onChange: (value) => setMulti('aduana', value as string[]),
      options: aduanas.map((aduana) => ({ value: aduana, label: aduana })),
    },
    {
      key: 'pais_origen',
      label: 'País de origen',
      type: 'multiselect',
      value: draft.pais_origen ?? [],
      onChange: (value) => setMulti('pais_origen', value as string[]),
      options: paises.map((pais) => ({ value: pais, label: pais })),
    },
    {
      key: 'partida',
      label: 'Partida arancelaria',
      type: 'multiselect',
      value: draft.partida ?? [],
      onChange: (value) => setMulti('partida', value as string[]),
      options: partidas.map((partida) => ({
        value: partida.partida_arancelaria,
        label: partida.partida_arancelaria,
        description: partida.descripcion_partida ?? undefined,
      })),
    },
    {
      key: 'importador',
      label: 'Importador',
      type: 'text',
      value: draft.importador ?? '',
      placeholder: 'Buscar por nombre…',
      onChange: (value) => setText('importador', value as string),
    },
    {
      key: 'exportador',
      label: 'Exportador / proveedor',
      type: 'text',
      value: draft.exportador ?? '',
      placeholder: 'Buscar por nombre…',
      onChange: (value) => setText('exportador', value as string),
    },
  ]

  const chips: UnifiedFilterChip[] = []
  if (filters.fecha_desde) {
    chips.push({
      id: 'fecha_desde',
      field: 'fecha_desde',
      label: 'Desde',
      value: formatDate(filters.fecha_desde),
    })
  }
  if (filters.fecha_hasta) {
    chips.push({
      id: 'fecha_hasta',
      field: 'fecha_hasta',
      label: 'Hasta',
      value: formatDate(filters.fecha_hasta),
    })
  }
  for (const aduana of filters.aduana ?? []) {
    chips.push({
      id: `aduana-${aduana}`,
      field: 'aduana',
      label: 'Aduana',
      value: aduana,
      optionValue: aduana,
    })
  }
  for (const pais of filters.pais_origen ?? []) {
    chips.push({
      id: `pais_origen-${pais}`,
      field: 'pais_origen',
      label: 'País',
      value: pais,
      optionValue: pais,
    })
  }
  for (const partida of filters.partida ?? []) {
    const meta = partidas.find(
      (item) => item.partida_arancelaria === partida,
    )
    chips.push({
      id: `partida-${partida}`,
      field: 'partida',
      label: 'Partida',
      value: meta?.descripcion_partida
        ? `${partida} · ${meta.descripcion_partida}`
        : partida,
      optionValue: partida,
    })
  }
  if (filters.importador) {
    chips.push({
      id: 'importador',
      field: 'importador',
      label: 'Importador',
      value: filters.importador,
    })
  }
  if (filters.exportador) {
    chips.push({
      id: 'exportador',
      field: 'exportador',
      label: 'Exportador',
      value: filters.exportador,
    })
  }

  return (
    <UnifiedFilterPanel
      title="Filtros de consulta"
      subtitle="Se aplican a los indicadores, gráficas, rankings y a la tabla de operaciones."
      fields={fields}
      chips={chips}
      activeCount={activeCount}
      onApply={onApply}
      onClear={onClear}
      onRemoveFilter={onRemoveFilter}
      loading={loading}
      dirty={dirty}
    />
  )
}
