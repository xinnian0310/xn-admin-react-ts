import { Modal, Typography } from 'antd'

interface XnLongTextProps {
  text?: string
  title?: string
  emptyText?: string
  maxLength?: number
}

export default function XnLongText({
  text = '',
  title = '详细内容',
  emptyText = '—',
  maxLength = 48,
}: XnLongTextProps) {
  if (!text) return <span>{emptyText}</span>
  if (text.length <= maxLength) return <span>{text}</span>

  return (
    <Typography.Link
      onClick={() => {
        Modal.info({
          title,
          width: 640,
          content: <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{text}</pre>,
        })
      }}
    >
      {text.slice(0, maxLength)}…
    </Typography.Link>
  )
}
