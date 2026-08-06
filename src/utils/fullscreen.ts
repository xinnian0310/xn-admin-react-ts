/** 浏览器原生全屏（Fullscreen API，效果接近 F11） */

type FsElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void
  mozRequestFullScreen?: () => Promise<void> | void
  msRequestFullscreen?: () => Promise<void> | void
}

type FsDocument = Document & {
  webkitFullscreenElement?: Element | null
  mozFullScreenElement?: Element | null
  msFullscreenElement?: Element | null
  webkitExitFullscreen?: () => Promise<void> | void
  mozCancelFullScreen?: () => Promise<void> | void
  msExitFullscreen?: () => Promise<void> | void
}

export function getFullscreenElement(): Element | null {
  const doc = document as FsDocument
  return (
    document.fullscreenElement ||
    doc.webkitFullscreenElement ||
    doc.mozFullScreenElement ||
    doc.msFullscreenElement ||
    null
  )
}

export function isBrowserFullscreen() {
  return !!getFullscreenElement()
}

export function isFullscreenEnabled() {
  const doc = document as Document & {
    webkitFullscreenEnabled?: boolean
    mozFullScreenEnabled?: boolean
    msFullscreenEnabled?: boolean
  }
  return !!(
    document.fullscreenEnabled ||
    doc.webkitFullscreenEnabled ||
    doc.mozFullScreenEnabled ||
    doc.msFullscreenEnabled
  )
}

export function toggleBrowserFullscreen(
  target: HTMLElement = document.documentElement,
): Promise<void> {
  if (isBrowserFullscreen()) {
    const doc = document as FsDocument
    const exit =
      document.exitFullscreen?.bind(document) ||
      doc.webkitExitFullscreen?.bind(doc) ||
      doc.mozCancelFullScreen?.bind(doc) ||
      doc.msExitFullscreen?.bind(doc)
    if (!exit) return Promise.reject(new Error('不支持退出全屏'))
    return Promise.resolve(exit()).then(() => undefined)
  }

  const el = target as FsElement
  const req =
    el.requestFullscreen?.bind(el) ||
    el.webkitRequestFullscreen?.bind(el) ||
    el.mozRequestFullScreen?.bind(el) ||
    el.msRequestFullscreen?.bind(el)
  if (!req) return Promise.reject(new Error('不支持进入全屏'))
  return Promise.resolve(req()).then(() => undefined)
}

const EVENTS = [
  'fullscreenchange',
  'webkitfullscreenchange',
  'mozfullscreenchange',
  'MSFullscreenChange',
] as const

export function onBrowserFullscreenChange(handler: () => void) {
  for (const evt of EVENTS) {
    document.addEventListener(evt, handler)
  }
  return () => {
    for (const evt of EVENTS) {
      document.removeEventListener(evt, handler)
    }
  }
}
