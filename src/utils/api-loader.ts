import type { CrudApiModule } from '@/types/crud'

const REQUIRED = ['list', 'get', 'create', 'update', 'remove'] as const

/**
 * 预加载 @/api 下所有模块，按文件名解析
 * 例如 api="route" → @/api/route.ts
 */
const apiModules = import.meta.glob('@/api/*.ts', { eager: true }) as Record<string, CrudApiModule>

function resolveModule(name: string): CrudApiModule | undefined {
  const normalized = name
    .replace(/^@\/api\//, '')
    .replace(/\.ts$/, '')
    .replace(/^\//, '')

  const candidates = [
    `/src/api/${normalized}.ts`,
    `src/api/${normalized}.ts`,
    `@/api/${normalized}.ts`,
    `/api/${normalized}.ts`,
  ]

  for (const key of candidates) {
    if (apiModules[key]) return apiModules[key]
  }

  const matched = Object.entries(apiModules).find(([key]) =>
    key.replace(/\\/g, '/').endsWith(`/api/${normalized}.ts`),
  )
  return matched?.[1]
}

function assertCrudApi(name: string, mod: CrudApiModule | undefined): asserts mod is CrudApiModule {
  if (!mod) {
    const available = Object.keys(apiModules)
      .map((k) => k.replace(/\\/g, '/').split('/api/').pop())
      .join(', ')
    throw new Error(`[api-loader] 未找到 API 模块: @/api/${name}.ts（已加载: ${available}）`)
  }
  const missing = REQUIRED.filter((key) => typeof mod[key] !== 'function')
  if (missing.length) {
    throw new Error(
      `[api-loader] @/api/${name}.ts 缺少统一 CRUD 导出: ${missing.join(', ')}（须导出 list/get/create/update/remove）`,
    )
  }
}

/** 按模块名加载并校验 CRUD 约定 */
export function loadCrudApi(api: string): CrudApiModule {
  const mod = resolveModule(api)
  assertCrudApi(api, mod)
  return mod
}

export function listApiModuleNames(): string[] {
  return Object.keys(apiModules).map((k) => {
    const normalized = k.replace(/\\/g, '/')
    return normalized.split('/api/').pop()?.replace(/\.ts$/, '') ?? normalized
  })
}
