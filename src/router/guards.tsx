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
  const userRolesLength = useUserStore((s) => s.user?.roles?.length ?? 0)
  const userPermissionsLength = useUserStore((s) => s.user?.permissions?.length ?? 0)
  const fetchProfile = useUserStore((s) => s.fetchProfile)
  const logout = useUserStore((s) => s.logout)
  const routesRegistered = useMenuStore((s) => s.routesRegistered)
  const hasPermission = usePermissionStore((s) => s.hasPermission)
  const isSuperAdmin = usePermissionStore((s) => s.isSuperAdmin)
  const permissionsLength = usePermissionStore((s) => s.permissions.length)
  const [ready, setReady] = useState(false)
  const [forbidden, setForbidden] = useState(false)
  const [toLogin, setToLogin] = useState(false)
  const [forcePwd, setForcePwd] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function run() {
      setForbidden(false)
      setToLogin(false)
      setForcePwd(false)

      if (!meta?.public && !token) {
        if (!cancelled) {
          setReady(false)
          setToLogin(true)
        }
        return
      }

      if (token && mustChangePassword) {
        const path = location.pathname
        if (path !== '/profile' && path !== '/login' && !ERROR_PATHS.has(path)) {
          if (!cancelled) {
            setReady(false)
            setForcePwd(true)
          }
          return
        }
      }

      // 读最新值，避免 await 期间 routesRegistered 已翻转却仍走取消分支卡住 ready
      if (!meta?.public && token && !useMenuStore.getState().routesRegistered) {
        if (!cancelled) setReady(false)
        await registerDynamicRoutes()
        if (cancelled) return
      }

      if (ERROR_PATHS.has(location.pathname)) {
        if (!cancelled) setReady(true)
        return
      }

      if (meta?.permission) {
        try {
          // 超管以角色兜底，空 permissions 不应反复拉 /auth/me
          const needsRefresh =
            !isSuperAdmin() &&
            (!usePermissionStore.getState().permissions.length ||
              !userRolesLength ||
              !userPermissionsLength)
          if (needsRefresh && token) {
            if (!cancelled) setReady(false)
            await fetchProfile()
            if (cancelled) return
          }
        } catch {
          await logout(false)
          if (!cancelled) {
            setReady(false)
            setToLogin(true)
          }
          return
        }
        if (!isSuperAdmin() && !hasPermission(meta.permission)) {
          if (!cancelled) {
            setReady(false)
            setForbidden(true)
          }
          return
        }
      }

      if (!cancelled) setReady(true)
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [
    location.pathname,
    meta?.public,
    meta?.permission,
    token,
    mustChangePassword,
    userRolesLength,
    userPermissionsLength,
    routesRegistered,
    permissionsLength,
    fetchProfile,
    logout,
    hasPermission,
    isSuperAdmin,
  ])

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
      <div style={{ display: 'grid', placeItems: 'center', height: '40vh' }}>
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
  const user = useUserStore((s) => s.user)
  if (token) {
    if (user?.mustChangePassword) {
      return <Navigate to="/profile?forcePwd=1" replace />
    }
    return <Navigate to="/dashboard" replace />
  }
  return <>{children}</>
}
