/**
 * 本前端工程在系统配置中的稳定 clientId。
 * 与后端 app.clients 的 key 一致；名称 / 介绍按此 id 读写隔离。
 *
 * 技术栈约定：
 * - xn-admin-vue3-ts  → Vue3 + TypeScript
 * - xn-admin-vue3-js  → Vue3 + JavaScript
 * - xn-admin-vue2-js  → Vue2 + JavaScript
 * - xn-admin-react-ts → React + TypeScript
 */
export const APP_CLIENT_ID = 'xn-admin-react-ts' as const

export type AppClientId =
  'xn-admin-vue3-ts' | 'xn-admin-vue3-js' | 'xn-admin-vue2-js' | 'xn-admin-react-ts'
