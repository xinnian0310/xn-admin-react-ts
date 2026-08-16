import { execSync } from 'node:child_process'
import type { Plugin } from 'vite'

export type GitChangelogType = 'feature' | 'fix' | 'refactor'

export interface GitChangelogItem {
  hash: string
  date: string
  type: GitChangelogType
  text: string
}

const TYPE_MAP: Record<string, GitChangelogType> = {
  feat: 'feature',
  fix: 'fix',
  refactor: 'refactor',
  perf: 'refactor',
}

/** 读取 Conventional Commits，过滤 chore/docs 等噪音 */
export function loadGitChangelog(limit = 20): GitChangelogItem[] {
  try {
    const raw = execSync(`git log -n ${limit * 3} --pretty=format:%h%x09%ad%x09%s --date=short`, {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })

    const items: GitChangelogItem[] = []
    for (const line of raw.split('\n')) {
      if (!line.trim()) continue
      const [hash, date, ...rest] = line.split('\t')
      const subject = rest.join('\t').trim()
      const match = /^(feat|fix|refactor|perf)(?:\([^)]*\))?!?:\s*(.+)$/i.exec(subject)
      if (!match || !hash || !date) continue

      const type = TYPE_MAP[match[1].toLowerCase()]
      if (!type) continue

      items.push({
        hash,
        date,
        type,
        text: match[2].trim(),
      })
      if (items.length >= limit) break
    }
    return items
  } catch {
    return []
  }
}

/** 虚拟模块：首页更新日志与 git log 对齐，开发/构建时自动刷新 */
export function gitChangelogPlugin(limit = 20): Plugin {
  const virtualId = 'virtual:git-changelog'
  const resolvedId = `\0${virtualId}`

  return {
    name: 'git-changelog',
    resolveId(id) {
      if (id === virtualId) return resolvedId
    },
    load(id) {
      if (id !== resolvedId) return
      const items = loadGitChangelog(limit)
      return `export const gitChangelog = ${JSON.stringify(items, null, 2)}\nexport default gitChangelog\n`
    },
  }
}
