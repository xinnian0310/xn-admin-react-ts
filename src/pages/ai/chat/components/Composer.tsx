import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react'
import { Button, Input, Tooltip, message } from 'antd'
import { BulbOutlined, PaperClipOutlined, PauseOutlined, SendOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import type { ChatFilePayload } from '@/types/ai/conversation'

const MAX_FILES = 4
const MAX_BYTES = 2 * 1024 * 1024
const ALLOWED = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  'application/pdf',
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/json',
])

interface Props {
  unbound: boolean
  trialExhausted: boolean
  exceededTip?: string
  draft: string
  canType: boolean
  canSend: boolean
  streaming: boolean
  maxChars: number
  placeholder: string
  supportsThinking: boolean
  supportsFiles: boolean
  thinking: boolean
  files: ChatFilePayload[]
  onDraftChange: (value: string) => void
  onThinkingChange: (value: boolean) => void
  onFilesChange: (value: ChatFilePayload[]) => void
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void
  onStop: () => void
  onSend: () => void
}

function isImage(file: ChatFilePayload) {
  return (file.mime || '').startsWith('image/')
}

function previewSrc(file: ChatFilePayload) {
  if (file.data.startsWith('data:')) return file.data
  return `data:${file.mime || 'application/octet-stream'};base64,${file.data}`
}

function normalizeMime(type: string, name: string) {
  const lower = (type || '').toLowerCase()
  if (lower === 'image/jpg') return 'image/jpeg'
  if (ALLOWED.has(lower)) return lower
  const n = name.toLowerCase()
  if (n.endsWith('.png')) return 'image/png'
  if (n.endsWith('.jpg') || n.endsWith('.jpeg')) return 'image/jpeg'
  if (n.endsWith('.gif')) return 'image/gif'
  if (n.endsWith('.webp')) return 'image/webp'
  if (n.endsWith('.bmp')) return 'image/bmp'
  if (n.endsWith('.pdf')) return 'application/pdf'
  if (n.endsWith('.md')) return 'text/markdown'
  if (n.endsWith('.csv')) return 'text/csv'
  if (n.endsWith('.json')) return 'application/json'
  if (n.endsWith('.txt')) return 'text/plain'
  return lower
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export default function Composer({
  unbound,
  trialExhausted,
  exceededTip,
  draft,
  canType,
  canSend,
  streaming,
  maxChars,
  placeholder,
  supportsThinking,
  supportsFiles,
  thinking,
  files,
  onDraftChange,
  onThinkingChange,
  onFilesChange,
  onKeyDown,
  onStop,
  onSend,
}: Props) {
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement | null>(null)

  async function addFiles(list: File[]) {
    if (!list.length) return
    const next = [...files]
    for (const file of list) {
      if (next.length >= MAX_FILES) {
        message.warning(`最多上传 ${MAX_FILES} 个文件`)
        break
      }
      const mime = normalizeMime(file.type, file.name)
      if (!ALLOWED.has(mime)) {
        message.warning(`不支持的文件类型：${file.name}`)
        continue
      }
      if (file.size > MAX_BYTES) {
        message.warning(`单个附件不超过 2MB：${file.name}`)
        continue
      }
      const data = await readAsDataUrl(file)
      next.push({ name: file.name, mime, data })
    }
    onFilesChange(next)
  }

  function onPaste(e: ClipboardEvent<HTMLDivElement>) {
    if (!supportsFiles || !canType) return
    const fromFiles = Array.from(e.clipboardData?.files || [])
    const fromItems: File[] = []
    for (const item of Array.from(e.clipboardData?.items || [])) {
      if (item.kind !== 'file') continue
      const file = item.getAsFile()
      if (file) fromItems.push(file)
    }
    const list = fromFiles.length ? fromFiles : fromItems
    if (!list.length) return
    e.preventDefault()
    void addFiles(list)
  }

  return (
    <footer className="ai-chat__composer">
      {unbound ? (
        <div className="ai-chat__tip">原模型已删除，请先选择模型再发送</div>
      ) : trialExhausted ? (
        <div className="ai-chat__tip">
          {exceededTip || '本月试用额度已用完'}
          <Button type="link" onClick={() => navigate('/ai/models')}>
            去添加我的模型
          </Button>
        </div>
      ) : null}
      <div
        className={`ai-chat__input-wrap${supportsThinking || supportsFiles ? ' has-tools' : ''}`}
        onPaste={onPaste}
      >
        {files.length ? (
          <div className="ai-chat__files">
            {files.map((file, idx) => (
              <span key={`${file.name}-${idx}`} className="ai-chat__file">
                {isImage(file) ? (
                  <img src={previewSrc(file)} alt="" className="ai-chat__file-thumb" />
                ) : null}
                <span className="ai-chat__file-name" title={file.name}>
                  {file.name}
                </span>
                <button
                  type="button"
                  className="ai-chat__file-x"
                  disabled={!canType}
                  onClick={() => onFilesChange(files.filter((_, i) => i !== idx))}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : null}
        <Input.TextArea
          value={draft}
          autoSize={{ minRows: 3, maxRows: 8 }}
          disabled={!canType}
          maxLength={maxChars}
          placeholder={placeholder}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={onKeyDown}
        />
        {supportsThinking || supportsFiles ? (
          <div className="ai-chat__tools">
            {supportsThinking ? (
              <button
                type="button"
                className={`ai-chat__tool${thinking ? ' is-on' : ''}`}
                disabled={!canType}
                onClick={() => onThinkingChange(!thinking)}
              >
                <BulbOutlined />
                深度思考
              </button>
            ) : null}
            {supportsFiles ? (
              <button
                type="button"
                className="ai-chat__tool"
                disabled={!canType}
                onClick={() => canType && fileRef.current?.click()}
              >
                <PaperClipOutlined />
                上传
              </button>
            ) : null}
          </div>
        ) : null}
        <input
          ref={fileRef}
          className="ai-chat__file-input"
          type="file"
          multiple
          accept="image/*,.pdf,.txt,.md,.csv,.json,application/pdf,text/plain"
          onChange={(e) => {
            const list = e.target.files ? Array.from(e.target.files) : []
            e.target.value = ''
            void addFiles(list)
          }}
        />
        <Tooltip title={streaming ? '停止生成' : '发送'} placement="top">
          <span className="ai-chat__send-hit">
            <Button
              className="ai-chat__send-btn"
              shape="circle"
              type="primary"
              color={streaming ? 'orange' : undefined}
              variant={streaming ? 'solid' : undefined}
              icon={streaming ? <PauseOutlined /> : <SendOutlined />}
              disabled={!streaming && !canSend}
              onClick={streaming ? onStop : onSend}
            />
          </span>
        </Tooltip>
      </div>
    </footer>
  )
}
