import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Spin } from 'antd'
import AdminLayout from '@/layouts/AdminLayout'
import { AuthGuard, LoginGuard, NavigateBinder } from '@/router/guards'
import { useMenuStore } from '@/stores/menu'
import { getDynamicRouteObjects, isCatchAllReady } from '@/utils/route-register'

const LoginView = lazy(() => import('@/pages/login/LoginView'))
const Dashboard = lazy(() => import('@/pages/dashboard/index'))
const Profile = lazy(() => import('@/pages/profile/index'))
const Forbidden = lazy(() => import('@/pages/error/ForbiddenView'))
const NotFound = lazy(() => import('@/pages/error/NotFoundView'))
const ServiceUnavailable = lazy(() => import('@/pages/error/ServiceUnavailableView'))
const RedirectPage = lazy(() => import('@/pages/redirect/index'))

function PageFallback() {
  return (
    <div style={{ display: 'grid', placeItems: 'center', height: '40vh' }}>
      <Spin description="页面加载中..." />
    </div>
  )
}

function CatchAll() {
  const routesRegistered = useMenuStore((s) => s.routesRegistered)
  const menuLoadFailed = useMenuStore((s) => s.menuLoadFailed)
  if (!routesRegistered || !isCatchAllReady()) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', height: '40vh' }}>
        <Spin description="注册路由中..." />
      </div>
    )
  }
  return <Navigate to={menuLoadFailed ? '/503' : '/404'} replace />
}

export default function AppRouter() {
  const routesRegistered = useMenuStore((s) => s.routesRegistered)
  const dynamicRoutes = routesRegistered ? getDynamicRouteObjects() : []

  return (
    <>
      <NavigateBinder />
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route
            path="/login"
            element={
              <LoginGuard>
                <LoginView />
              </LoginGuard>
            }
          />
          <Route
            path="/"
            element={
              <AuthGuard>
                <AdminLayout />
              </AuthGuard>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route
              path="dashboard"
              element={
                <AuthGuard
                  meta={{
                    title: '首页',
                    affix: true,
                    permission: 'menu:dashboard',
                    routePath: '/dashboard',
                  }}
                >
                  <Dashboard />
                </AuthGuard>
              }
            />
            <Route
              path="profile"
              element={
                <AuthGuard meta={{ title: '个人信息', hidden: true, routePath: '/profile' }}>
                  <Profile />
                </AuthGuard>
              }
            />
            <Route
              path="403"
              element={
                <AuthGuard meta={{ title: '无权限', hidden: true, routePath: '/403' }}>
                  <Forbidden />
                </AuthGuard>
              }
            />
            <Route
              path="404"
              element={
                <AuthGuard meta={{ title: '页面不存在', hidden: true, routePath: '/404' }}>
                  <NotFound />
                </AuthGuard>
              }
            />
            <Route
              path="503"
              element={
                <AuthGuard meta={{ title: '服务不可用', hidden: true, routePath: '/503' }}>
                  <ServiceUnavailable />
                </AuthGuard>
              }
            />
            <Route
              path="redirect/*"
              element={
                <AuthGuard meta={{ hidden: true, noCache: true, routePath: '/redirect' }}>
                  <RedirectPage />
                </AuthGuard>
              }
            />
            {dynamicRoutes.map((r) => (
              <Route
                key={r.name}
                path={r.path}
                element={
                  <AuthGuard meta={r.meta}>
                    <r.Component />
                  </AuthGuard>
                }
              />
            ))}
            <Route path="*" element={<CatchAll />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  )
}
