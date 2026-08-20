import { useEffect, useState } from 'react'
import { appConfig, subscribeAppConfig, type AppConfig } from '@/config/app'

/** 订阅运行时 appConfig，保存系统配置后立刻重渲染 */
export function useAppConfig(): AppConfig {
  const [, setTick] = useState(0)
  useEffect(() => subscribeAppConfig(() => setTick((n) => n + 1)), [])
  return appConfig
}
