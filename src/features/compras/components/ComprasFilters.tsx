import type { ComprasFilters as Filters, ComprasMeta } from '@/types/compras'
import { formatDate } from '@/lib/format'
import {
  UnifiedFilterPanel,
  type UnifiedFilterChip,
  type UnifiedFilterField,
} from '@/components/ui/UnifiedFilterPanel'

interface ComprasFiltersProps {
  draft: Filters
  filters: Filters
  onChange: (next: Filters) => void
  onApply: () => void
  onClear: () => void
  onRemoveFilter: (field: string, value?: string) => void
  meta: ComprasMeta | undefined
  activeCount: number
  loading?: boolean
  dirty?: boolean
}

export function ComprasFilters({
  draft,
  filters,
  onChange,
  onApply,
  onClear,
  onRemoveFilter,
  meta,
  activeCount,
  loading = false,
  dirty = false,
}: ComprasFiltersProps) {
  const setMulti = (
    key: 'categoria' | 'proveedor' | 'descripcion' | 'fraccion',
    values: string[],
  ) => {
    onChange({ ...draft, [key]: values.length > 0 ? values : undefined })
  }

  const setAmbito = (values: string[]) => {
    onChange({
      ...draft,
      ambito:
        values.length > 0 ? (values as Filters['ambito']) : undefined,
    })
  }

  const sinFracciones = (meta?.fracciones.length ?? 0) === 0
  const sinProveedores = (meta?.proveedores.length ?? 0) === 0

  const fields: UnifiedFilterField[] = [
    {
      key: 'fecha_desde',
      label: 'Fecha desde',
      type: 'date',
      value: draft.fecha_desde ?? '',
      min: meta?.fecha_min ?? undefined,
      max: draft.fecha_hasta ?? meta?.fecha_max ?? undefined,
      onChange: (value) =>
        onChange({ ...draft, fecha_desde: (value as string) || undefined }),
    },
    {
      key: 'fecha_hasta',
      label: 'Fecha hasta',
      type: 'date',
      value: draft.fecha_hasta ?? '',
      min: draft.fecha_desde ?? meta?.fecha_min ?? undefined,
      max: meta?.fecha_max ?? undefined,
      onChange: (value) =>
        onChange({ ...draft, fecha_hasta: (value as string) || undefined }),
    },
    {
      key: 'q',
      label: 'Buscar',
      type: 'text',
      value: draft.q ?? '',
      placeholder: 'Artículo, proveedor o fracción…',
      onChange: (value) =>
        onChange({ ...draft, q: (value as string) || undefined }),
    },
    {
      key: 'categoria',
      label: 'Categoría',
      type: 'multiselect',
      value: draft.categoria ?? [],
      onChange: (value) => setMulti('categoria', value as string[]),
      options: (meta?.categorias ?? []).map((categoria) => ({
        value: categoria,
        label: categoria,
      })),
    },
    {
      key: 'descripcion',
      label: 'Artículo',
      type: 'multiselect',
      value: draft.descripcion ?? [],
      onChange: (value) => setMulti('descripcion', value as string[]),
      options: (meta?.descripciones ?? []).map((descripcion) => ({
        value: descripcion,
        label: descripcion,
      })),
    },
    {
      key: 'proveedor',
      label: 'Proveedor',
      type: 'multiselect',
      value: draft.proveedor ?? [],
      onChange: (value) => setMulti('proveedor', value as string[]),
      options: (meta?.proveedores ?? []).map((proveedor) => ({
        value: proveedor,
        label: proveedor,
      })),
      disabled: sinProveedores,
      title: sinProveedores
        ? 'Se habilitará cuando existan proveedores cargados.'
        : undefined,
    },
    {
      key: 'fraccion',
      label: 'Fracción arancelaria',
      type: 'multiselect',
      value: draft.fraccion ?? [],
      onChange: (value) => setMulti('fraccion', value as string[]),
      options: (meta?.fracciones ?? []).map((fraccion) => ({
        value: fraccion,
        label: fraccion,
      })),
      disabled: sinFracciones,
      title: sinFracciones
        ? 'Se habilitará cuando se capturen fracciones válidas en el CSV.'
        : undefined,
    },
    {
      key: 'ambito',
      label: 'Ámbito',
      type: 'multiselect',
      value: draft.ambito ?? [],
      onChange: (value) => setAmbito(value as string[]),
      options: [
        { value: 'nacional', label: 'Nacional' },
        { value: 'internacional', label: 'Internacional' },
      ],
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
  for (const categoria of filters.categoria ?? []) {
    chips.push({
      id: `categoria-${categoria}`,
      field: 'categoria',
      label: 'Categoría',
      value: categoria,
      optionValue: categoria,
    })
  }
  for (const proveedor of filters.proveedor ?? []) {
    chips.push({
      id: `proveedor-${proveedor}`,
      field: 'proveedor',
      label: 'Proveedor',
      value: proveedor,
      optionValue: proveedor,
    })
  }
  for (const descripcion of filters.descripcion ?? []) {
    chips.push({
      id: `descripcion-${descripcion}`,
      field: 'descripcion',
      label: 'Artículo',
      value: descripcion,
      optionValue: descripcion,
    })
  }
  for (const ambito of filters.ambito ?? []) {
    chips.push({
      id: `ambito-${ambito}`,
      field: 'ambito',
      label: 'Ámbito',
      value: ambito === 'nacional' ? 'Nacional' : 'Internacional',
      optionValue: ambito,
    })
  }
  for (const fraccion of filters.fraccion ?? []) {
    chips.push({
      id: `fraccion-${fraccion}`,
      field: 'fraccion',
      label: 'Fracción',
      value: fraccion,
      optionValue: fraccion,
    })
  }
  if (filters.q) {
    chips.push({
      id: 'q',
      field: 'q',
      label: 'Búsqueda',
      value: filters.q,
    })
  }

  return (
    <UnifiedFilterPanel
      title="Filtros de compras"
      subtitle="Se aplican a los indicadores, gráficas, tabla y exportación."
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
