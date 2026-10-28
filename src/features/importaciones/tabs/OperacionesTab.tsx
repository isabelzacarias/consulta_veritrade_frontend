import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import type { Filters, Importacion } from '@/types/importaciones'
import { api } from '@/services/api'
import { ImportacionesSection } from '@/features/importaciones/components/ImportacionesSection'
import { ImportacionModal } from '@/features/importaciones/dialogs/ImportacionModal'

export function OperacionesTab({ filters }: { filters: Filters }) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [searchDraft, setSearchDraft] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Importacion | null>(null)

  const importaciones = useQuery({
    queryKey: ['importaciones', filters, page, pageSize, search],
    queryFn: ({ signal }) =>
      api.importaciones(
        { ...filters, page, page_size: pageSize, q: search },
        signal,
      ),
    placeholderData: keepPreviousData,
  })

  const applySearch = () => {
    setSearch(searchDraft.trim())
    setPage(1)
  }

  return (
    <>
      <ImportacionesSection
        query={importaciones}
        filters={filters}
        page={page}
        pageSize={pageSize}
        searchDraft={searchDraft}
        appliedSearch={search}
        isFetching={importaciones.isFetching}
        onSearchDraftChange={setSearchDraft}
        onSearch={applySearch}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setPage(1)
        }}
        onSelect={setSelected}
      />
      <ImportacionModal importacion={selected} onClose={() => setSelected(null)} />
    </>
  )
}
