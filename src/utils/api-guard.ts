export interface ApiSignature {
  method: string
  path: string
}

interface CompiledApi {
  method: string
  re: RegExp
}

/** 不受接口守卫约束的路径（登录、注册表本身） */
const WHITELIST = new Set([
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/captcha',
  '/api/auth/captcha/slider',
  '/api/auth/api-registry',
  '/api/login-page-configs/active',
  '/api/system-config/public',
  '/api/site-contact/public',
  '/api/site-ui-shots/public',
])

let compiledApis: CompiledApi[] = []
let definedCodes = new Set<string>()
let loaded = false

/** 将 /api/users/{id} 编译为正则 ^/api/users/[^/]+$ */
function toRegex(path: string): RegExp {
  const segments = path.split(/\{[^/}]+\}/)
  const escaped = segments.map((seg) => seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[^/]+')
  return new RegExp(`^${escaped}$`)
}

export function setApiRegistry(data: { apis: ApiSignature[]; codes: string[] }) {
  compiledApis = (data.apis ?? []).map((api) => ({
    method: (api.method ?? '').toUpperCase(),
    re: toRegex(api.path),
  }))
  definedCodes = new Set(data.codes ?? [])
  loaded = true
}

export function clearApiRegistry() {
  compiledApis = []
  definedCodes = new Set()
  loaded = false
}

export function isRegistryLoaded() {
  return loaded
}

export function isWhitelisted(fullPath: string) {
  return WHITELIST.has(fullPath)
}

export function isApiRegistered(method: string, fullPath: string) {
  const upper = method.toUpperCase()
  return compiledApis.some((api) => api.method === upper && api.re.test(fullPath))
}

export function isCodeDefined(code: string) {
  return definedCodes.has(code)
}
