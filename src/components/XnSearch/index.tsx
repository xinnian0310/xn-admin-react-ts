import { useMemo, useState } from 'react'
import { Button, DatePicker, Form, Input, InputNumber, Select, Space } from 'antd'
import dayjs from 'dayjs'
import type { SearchForm, SearchItem } from '@/types/search'
import { SEARCH_FIELD_DEFAULT_WIDTH } from '@/types/search'
import { DownOutlined, UpOutlined } from '@ant-design/icons'
import './xnSearch.scss'

interface XnSearchProps {
  searchItem?: SearchItem[]
  onQueryForm?: (form: SearchForm) => void
  onReset?: (form: SearchForm) => void
  collapseCount?: number
}

function stripEmpty(form: SearchForm): SearchForm {
  const next: SearchForm = {}
  for (const [k, v] of Object.entries(form)) {
    if (v === '' || v === undefined || v === null) continue
    if (Array.isArray(v) && v.length === 0) continue
    next[k] = v
  }
  return next
}

export default function XnSearch({
  searchItem = [],
  onQueryForm,
  onReset,
  collapseCount = 3,
}: XnSearchProps) {
  const [form] = Form.useForm()
  const [expanded, setExpanded] = useState(false)

  const visibleItems = useMemo(() => {
    if (expanded || searchItem.length <= collapseCount) return searchItem
    return searchItem.slice(0, collapseCount)
  }, [searchItem, expanded, collapseCount])

  function handleQuery() {
    const values = form.getFieldsValue(true) as SearchForm
    onQueryForm?.(stripEmpty(values))
  }

  function handleReset() {
    form.resetFields()
    const values = form.getFieldsValue(true) as SearchForm
    onReset?.(stripEmpty(values))
  }

  return (
    <Form form={form} layout="inline" className="xn-search" onFinish={handleQuery}>
      {visibleItems.map((item) => {
        const width = item.width || SEARCH_FIELD_DEFAULT_WIDTH
        const controlWidth = typeof width === 'number' ? width : undefined
        return (
          <Form.Item key={item.prop} name={item.prop} label={item.label}>
            <div
              className="xn-search__control"
              style={controlWidth ? { width: controlWidth } : undefined}
            >
              {renderField(item)}
            </div>
          </Form.Item>
        )
      })}
      <Form.Item className="xn-search__actions">
        <Space>
          <Button type="primary" htmlType="submit">
            查询
          </Button>
          <Button onClick={handleReset}>重置</Button>
          {searchItem.length > collapseCount ? (
            <Button
              type="link"
              onClick={() => setExpanded((v) => !v)}
              icon={expanded ? <UpOutlined /> : <DownOutlined />}
            >
              {expanded ? '收起' : '展开'}
            </Button>
          ) : null}
        </Space>
      </Form.Item>
    </Form>
  )
}

function renderField(item: SearchItem) {
  const placeholder = item.placeholder || `请输入${item.label}`
  switch (item.type) {
    case 'number':
      return <InputNumber style={{ width: '100%' }} placeholder={placeholder} />
    case 'select':
      return (
        <Select
          allowClear={item.clearable !== false}
          mode={item.multiple ? 'multiple' : undefined}
          placeholder={item.placeholder || `请选择${item.label}`}
          options={(item.options || []).map((o) => ({
            label: o.label,
            value: o.value as string | number,
          }))}
          style={{ width: '100%' }}
        />
      )
    case 'date':
      return <DatePicker style={{ width: '100%' }} allowClear={item.clearable !== false} />
    case 'datetime':
      return <DatePicker showTime style={{ width: '100%' }} allowClear={item.clearable !== false} />
    case 'daterange':
      return (
        <DatePicker.RangePicker
          style={{ width: '100%' }}
          allowClear={item.clearable !== false}
          presets={[
            { label: '近7天', value: [dayjs().subtract(7, 'day'), dayjs()] },
            { label: '近30天', value: [dayjs().subtract(30, 'day'), dayjs()] },
          ]}
        />
      )
    default:
      return <Input allowClear={item.clearable !== false} placeholder={placeholder} />
  }
}
