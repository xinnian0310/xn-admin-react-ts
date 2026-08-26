import { useState } from 'react'
import { Button, Input, InputNumber, Space, Switch } from 'antd'
import { HolderOutlined } from '@ant-design/icons'
import type { TableColumnSetting } from '@/api/table-column'
import './columnSettingDialog.scss'
import XnModal from '@/components/XnModal'

function isLocked(row: TableColumnSetting) {
  return !!row.locked || row.key === 'type:selection'
}

function mapSettingRows(columns: TableColumnSetting[]): TableColumnSetting[] {
  return columns.map((col, index) => {
    const locked = isLocked(col)
    return {
      ...col,
      label: locked ? '选择框' : col.label,
      visible: col.visible !== false,
      sort: index,
      width: col.width == null ? undefined : Number(col.width),
      locked,
    }
  })
}

interface ColumnSettingDialogProps {
  open: boolean
  columns: TableColumnSetting[]
  saving?: boolean
  onCancel: () => void
  onSave: (columns: TableColumnSetting[]) => void
  onReset: () => void
}

export default function ColumnSettingDialog({
  open,
  columns,
  saving = false,
  onCancel,
  onSave,
  onReset,
}: ColumnSettingDialogProps) {
  const [rows, setRows] = useState<TableColumnSetting[]>([])
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [snapshot, setSnapshot] = useState<{ open: boolean; columns: TableColumnSetting[] }>({
    open: false,
    columns,
  })

  if (open && (!snapshot.open || snapshot.columns !== columns)) {
    setSnapshot({ open: true, columns })
    setRows(mapSettingRows(columns))
    setDragIndex(null)
  } else if (!open && snapshot.open) {
    setSnapshot({ open: false, columns: snapshot.columns })
  }

  function updateRow(index: number, patch: Partial<TableColumnSetting>) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  function onDragStart(index: number, event: React.DragEvent) {
    if (isLocked(rows[index])) {
      event.preventDefault()
      return
    }
    setDragIndex(index)
    event.dataTransfer.setData('text/plain', String(index))
    event.dataTransfer.effectAllowed = 'move'
  }

  function onDragOver(index: number) {
    if (dragIndex == null || dragIndex === index) return
    if (isLocked(rows[index]) || isLocked(rows[dragIndex])) return
    setRows((prev) => {
      const list = [...prev]
      const [moved] = list.splice(dragIndex, 1)
      list.splice(index, 0, moved)
      return list
    })
    setDragIndex(index)
  }

  function handleSave() {
    onSave(
      rows.map((row, index) => ({
        ...row,
        label: isLocked(row) ? '选择框' : row.label,
        visible: row.visible !== false,
        sort: index,
        width: row.width == null ? undefined : Number(row.width),
      })),
    )
  }

  return (
    <XnModal
      title="列设置"
      open={open}
      onCancel={onCancel}
      width="min(960px, 94vw)"
      destroyOnHidden
      className="column-setting-dialog"
      footer={
        <Space>
          <Button onClick={onReset}>恢复默认</Button>
          <Button onClick={onCancel}>取消</Button>
          <Button type="primary" loading={saving} onClick={handleSave}>
            保存
          </Button>
        </Space>
      }
    >
      <div className="column-setting">
        <div className="column-setting__head">
          <span className="col-drag" />
          <span className="col-label">列名</span>
          <span className="col-prop">字段值</span>
          <span className="col-width">宽度</span>
          <span className="col-enable">是否启用</span>
        </div>

        {rows.map((row, index) => {
          const locked = isLocked(row)
          return (
            <div
              key={row.key}
              className={[
                'column-setting__row',
                dragIndex === index ? 'is-dragging' : '',
                locked ? 'is-locked' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              draggable={!locked}
              onDragStart={(e) => onDragStart(index, e)}
              onDragOver={(e) => {
                e.preventDefault()
                onDragOver(index)
              }}
              onDrop={(e) => {
                e.preventDefault()
                onDragOver(index)
                setDragIndex(null)
              }}
              onDragEnd={() => setDragIndex(null)}
            >
              <span className="col-drag" title={locked ? '固定列不可拖动' : '拖动排序'}>
                <HolderOutlined />
              </span>
              <span className="col-label">
                <Input
                  value={row.label}
                  placeholder="列名"
                  disabled={locked}
                  onChange={(e) => updateRow(index, { label: e.target.value })}
                />
              </span>
              <span className="col-prop">
                <Input value={row.prop || '—'} disabled />
              </span>
              <span className="col-width">
                <InputNumber
                  value={row.width ?? undefined}
                  min={40}
                  max={800}
                  step={10}
                  placeholder="自适应"
                  disabled={locked}
                  style={{ width: '100%' }}
                  onChange={(v) =>
                    updateRow(index, { width: typeof v === 'number' ? v : undefined })
                  }
                />
              </span>
              <span className="col-enable">
                <Switch
                  checked={row.visible !== false}
                  onChange={(checked) => updateRow(index, { visible: checked })}
                />
              </span>
            </div>
          )
        })}
      </div>
    </XnModal>
  )
}
