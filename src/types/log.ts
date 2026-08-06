export interface LoginLog {
  id: number
  username: string
  ip: string
  userAgent?: string
  status: number
  message?: string
  loginTime: string
}

export type OperBusinessType =
  'INSERT' | 'UPDATE' | 'DELETE' | 'GRANT' | 'IMPORT' | 'EXPORT' | 'CLEAN' | 'OTHER'

export interface OperLog {
  id: number
  title: string
  businessType: OperBusinessType
  operatorName?: string
  requestMethod?: string
  requestUrl?: string
  method?: string
  ip?: string
  params?: string
  status: number
  errorMsg?: string
  costTime?: number
  operTime: string
}

export interface ExceptionLog {
  id: number
  requestMethod?: string
  requestUrl?: string
  method?: string
  className?: string
  exceptionName?: string
  message?: string
  stackTrace?: string
  operatorName?: string
  ip?: string
  createdAt: string
}
