import type { ReactNode } from 'react'
import { usePermission } from '@/hooks/usePermission'

interface XnAuthProps {
  permission?: string | string[]
  /** 无权限时渲染的内容，默认隐藏 */
  fallback?: ReactNode
  children: ReactNode
}

/** 无对应权限时不渲染 children */
export default function XnAuth({ permission, fallback = null, children }: XnAuthProps) {
  const { hasPermission, hasAnyPermission } = usePermission()

  if (!permission) return <>{children}</>

  const ok = Array.isArray(permission) ? hasAnyPermission(permission) : hasPermission(permission)

  return <>{ok ? children : fallback}</>
}
