import { createElement } from 'react'
import { create } from 'zustand'
import { Button, notification } from 'antd'
import { listMine, markRead } from '@/api/notice'
import type { MyNotice } from '@/types'
import { connectNoticeWs, disconnectNoticeWs, onNoticeWsMessage } from '@/utils/notice-ws'

interface NoticeState {
  notices: MyNotice[]
  loading: boolean
  drawerVisible: boolean
  activeNotice: MyNotice | null
  unreadCount: number
  fetchMine: () => Promise<void>
  openNotice: (notice: MyNotice) => Promise<void>
  openNoticeById: (id: number) => Promise<void>
  closeDetail: () => void
  openDrawer: () => void
  closeDrawer: () => void
  startRealtime: () => void
  stopRealtime: () => void
}

let offWs: (() => void) | undefined

function recount(notices: MyNotice[]) {
  return notices.filter((n) => !n.read).length
}

export const useNoticeStore = create<NoticeState>((set, get) => ({
  notices: [],
  loading: false,
  drawerVisible: false,
  activeNotice: null,
  unreadCount: 0,

  async fetchMine() {
    set({ loading: true })
    try {
      const res = await listMine()
      const notices = res.data || []
      set({ notices, unreadCount: recount(notices) })
    } finally {
      set({ loading: false })
    }
  },

  async openNotice(notice) {
    set({ activeNotice: notice })
    if (!notice.read) {
      try {
        await markRead(notice.id)
        const notices = get().notices.map((n) =>
          n.id === notice.id ? { ...n, read: true, readAt: new Date().toISOString() } : n,
        )
        set({ notices, unreadCount: recount(notices), activeNotice: { ...notice, read: true } })
      } catch {
        /* ignore */
      }
    }
  },

  async openNoticeById(id) {
    await get().fetchMine()
    const found = get().notices.find((n) => n.id === id)
    if (found) {
      await get().openNotice(found)
      return
    }
    get().openDrawer()
  },

  closeDetail() {
    set({ activeNotice: null })
  },

  openDrawer() {
    set({ drawerVisible: true })
    void get().fetchMine()
  },

  closeDrawer() {
    set({ drawerVisible: false })
  },

  startRealtime() {
    get().stopRealtime()
    offWs = onNoticeWsMessage((data) => {
      const type = String(data.type || '')
      if (type === 'notice:publish') {
        const id = Number(data.id)
        const title = String(data.title || '您有一条新公告')
        const key = `notice-${id}-${Date.now()}`
        notification.info({
          key,
          message: '新公告',
          description: title,
          duration: 0,
          btn: createElement(
            Button,
            {
              type: 'primary',
              size: 'small',
              onClick: () => {
                notification.destroy(key)
                void get().openNoticeById(id)
              },
            },
            '查看',
          ),
        })
        void get().fetchMine()
        return
      }
      if (type === 'notice:revoke') {
        const id = Number(data.id)
        const notices = get().notices.filter((n) => n.id !== id)
        set({
          notices,
          unreadCount: recount(notices),
          activeNotice: get().activeNotice?.id === id ? null : get().activeNotice,
        })
      }
    })
    connectNoticeWs()
    void get().fetchMine()
  },

  stopRealtime() {
    offWs?.()
    offWs = undefined
    disconnectNoticeWs()
    set({
      notices: [],
      activeNotice: null,
      drawerVisible: false,
      unreadCount: 0,
    })
  },
}))
