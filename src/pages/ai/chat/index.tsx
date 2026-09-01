import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Input, Modal, message } from 'antd'
import {
  createConversation,
  deleteConversation,
  listConversations,
  listMessages,
  updateConversation,
} from '@/api/ai/conversation'
import { stopChat, streamChat } from '@/api/ai/chat'
import { listModels, testModel } from '@/api/ai/model'
import { getMyQuota } from '@/api/ai/quota'
import { getAiSettings } from '@/api/ai/setting'
import type { ChatFilePayload, ChatMessage, Conversation } from '@/types/ai/conversation'
import type { ModelListData } from '@/types/ai/model'
import type { MyQuota, PublicAiSettings } from '@/types/ai/quota'
import { formatDateTime } from '@/utils/datetime'
import { isImageSrc } from '@/utils/icons'
import { modelVisibleName } from '@/utils/ai-model-cascader'
import SessionList from './components/SessionList'
import ModelSwitch from './components/ModelSwitch'
import MessagePane, { type MessagePaneHandle } from './components/MessagePane'
import Composer from './components/Composer'
import './chat.scss'

const HINTS = ['帮我写一段周报提纲', '解释这段报错是什么意思', '把这段需求拆成开发任务']
const SESSION_PAGE_SIZE = 100
const SESSION_COLLAPSE_KEY = 'ai:chat:sessions-collapsed'

export default function AiChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [currentId, setCurrentId] = useState('')
  const [modelPick, setModelPick] = useState('')
  const [draft, setDraft] = useState('')
  const [thinking, setThinking] = useState(false)
  const [chatFiles, setChatFiles] = useState<ChatFilePayload[]>([])
  const [streaming, setStreaming] = useState(false)
  const [sending, setSending] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [sessionPage, setSessionPage] = useState(1)
  const [sessionTotal, setSessionTotal] = useState(0)
  const [sessionHasMore, setSessionHasMore] = useState(false)
  const [sessionLoadingMore, setSessionLoadingMore] = useState(false)
  const [sessionsCollapsed, setSessionsCollapsed] = useState(
    () => localStorage.getItem(SESSION_COLLAPSE_KEY) === '1',
  )
  const [versionPick, setVersionPick] = useState<Record<string, string>>({})
  const [models, setModels] = useState<ModelListData>({ trial: null, mine: [] })
  const [quota, setQuota] = useState<Partial<MyQuota>>({})
  const [settings, setSettings] = useState<Partial<PublicAiSettings>>({})
  const [editOpen, setEditOpen] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [editMsg, setEditMsg] = useState<ChatMessage | null>(null)

  const abortRef = useRef<AbortController | null>(null)
  const paneRef = useRef<MessagePaneHandle | null>(null)
  const streamIdRef = useRef('')
  const probeSeqRef = useRef(0)
  const sendSeqRef = useRef(0)
  const openSeqRef = useRef(0)
  const streamingRef = useRef(false)
  const sendingRef = useRef(false)
  const currentIdRef = useRef('')
  const modelPickRef = useRef('')
  const modelsRef = useRef(models)
  const conversationsRef = useRef(conversations)
  const messagesRef = useRef(messages)
  const settingsRef = useRef(settings)
  const thinkingRef = useRef(thinking)
  const chatFilesRef = useRef(chatFiles)
  const draftRef = useRef(draft)
  const sessionTotalRef = useRef(sessionTotal)

  modelsRef.current = models
  conversationsRef.current = conversations
  messagesRef.current = messages
  settingsRef.current = settings
  thinkingRef.current = thinking
  chatFilesRef.current = chatFiles
  draftRef.current = draft
  sessionTotalRef.current = sessionTotal
  currentIdRef.current = currentId
  modelPickRef.current = modelPick
  streamingRef.current = streaming
  sendingRef.current = sending

  const enabledMine = useMemo(
    () => (models.mine || []).filter((m) => m.status === 1),
    [models.mine],
  )
  const usableMine = useMemo(
    () => enabledMine.filter((m) => m.lastCheckOk !== false),
    [enabledMine],
  )
  const trialUsable = !!(models.trial && models.trial.lastCheckOk !== false)
  const hasModel = !!models.trial || enabledMine.length > 0
  const hasUsableModel = trialUsable || usableMine.length > 0
  const pickerModels = useMemo<ModelListData>(
    () => ({
      trial: models.trial,
      mine: enabledMine,
      available: models.available,
      unavailableCode: models.unavailableCode,
      unavailableMessage: models.unavailableMessage,
    }),
    [models, enabledMine],
  )
  const quotaLow = (quota.estimatedTurnsLeft ?? 99) < 5

  const supportsThinking = useMemo(() => {
    if (models.trial && modelPick === models.trial.id) return !!models.trial.supportsThinking
    return !!enabledMine.find((m) => m.id === modelPick)?.supportsThinking
  }, [models.trial, modelPick, enabledMine])

  const supportsFiles = useMemo(() => {
    if (models.trial && modelPick === models.trial.id) return !!models.trial.supportsFiles
    return !!enabledMine.find((m) => m.id === modelPick)?.supportsFiles
  }, [models.trial, modelPick, enabledMine])

  useEffect(() => {
    if (!supportsThinking) setThinking(false)
    if (!supportsFiles) setChatFiles([])
  }, [supportsThinking, supportsFiles])

  const assistantIcon = useMemo(() => {
    const conv = conversations.find((c) => c.id === currentId)
    const modelId = modelPick || conv?.modelId
    if (models.trial && models.trial.id === modelId && isImageSrc(models.trial.providerIcon)) {
      return models.trial.providerIcon || ''
    }
    const mine = enabledMine.find((m) => m.id === modelId)
    if (isImageSrc(mine?.providerIcon)) return mine?.providerIcon || ''
    const picked = enabledMine.find((m) => m.id === modelPick)
    if (isImageSrc(picked?.providerIcon)) return picked?.providerIcon || ''
    if (models.trial && isImageSrc(models.trial.providerIcon))
      return models.trial.providerIcon || ''
    return ''
  }, [conversations, currentId, modelPick, models.trial, enabledMine])

  const trialSelected = !!(models.trial && modelPick === models.trial.id)
  const trialExhausted = trialSelected && (quota.estimatedTurnsLeft ?? 1) <= 0
  const unbound = useMemo(() => {
    const conv = conversations.find((c) => c.id === currentId)
    return !!conv && !conv.modelId && !modelPick
  }, [conversations, currentId, modelPick])
  const canType = hasUsableModel && !!modelPick && !trialExhausted && !unbound
  const canSend =
    canType && (!!draft.trim() || (supportsFiles && chatFiles.length > 0)) && !streaming && !sending
  const composerPlaceholder = !hasModel
    ? '请先添加模型'
    : !hasUsableModel
      ? '当前模型不可用，请改选其他模型'
      : trialExhausted
        ? '试用额度已用完'
        : supportsFiles
          ? '输入消息，Enter 发送；可粘贴或上传文件'
          : '输入消息，Enter 发送，Shift+Enter 换行'

  const visibleMessages = useMemo(() => {
    const hidden = new Set<string>()
    for (const msg of messages) {
      if (msg.role !== 'ASSISTANT' || !msg.parentId) continue
      const versions = messages.filter((m) => m.role === 'ASSISTANT' && m.parentId === msg.parentId)
      const chosen = versionPick[msg.parentId] || versions[versions.length - 1]?.id
      for (const v of versions) {
        if (v.id !== chosen) hidden.add(v.id)
      }
    }
    return messages.filter((m) => !hidden.has(m.id))
  }, [messages, versionPick])

  function toggleSessions() {
    setSessionsCollapsed((prev) => {
      const next = !prev
      localStorage.setItem(SESSION_COLLAPSE_KEY, next ? '1' : '0')
      return next
    })
  }

  async function refreshQuota() {
    const res = await getMyQuota()
    setQuota(res.data)
  }

  function firstUsableId(data = modelsRef.current) {
    const mine = (data.mine || []).filter((m) => m.status === 1 && m.lastCheckOk !== false)
    if (data.trial && data.trial.lastCheckOk !== false) return data.trial.id
    return mine[0]?.id || ''
  }

  function isUsableId(id: string, data = modelsRef.current) {
    if (!id) return false
    if (data.trial && data.trial.id === id) return data.trial.lastCheckOk !== false
    const mine = (data.mine || []).find((item) => item.id === id && item.status === 1)
    return !!mine && mine.lastCheckOk !== false
  }

  function isPickerId(id: string, data = modelsRef.current) {
    if (!id) return false
    if (data.trial?.id === id) return true
    return (data.mine || []).some((item) => item.status === 1 && item.id === id)
  }

  function normalizeModelLabel(value: string) {
    return value
      .replace(/（试用）/g, '')
      .replace(/\s+/g, '')
      .toLowerCase()
  }

  function pickedModelLabel() {
    const data = modelsRef.current
    const pick = modelPickRef.current
    if (data.trial && pick === data.trial.id) {
      return modelVisibleName({
        id: data.trial.id,
        name: data.trial.name,
        modelId: data.trial.modelId,
        modelDisplayName: data.trial.modelDisplayName || data.trial.name,
        trial: true,
      })
    }
    const mine = (data.mine || []).find((item) => item.status === 1 && item.id === pick)
    if (!mine) return ''
    return modelVisibleName({
      id: mine.id,
      name: mine.name,
      modelId: mine.modelId,
      modelDisplayName: mine.modelDisplayName,
    })
  }

  function pickerIdBySnapshot(snapshot?: string | null) {
    if (!snapshot) return ''
    const snap = normalizeModelLabel(snapshot)
    if (!snap) return ''
    const data = modelsRef.current
    const candidates = [
      ...(data.trial ? [data.trial] : []),
      ...(data.mine || []).filter((m) => m.status === 1),
    ]
    const hit = candidates.find((item) => {
      const display = 'modelDisplayName' in item ? item.modelDisplayName : item.name
      const labels = [item.name, item.modelId, display]
      if (item.providerName) {
        labels.push(
          `${item.providerName} / ${display}`,
          `${item.providerName} / ${item.modelId}`,
          `${item.providerName} / ${item.name}`,
        )
      }
      return labels.some((label) => {
        if (!label) return false
        const normalized = normalizeModelLabel(label)
        return snap === normalized || snap.endsWith(`/${normalized}`)
      })
    })
    return hit?.id || ''
  }

  function lastUsedModelId(fallback?: string | null) {
    const list = messagesRef.current
    for (let i = list.length - 1; i >= 0; i--) {
      const msg = list[i]
      if (msg.role !== 'ASSISTANT') continue
      const fromSnapshot = pickerIdBySnapshot(msg.modelSnapshot)
      if (fromSnapshot) return fromSnapshot
    }
    if (fallback && isPickerId(fallback)) return fallback
    return fallback || ''
  }

  function applyConversationModel(conv?: Conversation) {
    const next = lastUsedModelId(conv?.modelId)
    if (next) setModelPick(next)
  }

  async function ensureUsablePick() {
    if (isUsableId(modelPickRef.current)) return
    const next = firstUsableId()
    if (next === modelPickRef.current) return
    setModelPick(next)
    if (next && currentIdRef.current) {
      await updateConversation(currentIdRef.current, { modelId: next })
      await reloadSessions()
    }
  }

  function applyProbeResult(id: string, ok: boolean) {
    setModels((prev) => {
      if (prev.trial && prev.trial.id === id) {
        if (prev.trial.lastCheckOk === ok) return prev
        return { ...prev, trial: { ...prev.trial, lastCheckOk: ok } }
      }
      const mine = prev.mine.find((item) => item.id === id)
      if (!mine || mine.lastCheckOk === ok) return prev
      return {
        ...prev,
        mine: prev.mine.map((item) => (item.id === id ? { ...item, lastCheckOk: ok } : item)),
      }
    })
  }

  function finishGeneration() {
    streamingRef.current = false
    sendingRef.current = false
    streamIdRef.current = ''
    abortRef.current = null
    setStreaming(false)
    setSending(false)
  }

  function abortGeneration() {
    sendSeqRef.current += 1
    flushStop()
    finishGeneration()
  }

  async function probePickerModels() {
    if (streamingRef.current) return
    const data = modelsRef.current
    const ids = [
      ...(data.trial ? [data.trial.id] : []),
      ...(data.mine || []).filter((item) => item.status === 1).map((item) => item.id),
    ]
    if (!ids.length) return
    const seq = ++probeSeqRef.current
    await Promise.all(
      ids.map(async (id) => {
        try {
          const res = await testModel(id, true)
          if (seq !== probeSeqRef.current) return
          applyProbeResult(id, !!res.data?.ok)
        } catch {
          if (seq !== probeSeqRef.current) return
          applyProbeResult(id, false)
        }
      }),
    )
    if (seq !== probeSeqRef.current) return
    await ensureUsablePick()
  }

  async function reloadSessions() {
    const res = await listConversations({ page: 1, size: SESSION_PAGE_SIZE })
    const records = res.data?.records ?? []
    const total = res.data?.total ?? records.length
    setConversations(records)
    setSessionPage(1)
    setSessionTotal(total)
    setSessionHasMore(records.length < total)
  }

  async function loadMoreSessions() {
    if (sessionLoadingMore || !sessionHasMore) return
    setSessionLoadingMore(true)
    try {
      const next = sessionPage + 1
      const res = await listConversations({ page: next, size: SESSION_PAGE_SIZE })
      const more = res.data?.records ?? []
      setSessionPage(next)
      const total = res.data?.total ?? sessionTotal
      setSessionTotal(total)
      setConversations((prev) => {
        const seen = new Set(prev.map((c) => c.id))
        const merged = [...prev, ...more.filter((c) => !seen.has(c.id))]
        setSessionHasMore(merged.length < total)
        return merged
      })
    } finally {
      setSessionLoadingMore(false)
    }
  }

  function atConversationLimit() {
    const max = settingsRef.current.maxConversationsPerUser || 500
    return sessionTotalRef.current >= max
  }

  async function openConversation(id: string) {
    if (id !== currentIdRef.current && (streamingRef.current || sendingRef.current)) {
      abortGeneration()
    }
    const seq = ++openSeqRef.current
    setCurrentId(id)
    const conv = conversationsRef.current.find((c) => c.id === id)
    if (conv?.modelId && isPickerId(conv.modelId)) setModelPick(conv.modelId)
    const res = await listMessages(id, { size: 30 })
    if (seq !== openSeqRef.current) return
    const page = Array.isArray(res.data) ? { records: res.data, hasMore: false } : res.data
    const records = page?.records ?? []
    setMessages(records)
    messagesRef.current = records
    setHasMore(!!page?.hasMore)
    applyConversationModel(conv)
    paneRef.current?.stick()
    await Promise.resolve()
    if (seq !== openSeqRef.current) return
    paneRef.current?.scrollToBottom(true)
  }

  async function loadMore() {
    if (!currentIdRef.current || !messagesRef.current.length) return
    setLoadingMore(true)
    try {
      const first = messagesRef.current[0]
      const res = await listMessages(currentIdRef.current, { beforeId: first.id, size: 30 })
      const page = Array.isArray(res.data) ? { records: res.data, hasMore: false } : res.data
      setMessages((prev) => [...(page?.records ?? []), ...prev])
      setHasMore(!!page?.hasMore)
    } finally {
      setLoadingMore(false)
    }
  }

  async function onNew() {
    if (atConversationLimit()) {
      message.warning(
        `会话数已达上限 ${settingsRef.current.maxConversationsPerUser || 500}，请先删除旧会话`,
      )
      return
    }
    abortGeneration()
    const res = await createConversation({ modelId: modelPickRef.current || undefined })
    await reloadSessions()
    if (res.data?.id) await openConversation(res.data.id)
  }

  function onDelete(item: Conversation) {
    Modal.confirm({
      title: '删除会话',
      content: '删除后会话不再可见，消息会保留在库中。',
      okType: 'danger',
      onOk: async () => {
        await deleteConversation(item.id)
        if (currentIdRef.current === item.id) {
          setCurrentId('')
          setMessages([])
          messagesRef.current = []
        }
        await reloadSessions()
      },
    })
  }

  async function onModelChange(id: string) {
    if (!currentIdRef.current) return
    await updateConversation(currentIdRef.current, { modelId: id })
    await reloadSessions()
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return
    e.preventDefault()
    void onSend()
  }

  const onSend = useCallback(
    async (extra?: { regenerateOf?: string; editOf?: string; content?: string }) => {
      if (streamingRef.current || sendingRef.current) return
      const seq = ++sendSeqRef.current
      sendingRef.current = true
      setSending(true)
      try {
        const content = extra?.content ?? draftRef.current.trim()
        const sendFiles =
          extra?.regenerateOf || extra?.editOf ? [] : supportsFiles ? [...chatFilesRef.current] : []
        if (!extra?.regenerateOf && !content && !sendFiles.length) return
        if (!hasModel) return
        if (!modelPickRef.current) {
          message.warning('请先选择模型')
          return
        }
        const maxChars = settingsRef.current.maxMessageChars || 32000
        if (!extra?.regenerateOf && content.length > maxChars) {
          message.warning(`输入超出 ${maxChars} 字，请精简后再发送`)
          return
        }
        if (!currentIdRef.current) {
          if (atConversationLimit()) {
            message.warning(
              `会话数已达上限 ${settingsRef.current.maxConversationsPerUser || 500}，请先删除旧会话`,
            )
            return
          }
          const created = await createConversation({ modelId: modelPickRef.current })
          if (seq !== sendSeqRef.current) return
          setCurrentId(created.data.id)
          currentIdRef.current = created.data.id
          await reloadSessions()
          if (seq !== sendSeqRef.current) return
        }
        const current = conversationsRef.current.find((c) => c.id === currentIdRef.current)
        const maxMessages = settingsRef.current.maxMessagesPerConversation || 1000
        if ((current?.messageCount ?? messagesRef.current.length) >= maxMessages) {
          message.warning(`该会话消息已达上限 ${maxMessages}，请新建会话继续`)
          return
        }
        if (!extra?.regenerateOf) {
          setDraft('')
          setChatFiles([])
        }
        if (!extra?.regenerateOf && !extra?.editOf) {
          setConversations((prev) =>
            prev.map((conv) => {
              if (conv.id !== currentIdRef.current || conv.title) return conv
              const compact = (content || sendFiles.map((f) => f.name).join(' '))
                .replace(/\s+/g, ' ')
                .trim()
              return { ...conv, title: compact.length <= 20 ? compact : compact.slice(0, 20) }
            }),
          )
        }
        if (seq !== sendSeqRef.current) return
        streamingRef.current = true
        setStreaming(true)
        paneRef.current?.stick()
        const controller = new AbortController()
        abortRef.current = controller
        const clientMsgId = `c-${crypto.randomUUID()}`
        setMessages((prev) => {
          const next = [...prev]
          if (!extra?.regenerateOf) {
            const fileNote = sendFiles.length
              ? `[附件: ${sendFiles.map((f) => f.name).join('、')}]`
              : ''
            next.push({
              id: `tmp-u-${clientMsgId}`,
              role: 'USER',
              content: content && fileNote ? `${content}\n\n${fileNote}` : content || fileNote,
              status: 'DONE',
              createdAt: formatDateTime(new Date()),
            })
          }
          next.push({
            id: `tmp-a-${clientMsgId}`,
            role: 'ASSISTANT',
            content: '',
            status: 'STREAMING',
            parentId: extra?.regenerateOf ? extra.regenerateOf : undefined,
            modelSnapshot: pickedModelLabel() || undefined,
            providerIcon: assistantIcon || undefined,
            createdAt: formatDateTime(new Date()),
          })
          messagesRef.current = next
          return next
        })
        await Promise.resolve()
        if (seq !== sendSeqRef.current) return
        paneRef.current?.scrollToBottom(true)
        try {
          await streamChat(
            {
              conversationId: currentIdRef.current,
              modelId: modelPickRef.current,
              content,
              clientMsgId,
              regenerateOf: extra?.regenerateOf,
              editOf: extra?.editOf,
              thinking: supportsThinking ? thinkingRef.current : undefined,
              files: sendFiles.length ? sendFiles : undefined,
            },
            {
              onMeta(meta) {
                if (seq !== sendSeqRef.current) return
                streamIdRef.current = meta.streamId
                if (meta.conversationTitle) {
                  setConversations((prev) =>
                    prev.map((conv) =>
                      conv.id === currentIdRef.current
                        ? { ...conv, title: meta.conversationTitle! }
                        : conv,
                    ),
                  )
                }
                setMessages((prev) => {
                  const next = [...prev]
                  const lastA = next[next.length - 1]
                  const lastU = next[next.length - 2]
                  if (lastU && lastU.role === 'USER' && meta.userMessageId) {
                    next[next.length - 2] = { ...lastU, id: meta.userMessageId }
                  }
                  if (lastA) {
                    next[next.length - 1] = {
                      ...lastA,
                      id: meta.assistantMessageId,
                      modelSnapshot: meta.modelSnapshot,
                      providerIcon: meta.providerIcon,
                      parentId: meta.userMessageId || lastA.parentId,
                    }
                  }
                  messagesRef.current = next
                  return next
                })
              },
              onDelta(chunk) {
                if (seq !== sendSeqRef.current) return
                setMessages((prev) => {
                  const last = prev[prev.length - 1]
                  if (!last || last.role !== 'ASSISTANT') return prev
                  const next = [...prev]
                  next[next.length - 1] = { ...last, content: last.content + chunk }
                  messagesRef.current = next
                  return next
                })
                paneRef.current?.scrollToBottom(false)
              },
              onThinking(chunk) {
                if (seq !== sendSeqRef.current) return
                setMessages((prev) => {
                  const last = prev[prev.length - 1]
                  if (!last || last.role !== 'ASSISTANT') return prev
                  const next = [...prev]
                  next[next.length - 1] = { ...last, thinking: (last.thinking || '') + chunk }
                  messagesRef.current = next
                  return next
                })
                paneRef.current?.scrollToBottom(false)
              },
              onDone() {
                if (seq !== sendSeqRef.current) return
                setMessages((prev) => {
                  const last = prev[prev.length - 1]
                  if (!last) return prev
                  const next = [...prev]
                  next[next.length - 1] = { ...last, status: 'DONE' }
                  messagesRef.current = next
                  return next
                })
                finishGeneration()
              },
              onError(code, errMessage) {
                if (seq !== sendSeqRef.current) return
                message.error(errMessage)
                setMessages((prev) => {
                  const last = prev[prev.length - 1]
                  if (!last || last.role !== 'ASSISTANT') return prev
                  const next = [...prev]
                  next[next.length - 1] = { ...last, status: 'FAILED', errorCode: code }
                  messagesRef.current = next
                  return next
                })
                finishGeneration()
              },
            },
            controller.signal,
          )
        } catch (e) {
          if ((e as Error).name !== 'AbortError') {
            message.error((e as Error).message || '发送失败')
          }
        } finally {
          if (seq === sendSeqRef.current) {
            finishGeneration()
            await reloadSessions()
            await refreshQuota()
          }
        }
      } finally {
        if (seq === sendSeqRef.current) {
          sendingRef.current = false
          setSending(false)
        }
      }
    },
    [assistantIcon, hasModel, supportsFiles, supportsThinking],
  )

  function flushStop(keepalive = false) {
    abortRef.current?.abort()
    const id = streamIdRef.current
    if (!id) return
    void stopChat(id, { keepalive }).catch(() => undefined)
  }

  function onStop() {
    flushStop()
    finishGeneration()
  }

  function onRegenerate(msg: ChatMessage) {
    void onSend({ regenerateOf: msg.id, content: '' })
  }

  function onEdit(msg: ChatMessage) {
    setEditMsg(msg)
    setEditContent(msg.content)
    setEditOpen(true)
  }

  function confirmEdit() {
    if (!editMsg) return
    const idx = messagesRef.current.findIndex((m) => m.id === editMsg.id)
    if (idx >= 0) {
      const next = messagesRef.current.slice(0, idx)
      setMessages(next)
      messagesRef.current = next
    }
    setEditOpen(false)
    void onSend({ editOf: editMsg.id, content: editContent })
  }

  function shiftVersion(msg: ChatMessage, delta: number) {
    if (!msg.parentId) return
    const list = messagesRef.current.filter(
      (m) => m.role === 'ASSISTANT' && m.parentId === msg.parentId,
    )
    const idx = list.findIndex((m) => m.id === msg.id) + delta
    if (idx < 0 || idx >= list.length) return
    setVersionPick((prev) => ({ ...prev, [msg.parentId!]: list[idx].id }))
  }

  async function copyText(text: string) {
    await navigator.clipboard.writeText(text || '')
    message.success('已复制')
  }

  useEffect(() => {
    function onPageHide() {
      flushStop(true)
    }
    window.addEventListener('pagehide', onPageHide)
    window.addEventListener('beforeunload', onPageHide)
    void (async () => {
      const [convRes, modelRes, quotaRes, settingRes] = await Promise.all([
        listConversations({ page: 1, size: SESSION_PAGE_SIZE }),
        listModels(),
        getMyQuota(),
        getAiSettings(),
      ])
      const records = convRes.data?.records ?? []
      const total = convRes.data?.total ?? records.length
      setConversations(records)
      setSessionTotal(total)
      setSessionHasMore(records.length < total)
      setModels(modelRes.data)
      modelsRef.current = modelRes.data
      setQuota(quotaRes.data)
      setSettings(settingRes.data)
      setModelPick(firstUsableId(modelRes.data))
      void probePickerModels()
    })()
    return () => {
      window.removeEventListener('pagehide', onPageHide)
      window.removeEventListener('beforeunload', onPageHide)
      probeSeqRef.current += 1
      flushStop(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="ai-chat">
      <SessionList
        conversations={conversations}
        currentId={currentId}
        hasModel={hasModel}
        hasMore={sessionHasMore}
        loadingMore={sessionLoadingMore}
        collapsed={sessionsCollapsed}
        onCreate={() => void onNew()}
        onOpen={(id) => void openConversation(id)}
        onRemove={onDelete}
        onLoadMore={() => void loadMoreSessions()}
        onToggle={toggleSessions}
      />
      <section className="ai-chat__main">
        <MessagePane
          ref={paneRef}
          hasModel={hasModel}
          unavailableMessage={models.unavailableMessage}
          currentId={currentId}
          messages={messages}
          visibleMessages={visibleMessages}
          streaming={streaming}
          hasMore={hasMore}
          loadingMore={loadingMore}
          hints={HINTS}
          assistantIcon={assistantIcon}
          onHint={setDraft}
          onLoadMore={() => void loadMore()}
          onCopy={(text) => void copyText(text)}
          onEdit={onEdit}
          onRegenerate={onRegenerate}
          onShiftVersion={shiftVersion}
        />
        <ModelSwitch
          modelPick={modelPick}
          models={pickerModels}
          streaming={streaming}
          hasModel={hasModel}
          quotaLow={quotaLow}
          onModelPick={setModelPick}
          onChange={(id) => void onModelChange(id)}
        />
        <Composer
          draft={draft}
          onDraftChange={setDraft}
          unbound={unbound}
          trialExhausted={trialExhausted}
          exceededTip={quota.exceededTip}
          canType={canType}
          canSend={canSend}
          streaming={streaming}
          maxChars={settings.maxMessageChars || 32000}
          placeholder={composerPlaceholder}
          supportsThinking={supportsThinking}
          supportsFiles={supportsFiles}
          thinking={thinking}
          files={chatFiles}
          onThinkingChange={setThinking}
          onFilesChange={setChatFiles}
          onKeyDown={onKeyDown}
          onStop={onStop}
          onSend={() => void onSend()}
        />
      </section>
      <Modal
        title="编辑重发"
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        onOk={confirmEdit}
        destroyOnHidden
      >
        <p style={{ marginBottom: 8, color: 'var(--app-text-muted)' }}>
          编辑后将截断这条之后的消息并重发
        </p>
        <Input.TextArea
          rows={5}
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
        />
      </Modal>
    </div>
  )
}
