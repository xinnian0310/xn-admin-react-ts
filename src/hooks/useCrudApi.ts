import { createContext, useContext } from 'react'
import type { CrudApiModule } from '@/types/crud'

export const CrudApiContext = createContext<CrudApiModule | null>(null)

export function useCrudApi(): CrudApiModule {
  const api = useContext(CrudApiContext)
  if (!api) {
    throw new Error('[useCrudApi] 未注入 crudApi，请在 XnTable 上配置 api')
  }
  return api
}
