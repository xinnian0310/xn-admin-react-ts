/// <reference types="vite/client" />

/** 来自 package.json，由 vite.config.ts define 注入 */
declare const __APP_VERSION__: string

declare module '*.css'
declare module '*.scss'
declare module '*.svg'
declare module '*.png'
declare module '*.jpg'
declare module '*.jpeg'
declare module '*.gif'
declare module '*.webp'

declare module 'virtual:git-changelog' {
  export type GitChangelogType = 'feature' | 'fix' | 'refactor'

  export interface GitChangelogItem {
    hash: string
    date: string
    type: GitChangelogType
    text: string
  }

  export const gitChangelog: GitChangelogItem[]
  export default gitChangelog
}
