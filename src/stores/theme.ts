import { create } from 'zustand'
import { applyLayoutTheme } from '@/config/app'
import {
  DEFAULT_CUSTOM_PARTS,
  DEFAULT_THEME_ID,
  DEFAULT_THEME_SOURCE,
  builtinThemes,
  findAppearanceTheme,
  findTheme,
  resolveActiveTheme,
  themeToCustomParts,
  type AppearanceMode,
  type CustomThemeParts,
  type ThemeSource,
} from '@/config/themes'

const STORAGE_SOURCE = 'xn-theme-source'
const STORAGE_THEME_ID = 'xn-theme-id'
const STORAGE_APPEARANCE = 'xn-appearance'
const STORAGE_CUSTOM = 'xn-theme-custom'
const STORAGE_MAIN_BG = 'xn-main-bg-image'

export const MAIN_BG_MAX_BYTES = 800 * 1024

function loadSource(): ThemeSource {
  try {
    const v = localStorage.getItem(STORAGE_SOURCE)
    if (v === 'appearance' || v === 'custom' || v === 'preset') return v
    if (localStorage.getItem(STORAGE_THEME_ID) === 'custom') return 'custom'
    return DEFAULT_THEME_SOURCE
  } catch {
    return DEFAULT_THEME_SOURCE
  }
}

function loadThemeId(): string {
  try {
    const id = localStorage.getItem(STORAGE_THEME_ID) || DEFAULT_THEME_ID
    if (id === 'custom') return DEFAULT_THEME_ID
    // 归一旧 id（如 indigo → geekblue），保证选中态与内置列表一致
    return findTheme(id).id
  } catch {
    return DEFAULT_THEME_ID
  }
}

function loadAppearance(): AppearanceMode {
  try {
    const v = localStorage.getItem(STORAGE_APPEARANCE)
    return v === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

function loadCustomParts(): CustomThemeParts {
  try {
    const raw = localStorage.getItem(STORAGE_CUSTOM)
    if (!raw) return { ...DEFAULT_CUSTOM_PARTS }
    const parsed = { ...DEFAULT_CUSTOM_PARTS, ...JSON.parse(raw) } as CustomThemeParts
    // 迁移：此前为仿 Element 的 #409eff 三色同色，改为 Ant Design 默认
    if (
      parsed.primary === '#409eff' &&
      parsed.sidebarBg === '#409eff' &&
      parsed.headerBg === '#409eff'
    ) {
      return { ...DEFAULT_CUSTOM_PARTS }
    }
    return parsed
  } catch {
    return { ...DEFAULT_CUSTOM_PARTS }
  }
}

function loadMainBgImage(): string | null {
  try {
    return localStorage.getItem(STORAGE_MAIN_BG)
  } catch {
    return null
  }
}

interface ThemeState {
  source: ThemeSource
  themeId: string
  appearance: AppearanceMode
  customParts: CustomThemeParts
  mainBgImage: string | null
  dialogVisible: boolean
  themes: typeof builtinThemes
  currentTheme: ReturnType<typeof resolveActiveTheme>
  effectiveAppearance: AppearanceMode
  applyCurrent: () => void
  setTheme: (id: string) => void
  setAppearance: (mode: AppearanceMode) => void
  setCustomParts: (partial: Partial<CustomThemeParts>) => void
  setMainBgImage: (dataUrl: string | null) => void
  applyCustom: () => void
  resetToDefault: () => void
  openDialog: () => void
  closeDialog: () => void
}

function computeDerived(
  source: ThemeSource,
  themeId: string,
  appearance: AppearanceMode,
  customParts: CustomThemeParts,
) {
  const currentTheme = resolveActiveTheme({ source, themeId, appearance, customParts })
  const effectiveAppearance: AppearanceMode = source === 'appearance' ? appearance : 'light'
  return { currentTheme, effectiveAppearance }
}

export const useThemeStore = create<ThemeState>((set, get) => {
  const source = loadSource()
  const themeId = loadThemeId()
  const appearance = loadAppearance()
  const customParts = loadCustomParts()
  const derived = computeDerived(source, themeId, appearance, customParts)

  function persistSource(next: ThemeSource) {
    localStorage.setItem(STORAGE_SOURCE, next)
    const state = get()
    const nextDerived = computeDerived(next, state.themeId, state.appearance, state.customParts)
    set({ source: next, ...nextDerived })
  }

  return {
    source,
    themeId,
    appearance,
    customParts,
    mainBgImage: loadMainBgImage(),
    dialogVisible: false,
    themes: builtinThemes,
    ...derived,

    applyCurrent() {
      const state = get()
      applyLayoutTheme(state.currentTheme.colors, {
        appearance: state.effectiveAppearance,
        mainBgImage: state.source === 'custom' ? state.mainBgImage : null,
        source: state.source,
      })
    },

    setTheme(id) {
      localStorage.setItem(STORAGE_THEME_ID, id)
      const parts = themeToCustomParts(findTheme(id))
      localStorage.setItem(STORAGE_CUSTOM, JSON.stringify(parts))
      const nextDerived = computeDerived('preset', id, get().appearance, parts)
      localStorage.setItem(STORAGE_SOURCE, 'preset')
      set({ themeId: id, source: 'preset', customParts: parts, ...nextDerived })
      get().applyCurrent()
    },

    setAppearance(mode) {
      localStorage.setItem(STORAGE_APPEARANCE, mode)
      const parts = themeToCustomParts(findAppearanceTheme(mode))
      localStorage.setItem(STORAGE_CUSTOM, JSON.stringify(parts))
      const nextDerived = computeDerived('appearance', get().themeId, mode, parts)
      localStorage.setItem(STORAGE_SOURCE, 'appearance')
      set({ appearance: mode, source: 'appearance', customParts: parts, ...nextDerived })
      get().applyCurrent()
    },

    setCustomParts(partial) {
      const next = { ...get().customParts, ...partial }
      localStorage.setItem(STORAGE_CUSTOM, JSON.stringify(next))
      const nextDerived = computeDerived('custom', get().themeId, get().appearance, next)
      localStorage.setItem(STORAGE_SOURCE, 'custom')
      set({ customParts: next, source: 'custom', ...nextDerived })
      get().applyCurrent()
    },

    setMainBgImage(dataUrl) {
      try {
        if (dataUrl) localStorage.setItem(STORAGE_MAIN_BG, dataUrl)
        else localStorage.removeItem(STORAGE_MAIN_BG)
      } catch {
        set({ mainBgImage: null })
        throw new Error('底图过大或存储空间不足，请压缩后重试')
      }
      set({ mainBgImage: dataUrl })
      persistSource('custom')
      get().applyCurrent()
    },

    applyCustom() {
      persistSource('custom')
      get().applyCurrent()
    },

    resetToDefault() {
      const appearance: AppearanceMode = 'light'
      const customParts = { ...DEFAULT_CUSTOM_PARTS }
      const nextDerived = computeDerived(
        DEFAULT_THEME_SOURCE,
        DEFAULT_THEME_ID,
        appearance,
        customParts,
      )
      try {
        localStorage.removeItem(STORAGE_SOURCE)
        localStorage.removeItem(STORAGE_THEME_ID)
        localStorage.removeItem(STORAGE_APPEARANCE)
        localStorage.removeItem(STORAGE_CUSTOM)
        localStorage.removeItem(STORAGE_MAIN_BG)
      } catch {
        /* ignore */
      }
      set({
        source: DEFAULT_THEME_SOURCE,
        themeId: DEFAULT_THEME_ID,
        appearance,
        customParts,
        mainBgImage: null,
        ...nextDerived,
      })
      get().applyCurrent()
    },

    openDialog() {
      set({ dialogVisible: true })
    },

    closeDialog() {
      set({ dialogVisible: false })
    },
  }
})
