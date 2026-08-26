import { useMemo, type CSSProperties } from 'react'
import XnCopy from '@/components/XnCopy'
import { formatCode, splitLines, tokenizeJson, type CodeLanguage } from '@/utils/code-format'
import './xnCode.scss'

export type XnCodeProps = {
  value?: unknown
  language?: CodeLanguage
  title?: string
  maxHeight?: string
  showCopy?: boolean
  style?: CSSProperties
  className?: string
}

export default function XnCode({
  value = '',
  language = 'text',
  title = '',
  maxHeight = '280px',
  showCopy = true,
  style,
  className,
}: XnCodeProps) {
  const source = useMemo(() => formatCode(value, language), [value, language])
  const textLines = useMemo(() => splitLines(source), [source])
  const jsonLines = useMemo(() => splitLines(source).map((line) => tokenizeJson(line)), [source])

  return (
    <div className={['xn-code', className].filter(Boolean).join(' ')} style={style}>
      {title || showCopy ? (
        <div className="xn-code__bar">
          <span className="xn-code__title">{title || language.toUpperCase()}</span>
          {showCopy ? <XnCopy text={source} label="复制" /> : null}
        </div>
      ) : null}
      <div className="xn-code__body" style={{ maxHeight }}>
        {language === 'json' ? (
          <div className="xn-code__lines">
            {jsonLines.map((line, index) => (
              <div key={index} className="xn-code__line">
                <span className="xn-code__ln">{index + 1}</span>
                <code className="xn-code__content">
                  {line.map((token, ti) => (
                    <span key={ti} className={`is-${token.type}`}>
                      {token.text}
                    </span>
                  ))}
                </code>
              </div>
            ))}
          </div>
        ) : (
          <div className="xn-code__lines">
            {textLines.map((line, index) => (
              <div key={index} className="xn-code__line">
                <span className="xn-code__ln">{index + 1}</span>
                <code className="xn-code__content">{line || ' '}</code>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
