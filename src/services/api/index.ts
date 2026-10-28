import { comprasApi } from './compras'
import { importacionesApi } from './importaciones'

export * from './client'
export { comprasApi, importacionesApi }

/**
 * Cliente único de la API. Agrupa los endpoints por dominio para que las
 * vistas sigan consumiendo `api.<metodo>()` sin conocer el módulo de origen.
 */
export const api = {
  ...importacionesApi,
  ...comprasApi,
}
