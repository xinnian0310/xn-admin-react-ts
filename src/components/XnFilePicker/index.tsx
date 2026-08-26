import { useMemo, useState } from 'react'
import { Breadcrumb, Button, Checkbox, Input, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import XnDialog from '@/components/XnDialog'
import { browseFiles } from '@/api/file-job'
import { formatBytes } from '@/utils/upload/format'
import type { FileInfo } from '@/types'
import './xnFilePicker.scss'

export type FilePickerValue = string | string[]

export type XnFilePickerProps = {
  value?: FilePickerValue
  onChange?: (value: FilePickerValue, files?: FileInfo[]) => void
  /** 本地文件列表，传入后不请求接口 */
  data?: FileInfo[]
  multiple?: boolean
  disabled?: boolean
  allowClear?: boolean
  placeholder?: string
}

export default function XnFilePicker({
  value = '',
  onChange,
  data,
  multiple = false,
  disabled = false,
  allowClear = true,
  placeholder = '请选择文件',
}: XnFilePickerProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [prefix, setPrefix] = useState('')
  const [keyword, setKeyword] = useState('')
  const [rows, setRows] = useState<FileInfo[]>([])
  const [picked, setPicked] = useState<FileInfo[]>([])

  const hasValue = Array.isArray(value) ? value.length > 0 : !!value
  const displayText = Array.isArray(value) ? value.join(', ') : value || ''

  const crumbs = useMemo(() => {
    const parts = prefix.split('/').filter(Boolean)
    return parts.map((name, index) => ({
      name,
      path: parts.slice(0, index + 1).join('/'),
    }))
  }, [prefix])

  async function load(nextPrefix = prefix, nextKeyword = keyword) {
    if (data) {
      const q = nextKeyword.trim().toLowerCase()
      setRows(
        data.filter((item) => {
          const sameDir = (item.prefix || '') === nextPrefix || item.path.startsWith(nextPrefix)
          const nameOk = !q || item.name.toLowerCase().includes(q)
          return sameDir && nameOk
        }),
      )
      return
    }
    setLoading(true)
    try {
      const res = await browseFiles(nextPrefix, nextKeyword.trim() || undefined)
      setRows([...(res.data?.dirs || []), ...(res.data?.files || [])])
    } catch {
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  function handleOpen() {
    setPrefix('')
    setKeyword('')
    setPicked([])
    setOpen(true)
    void load('', '')
  }

  function go(path: string) {
    setPrefix(path)
    void load(path, keyword)
  }

  function isPicked(row: FileInfo) {
    return picked.some((item) => item.path === row.path)
  }

  function toggle(row: FileInfo, checked: boolean) {
    if (row.directory) return
    if (checked) {
      setPicked((prev) =>
        multiple ? [...prev.filter((item) => item.path !== row.path), row] : [row],
      )
    } else {
      setPicked((prev) => prev.filter((item) => item.path !== row.path))
    }
  }

  function confirm() {
    const paths = picked.map((item) => item.url || item.path)
    const next = multiple ? paths : paths[0] || ''
    onChange?.(next, picked)
    setOpen(false)
  }

  function clear() {
    const next = multiple ? [] : ''
    onChange?.(next, [])
  }

  const columns: ColumnsType<FileInfo> = [
    {
      width: 48,
      render: (_, row) =>
        row.directory ? null : (
          <Checkbox
            checked={isPicked(row)}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => toggle(row, e.target.checked)}
          />
        ),
    },
    {
      title: '名称',
      width: 220,
      render: (_, row) =>
        row.directory ? (
          <Button
            type="link"
            onClick={(e) => {
              e.stopPropagation()
              go(row.path)
            }}
          >
            {row.name}/
          </Button>
        ) : (
          row.name
        ),
    },
    {
      title: '大小',
      width: 110,
      render: (_, row) => (row.directory ? '—' : formatBytes(row.size)),
    },
    {
      title: '修改时间',
      width: 170,
      dataIndex: 'lastModified',
    },
  ]

  return (
    <div className="xn-file-picker">
      <Input
        value={displayText}
        readOnly
        disabled={disabled}
        placeholder={placeholder}
        addonAfter={
          <Button type="default" htmlType="button" disabled={disabled} onClick={handleOpen}>
            选择
          </Button>
        }
      />
      {allowClear && hasValue && !disabled ? (
        <Button type="link" danger onClick={clear}>
          清除
        </Button>
      ) : null}

      <XnDialog
        open={open}
        title="选择文件"
        width={760}
        confirmText="确定"
        confirmDisabled={!picked.length}
        onCancel={() => setOpen(false)}
        onConfirm={confirm}
      >
        <div className="xn-file-picker__bar">
          <Breadcrumb
            items={[
              {
                title: (
                  <Button type="link" onClick={() => go('')}>
                    根目录
                  </Button>
                ),
              },
              ...crumbs.map((seg) => ({
                title: (
                  <Button type="link" onClick={() => go(seg.path)}>
                    {seg.name}
                  </Button>
                ),
              })),
            ]}
          />
          <Input
            value={keyword}
            allowClear
            placeholder="搜索当前目录"
            style={{ width: 200 }}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={() => void load(prefix, keyword)}
          />
        </div>
        <Table
          rowKey="path"
          size="small"
          loading={loading}
          dataSource={rows}
          columns={columns}
          pagination={false}
          scroll={{ y: 360 }}
          onRow={(row) => ({
            onClick: () => {
              if (!row.directory) toggle(row, !isPicked(row))
            },
            onDoubleClick: () => {
              if (row.directory) {
                go(row.path)
                return
              }
              const files = multiple
                ? [...picked.filter((item) => item.path !== row.path), row]
                : [row]
              setPicked(files)
              const next = multiple
                ? files.map((item) => item.url || item.path)
                : files[0]?.url || files[0]?.path || ''
              onChange?.(next, files)
              setOpen(false)
            },
          })}
        />
      </XnDialog>
    </div>
  )
}
