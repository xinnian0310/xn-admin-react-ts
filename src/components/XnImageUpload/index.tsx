import { useEffect, useMemo, useRef, useState } from 'react'
import { Image, Upload, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { UploadFile, UploadProps } from 'antd'
import { uploadFile } from '@/api/file-job'
import { showCaughtError } from '@/utils/request'
import './xnImageUpload.scss'

const DEFAULT_ACCEPT = 'image/png,image/jpeg,image/jpg,image/webp,image/gif,image/svg+xml'

export type XnImageUploadProps = {
  value?: string | string[]
  onChange?: (value: string | string[]) => void
  /** 最多张数；1 表示单张 */
  limit?: number
  disabled?: boolean
  accept?: string
  /** 单张大小上限（字节）；默认 5MB */
  maxSize?: number
  tip?: string
  /** 自定义上传，返回可访问 URL；不传则走 /files/upload */
  request?: (file: File) => Promise<string>
}

function normalizeUrls(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => (item || '').trim()).filter(Boolean)
  }
  const text = (value || '').trim()
  return text ? [text] : []
}

function fileNameOf(url: string, index: number) {
  const path = url.split('?')[0] || ''
  const name = path.substring(path.lastIndexOf('/') + 1)
  return name || `image-${index + 1}`
}

export default function XnImageUpload({
  value,
  onChange,
  limit = 1,
  disabled = false,
  accept = DEFAULT_ACCEPT,
  maxSize = 5 * 1024 * 1024,
  tip = '',
  request,
}: XnImageUploadProps) {
  const urls = useMemo(() => normalizeUrls(value), [value])
  const urlsRef = useRef(urls)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewIndex, setPreviewIndex] = useState(0)

  useEffect(() => {
    urlsRef.current = urls
  }, [urls])

  const fileList: UploadFile[] = urls.map((url, index) => ({
    uid: url,
    name: fileNameOf(url, index),
    status: 'done',
    url,
  }))

  const emitValue = (list: string[]) => {
    onChange?.(limit === 1 ? list[0] || '' : list)
  }

  const beforeUpload: UploadProps['beforeUpload'] = (file) => {
    const types = accept
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)
    const mime = (file.type || '').toLowerCase()
    const ext = file.name.includes('.')
      ? file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
      : ''
    const matched = types.some((type) => {
      if (type.endsWith('/*')) return mime.startsWith(type.slice(0, -1))
      if (type.startsWith('.')) return ext === type
      return mime === type
    })
    if (types.length && !matched) {
      message.warning('仅支持图片文件')
      return Upload.LIST_IGNORE
    }
    if (maxSize > 0 && file.size > maxSize) {
      message.warning(`图片不能超过 ${Math.round(maxSize / 1024 / 1024)}MB`)
      return Upload.LIST_IGNORE
    }
    return true
  }

  const customRequest: UploadProps['customRequest'] = async (options) => {
    const file = options.file as File
    try {
      const url = request ? await request(file) : (await uploadFile(file)).data?.url?.trim()
      if (!url) throw new Error('上传失败')
      const next =
        limit === 1
          ? [url]
          : [...urlsRef.current.filter((item) => item !== url), url].slice(0, limit)
      urlsRef.current = next
      emitValue(next)
      options.onSuccess?.(url)
    } catch (error) {
      showCaughtError(error, '上传失败')
      options.onError?.(error as Error)
    }
  }

  const onRemove: UploadProps['onRemove'] = (file) => {
    const url = (file.url || '').trim()
    const next = urlsRef.current.filter((item) => item !== url)
    urlsRef.current = next
    emitValue(next)
    return true
  }

  const onPreview: UploadProps['onPreview'] = (file) => {
    const url = (file.url || '').trim()
    const index = urls.indexOf(url)
    if (index < 0) return
    setPreviewIndex(index)
    setPreviewOpen(true)
  }

  const onExceed = () => {
    message.warning(limit === 1 ? '仅允许上传一张图片' : `最多上传 ${limit} 张图片`)
  }

  return (
    <div className={`xn-image-upload${disabled || urls.length >= limit ? ' is-full' : ''}`}>
      <Upload
        disabled={disabled}
        accept={accept}
        listType="picture-card"
        fileList={fileList}
        maxCount={limit}
        multiple={limit > 1}
        beforeUpload={beforeUpload}
        customRequest={customRequest}
        onRemove={onRemove}
        onPreview={onPreview}
        onChange={(info) => {
          if (info.fileList.length > limit) onExceed()
        }}
      >
        {disabled || urls.length >= limit ? null : (
          <button type="button" className="xn-image-upload__plus">
            <PlusOutlined />
          </button>
        )}
      </Upload>
      {tip ? <div className="xn-image-upload__tip">{tip}</div> : null}
      <div className="xn-image-upload__preview">
        <Image.PreviewGroup
          preview={{
            open: previewOpen,
            current: previewIndex,
            onOpenChange: (visible) => setPreviewOpen(visible),
            onChange: (current) => setPreviewIndex(current),
          }}
        >
          {urls.map((url) => (
            <Image key={url} src={url} />
          ))}
        </Image.PreviewGroup>
      </div>
    </div>
  )
}
