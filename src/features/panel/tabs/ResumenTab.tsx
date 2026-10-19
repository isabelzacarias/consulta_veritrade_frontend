import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { Filters } from '../../../types/api'
import { api } from '../../../services/api'
import { ChartsSection } from '../ChartsSection'

export function ResumenTab({ filters }: { filters: Filters }) {
  const [soloPrincipales, setSoloPrincipales] = useState(true)

  const mensual = useQuery({
    queryKey: ['mensual', filters],
    queryFn: ({ signal }) => api.mensual(filters, signal),
    placeholderData: keepPreviousData,
  })

  const paises = useQuery({
    queryKey: ['paises-origen', filters],
    queryFn: ({ signal }) => api.paisesOrigen(filters, 6, signal),
    placeholderData: keepPreviousData,
  })

  const tipos = useQuery({
    queryKey: ['tipos-importacion', filters, soloPrincipales],
    queryFn: ({ signal }) =>
      api.tiposImportacion(filters, { top: 8, soloPrincipales }, signal),
    placeholderData: keepPreviousData,
  })

  const importadores = useQuery({
    queryKey: ['importadores', filters, 'valor_usd'],
    queryFn: ({ signal }) => api.importadores(filters, 6, 'valor_usd', signal),
    placeholderData: keepPreviousData,
  })

  return (
    <ChartsSection
      mensual={mensual}
      paises={paises}
      tipos={tipos}
      importadores={importadores}
      soloPrincipales={soloPrincipales}
      onSoloPrincipalesChange={setSoloPrincipales}
    />
  )
}
