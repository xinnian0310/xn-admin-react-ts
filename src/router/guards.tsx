import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Spin } from 'antd'
import { useUserStore } from '@/stores/user'
import { usePermissionStore } from '@/stores/permission'
import { useMenuStore } from '@/stores/menu'
import { useTagsViewStore } from '@/stores/tagsView'
import { registerDynamicRoutes } from '@/utils/route-register'
import { setNavigate } from '@/utils/history'
import type { AppRouteMeta } from '@/types/menu'

const ERROR_PATHS = new Set(['/403', '/404', '/503'])

/** 注入 history navigate，供 axios / session-guard 使用 */
export function NavigateBinder() {
  const navigate = useNavigate()
  useEffect(() => {
    setNavigate(navigate)
  }, [navigate])
  return null
}

/** 同步 tagsView */
export function TagsViewSync({
  title,
  name,
  affix,
  noCache,
  isPublic,
}: {
  title?: string
  name?: string
  affix?: boolean
  noCache?: boolean
  isPublic?: boolean
}) {
  const location = useLocation()
  const initTags = useTagsViewStore((s) => s.initTags)
  const addView = useTagsViewStore((s) => s.addView)

  useEffect(() => {
    initTags()
    addView({
      path: location.pathname,
      name,
      title: title || '',
      affix,
      noCache,
      public: isPublic,
    })
  }, [location.pathname, title, name, affix, noCache, isPublic, initTags, addView])

  return null
}

/** 鉴权 + 动态路由注册 + 权限校验 */
export function AuthGuard({ meta, children }: { meta?: AppRouteMeta; children?: ReactNode }) {
  const location = useLocation()
  const token = useUserStore((s) => s.token)
  const mustChangePassword = useUserStore((s) => !!s.user?.mustChangePassword)
  const [ready, setReady] = useState(false)
  const [forbidden, setForbidden] = useState(false)
  const [toLogin, setToLogin] = useState(false)
  const [forcePwd, setForcePwd] = useState(false)

  useEffect(() => {
    let alive = true

    async function run() {
      if (!meta?.public && !token) {
        if (alive) {
          setReady(false)
          setForbidden(false)
          setForcePwd(false)
          setToLogin(true)
        }
        return
      }

      if (token && mustChangePassword) {
        const path = location.pathname
        if (path !== '/profile' && path !== '/login' && !ERROR_PATHS.has(path)) {
          if (alive) {
            setReady(false)
            setToLogin(false)
            setForbidden(false)
            setForcePwd(true)
          }
          return
        }
      }

      if (!meta?.public && token && !useMenuStore.getState().routesRegistered) {
        if (alive) setReady(false)
        await registerDynamicRoutes()
        if (!alive) return
      }

      if (ERROR_PATHS.has(location.pathname)) {
        if (alive) {
          setToLogin(false)
          setForbidden(false)
          setForcePwd(false)
          setReady(true)
        }
        return
      }

      if (meta?.permission) {
        const permissionStore = usePermissionStore.getState()
        const currentUser = useUserStore.getState().user
        const needsRefresh =
          !permissionStore.isSuperAdmin() &&
          (!permissionStore.permissions.length ||
            !currentUser?.roles?.length ||
            !currentUser?.permissions?.length)
        if (needsRefresh && token) {
          try {
            if (alive) setReady(false)
            await useUserStore.getState().fetchProfile()
            if (!alive) return
          } catch {
            // 401 由拦截器强制下线；其它错误不能清登录态，否则会闪回登录页
            if (!useUserStore.getState().token) {
              if (alive) {
                setReady(false)
                setToLogin(true)
              }
              return
            }
          }
        }
        const latestPerms = usePermissionStore.getState()
        if (!latestPerms.isSuperAdmin() && !latestPerms.hasPermission(meta.permission)) {
          if (alive) {
            setReady(false)
            setToLogin(false)
            setForcePwd(false)
            setForbidden(true)
          }
          return
        }
      }

      if (alive) {
        setToLogin(false)
        setForbidden(false)
        setForcePwd(false)
        setReady(true)
      }
    }

    void run()
    return () => {
      alive = false
    }
  }, [location.pathname, meta?.public, meta?.permission, token, mustChangePassword])

  if (toLogin) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  if (forcePwd) {
    return <Navigate to="/profile?forcePwd=1" replace />
  }
  if (forbidden) {
    return <Navigate to="/403" replace />
  }
  if (!ready) {
    return (
      <div className="xn-global-spin">
        <Spin description="加载中..." />
      </div>
    )
  }

  // 动态路由注册完成后的兜底由 CatchAll 路由处理
  return (
    <>
      <TagsViewSync
        title={meta?.title}
        affix={meta?.affix}
        noCache={meta?.noCache}
        isPublic={meta?.public}
        name={meta?.routePath?.replace(/^\//, '').replace(/\//g, '-')}
      />
      {children ?? <Outlet />}
    </>
  )
}

/** 已登录访问 /login 时回跳 */
export function LoginGuard({ children }: { children: ReactNode }) {
  const token = useUserStore((s) => s.token)
  const mustChangePassword = useUserStore((s) => !!s.user?.mustChangePassword)
  const navigate = useNavigate()

  useEffect(() => {
    if (!token) return
    navigate(mustChangePassword ? '/profile?forcePwd=1' : '/dashboard', { replace: true })
  }, [token, mustChangePassword, navigate])

  if (token) {
    return (
      <div className="xn-global-spin xn-global-spin--viewport">
        <Spin description="正在进入系统..." />
      </div>
    )
  }
  return <>{children}</>
}
