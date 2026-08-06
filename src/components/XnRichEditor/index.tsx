import { useEffect, useState } from 'react'
import { Editor, Toolbar } from '@wangeditor/editor-for-react'
import type { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor'
import '@wangeditor/editor/dist/css/style.css'

export interface XnRichEditorProps {
  value?: string
  onChange?: (html: string) => void
  disabled?: boolean
  height?: string | number
  placeholder?: string
}

/** wangEditor 富文本，HTML 字符串契约与基准 xnRichEditor 一致 */
export default function XnRichEditor({
  value = '',
  onChange,
  disabled = false,
  height = '320px',
  placeholder = '请输入公告内容',
}: XnRichEditorProps) {
  const [editor, setEditor] = useState<IDomEditor | null>(null)
  const heightCss = typeof height === 'number' ? `${height}px` : height

  useEffect(() => {
    return () => {
      if (!editor) return
      editor.destroy()
      setEditor(null)
    }
  }, [editor])

  useEffect(() => {
    if (!editor) return
    if (disabled) editor.disable()
    else editor.enable()
  }, [disabled, editor])

  const toolbarConfig: Partial<IToolbarConfig> = {
    excludeKeys: ['uploadVideo', 'insertVideo', 'group-video'],
  }

  const editorConfig: Partial<IEditorConfig> = {
    placeholder,
    readOnly: disabled,
  }

  return (
    <div
      className={`xn-rich-editor${disabled ? ' is-disabled' : ''}`}
      style={{
        border: '1px solid var(--ant-color-border, #d9d9d9)',
        borderRadius: 6,
        overflow: 'hidden',
        background: 'var(--app-card-bg, #fff)',
      }}
    >
      {!disabled ? (
        <Toolbar
          editor={editor}
          defaultConfig={toolbarConfig}
          mode="default"
          style={{ borderBottom: '1px solid var(--ant-color-border, #d9d9d9)' }}
        />
      ) : null}
      <Editor
        defaultConfig={editorConfig}
        value={value}
        onCreated={setEditor}
        onChange={(ed) => onChange?.(ed.getHtml())}
        mode="default"
        style={{ height: heightCss, overflowY: 'auto' }}
      />
    </div>
  )
}
