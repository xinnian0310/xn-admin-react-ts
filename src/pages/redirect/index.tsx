import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

/** 标签刷新中转：/redirect/users → /users */
export default function RedirectPage() {
  const navigate = useNavigate()
  const params = useParams()
  const rest = params['*'] || ''

  useEffect(() => {
    const target = `/${rest}`.replace(/\/+/g, '/')
    navigate(target || '/dashboard', { replace: true })
  }, [navigate, rest])

  return null
}
