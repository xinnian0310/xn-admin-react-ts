/** 路由路径与 views 目录映射工具 */

/** 规范化访问路径：补全前导 /，去除首尾空白与重复斜杠 */
export function normalizeRoutePath(routePath: string): string {
  const raw = routePath.trim().replace(/\\/g, '/')
  if (!raw) return ''
  const cleaned = raw.replace(/\/+/g, '/').replace(/\/$/, '')
  return cleaned.startsWith('/') ? cleaned : `/${cleaned}`
}

/** /system/roles -> system/roles */
export function pathToViewDir(routePath: string): string {
  return normalizeRoutePath(routePath).replace(/^\//, '')
}

/** /system/roles -> system/roles/index */
export function pathToIndexView(routePath: string): string {
  return `${pathToViewDir(routePath)}/index`
}

/** /system/roles -> system/roles/save */
export function pathToSaveView(routePath: string): string {
  return `${pathToViewDir(routePath)}/save`
}

/** system/roles -> /system/roles */
export function viewDirToPath(viewPath: string): string {
  return normalizeRoutePath(viewPath.replace(/\/index$|\/save$/, ''))
}

/** 根据访问路径自动生成视图目录 */
export function autoViewPath(routePath: string): string {
  return pathToViewDir(routePath)
}

/** save 页路由：/users -> /users/save, /users/save/1 */
export function saveRoutePath(basePath: string, id?: number | string | null): string {
  const base = normalizeRoutePath(basePath).replace(/\/$/, '')
  if (id === undefined || id === null || id === '') {
    return `${base}/save`
  }
  return `${base}/save/${id}`
}
