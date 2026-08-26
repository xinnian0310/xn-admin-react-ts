/**
 * 启动时向浏览器控制台输出项目信息。
 * 打开 DevTools 即可看到，便于辨识版本、框架与联系方式。
 * 联系信息优先读 GET /api/site-contact/public（系统设置入库），失败再走本地兜底。
 */

import { getPublicSiteContact } from '@/api/site-contact'
import { homeConfig } from '@/config/home'
import { resolveContactType, type SiteContactItem } from '@/types/site-contact'

const TITLE = '心念后台管理系统（React）'
const INTRO =
  '「心念后台」React 管理端。基于 React 19、TypeScript 与 Ant Design，由基准前端 xn-admin-vue3-ts 移植，对接同一套微服务后端 xn-admin-cloud。业务能力与 Vue 端对齐（JWT 登录、RBAC、动态路由/菜单、page-ui 驱动 CRUD、多布局与主题、公告通知、系统监控、文件与定时任务），视觉使用 Ant Design 原生风格。'
const FRONTEND = 'React 19 · TypeScript · Vite 8 · Ant Design · Zustand · React Router'
const BACKEND = 'Spring Boot 4 · Java 21 · Spring Cloud Gateway · Nacos · MySQL · Redis · MinIO'
const SITE = 'https://xinniankeji.vip'
const DEMO = 'https://react.xinniankeji.vip'
const GITHUB = 'https://github.com/xinnian0310/xn-admin-react-ts'
const GITEE = 'https://gitee.com/jenning/xn-admin-react-ts'

const TITLE_STYLE =
  'background:#1677ff;color:#fff;padding:6px 10px;border-radius:4px 0 0 4px;font-weight:700;font-size:12px;line-height:1.6'
const VERSION_STYLE =
  'background:#1f2d3d;color:#fff;padding:6px 10px;border-radius:0 4px 4px 0;font-size:12px;line-height:1.6'
const TAGLINE_STYLE = 'color:#606266;font-size:12px;padding:6px 0 2px'
const SECTION_STYLE = 'color:#1677ff;font-weight:700;font-size:12px'
const TEXT_STYLE = 'color:#606266;font-size:12px;line-height:1.7'
const LABEL_STYLE = 'color:#909399;font-size:12px'
const LINK_STYLE = 'color:#1677ff;font-size:12px'

function formatContactValue(item: SiteContactItem): string {
  const type = resolveContactType(item)
  if (type === 'qq') {
    const groups = (item.groups ?? []).filter((g) => g.value)
    if (groups.length) {
      return groups.map((g) => (g.full ? `${g.value}（已满）` : g.value)).join(' / ')
    }
  }
  return String(item.value ?? '').trim()
}

async function resolveContacts(): Promise<SiteContactItem[]> {
  try {
    const res = await getPublicSiteContact()
    if (res.data?.contacts?.length) return res.data.contacts
  } catch {
    // 后端未启动时沿用本地兜底
  }
  return homeConfig.contacts
}

function printContactLines(contacts: SiteContactItem[]): void {
  console.group('%c联系信息', SECTION_STYLE)
  for (const item of contacts) {
    const value = formatContactValue(item)
    if (!item.label || !value) continue
    const type = resolveContactType(item)
    const valueStyle = type === 'email' || type === 'link' ? LINK_STYLE : TEXT_STYLE
    console.log(`%c${item.label}\t%c${value}`, LABEL_STYLE, valueStyle)
  }
  console.groupEnd()
}

export function printConsoleBanner(): void {
  if (typeof window === 'undefined') return
  const flag = window as Window & { __XN_CONSOLE_BANNER__?: boolean }
  if (flag.__XN_CONSOLE_BANNER__) return
  flag.__XN_CONSOLE_BANNER__ = true

  void (async () => {
    const contacts = await resolveContacts()
    const version = `v${__APP_VERSION__}`
    console.log(`%c ${TITLE} %c ${version} `, TITLE_STYLE, VERSION_STYLE)
    console.log('%c心有所念，码有所成。Apache-2.0 开源，可商用 / 可自用。', TAGLINE_STYLE)

    console.group('%c框架介绍', SECTION_STYLE)
    console.log(`%c${INTRO}`, TEXT_STYLE)
    console.log(`%c前端\t%c${FRONTEND}`, LABEL_STYLE, TEXT_STYLE)
    console.log(`%c后端\t%c${BACKEND}`, LABEL_STYLE, TEXT_STYLE)
    console.groupEnd()

    console.group('%c仓库', SECTION_STYLE)
    console.log(`%c官网\t%c${SITE}`, LABEL_STYLE, LINK_STYLE)
    console.log(`%c演示\t%c${DEMO}`, LABEL_STYLE, LINK_STYLE)
    console.log(`%cGitHub\t%c${GITHUB}`, LABEL_STYLE, LINK_STYLE)
    console.log(`%cGitee\t%c${GITEE}`, LABEL_STYLE, LINK_STYLE)
    console.groupEnd()

    printContactLines(contacts)
    console.log('%cCopyright © 2026 心念科技', LABEL_STYLE)
  })()
}
