import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type Key,
  type ReactNode,
} from 'react'
import { Button, Pagination, Space, Switch, Table, Tag, Tooltip, message } from 'antd'
import type { ColumnsType, TableProps } from 'antd/es/table'
import { ReloadOutlined, SettingOutlined } from '@ant-design/icons'
import { CrudApiContext } from '@/hooks/useCrudApi'
import { loadCrudApi } from '@/utils/api-loader'
import type { CrudApiModule } from '@/types/crud'
import type { PageResult } from '@/types'
import type { ButtonListItem } from '@/types/button'
import type { TableColumnItem, TableColumnOption } from '@/types/table'
import { formatDateTime, isIsoDateTimeLike } from '@/utils/datetime'
import { estimateTableActionsWidth } from '@/utils/table-actions'
import { getTableColumns, saveTableColumns, type TableColumnSetting } from '@/api/table-column'
import XnAppIcon from '@/components/XnAppIcon'
import { XnTableActions } from '@/components/XnButton'
import XnEmpty, { type XnEmptyType } from '@/components/XnEmpty'
import XnLongText from '@/components/XnLongText'
import { usePermission } from '@/hooks/usePermission'
import ColumnSettingDialog from './ColumnSettingDialog'
import './xnTable.scss'

export interface XnTableHandle {
  openSave: (mode: string, id?: number | string) => void
  handleDelete: (row: Record<string, unknown>) => Promise<void>
  handleAction: (action: string, row?: Record<string, unknown>) => void
  loadData: () => Promise<void>
  selected: Record<string, unknown>[]
  getApi: () => CrudApiModule | null
}

interface XnTableProps {
  data?: unknown[]
  columns?: TableColumnItem[]
  loading?: boolean
  tableHeight?: string | number
  showPagination?: boolean
  page?: number
  pageSize?: number
  total?: number
  pageSizes?: number[]
  api?: string
  queryParams?: Record<string, unknown>
  listFilter?: (row: Record<string, unknown>) => boolean
  entityName?: string
  nameField?: string
  idField?: string
  immediate?: boolean
  tableKey?: string
  actionItems?: ButtonListItem[]
  stripe?: boolean
  rowKey?: string | ((row: Record<string, unknown>) => Key)
  onPageChange?: (page: number, pageSize: number) => void
  /** 刷新：data 模式下优先于 onPageChange，用于真正重新拉数 */
  onRefresh?: () => void
  onSelectionChange?: (rows: unknown[]) => void
  onSwitchChange?: (payload: { row: Record<string, unknown>; prop: string; value: unknown }) => void
  onDataChange?: (rows: unknown[]) => void
  onSuccess?: () => void
  emptyType?: XnEmptyType
  emptyDescription?: string
  slots?: Record<string, (ctx: { row: Record<string, unknown>; index: number }) => ReactNode>
}

function columnIdentity(col: TableColumnItem) {
  if (col.prop) return col.prop
  if (col.slot) return `slot:${col.slot}`
  if (col.type) return `type:${col.type}`
  return `label:${col.label ?? ''}`
}

function toSettingRow(col: TableColumnItem, index: number): TableColumnSetting {
  const widthNum = col.width == null || col.width === '' ? undefined : Number(col.width)
  const locked = col.type === 'selection'
  return {
    key: columnIdentity(col),
    prop: col.prop,
    label: locked ? '选择框' : col.label,
    width: Number.isFinite(widthNum) ? widthNum : undefined,
    visible: col.visible !== false,
    sort: index,
    locked,
  }
}

function applyColumnSettings(
  defaults: TableColumnItem[],
  settings: TableColumnSetting[],
): TableColumnItem[] {
  if (!settings.length) {
    return defaults.map((col) => ({ ...col }))
  }
  const defaultMap = new Map(defaults.map((col) => [columnIdentity(col), col]))
  const used = new Set<string>()
  const result: TableColumnItem[] = []
  const sorted = [...settings].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))

  for (const setting of sorted) {
    const base = defaultMap.get(setting.key)
    if (!base) continue
    used.add(setting.key)
    result.push({
      ...base,
      label: base.type === 'selection' ? '选择框' : (setting.label ?? base.label),
      width: setting.width ?? base.width,
      visible: setting.visible !== false,
    })
  }

  for (const col of defaults) {
    const key = columnIdentity(col)
    if (!used.has(key)) {
      result.push({ ...col })
    }
  }
  return result
}

function emptyOf(col: TableColumnItem) {
  return col.emptyText ?? '—'
}

function getCellValue(row: Record<string, unknown>, prop?: string) {
  if (!prop) return undefined
  return row[prop]
}

function formatText(row: Record<string, unknown>, col: TableColumnItem) {
  const raw = getCellValue(row, col.prop)
  if (raw == null || raw === '') return emptyOf(col)
  let text = String(raw)
  if (col.type === 'datetime' || isIsoDateTimeLike(text)) {
    text = formatDateTime(text) || text
  }
  return `${col.prefix || ''}${text}${col.suffix || ''}`
}

function resolveOption(
  row: Record<string, unknown>,
  col: TableColumnItem,
): TableColumnOption | undefined {
  const raw = getCellValue(row, col.prop)
  return (col.options || []).find((o) => String(o.value) === String(raw))
}

const XnTable = forwardRef<XnTableHandle, XnTableProps>(function XnTable(props, ref) {
  const {
    data,
    columns = [],
    loading: externalLoading,
    showPagination = true,
    page: pageProp = 1,
    pageSize: pageSizeProp = 10,
    total: totalProp = 0,
    pageSizes = [10, 20, 50, 100],
    api,
    queryParams,
    listFilter,
    idField = 'id',
    immediate = true,
    tableKey,
    actionItems,
    rowKey = 'id',
    onPageChange,
    onRefresh,
    onSelectionChange,
    onSwitchChange,
    onDataChange,
    onSuccess,
    emptyType = 'data',
    emptyDescription,
    slots,
  } = props

  const { hasPermission } = usePermission()
  const [innerPage, setInnerPage] = useState(pageProp)
  const [innerPageSize, setInnerPageSize] = useState(pageSizeProp)
  const [innerData, setInnerData] = useState<Record<string, unknown>[]>([])
  const [innerTotal, setInnerTotal] = useState(0)
  const [innerLoading, setInnerLoading] = useState(false)
  const [selected, setSelected] = useState<Record<string, unknown>[]>([])
  const [selectedKeys, setSelectedKeys] = useState<Key[]>([])
  const [savedColumnSettings, setSavedColumnSettings] = useState<TableColumnSetting[]>([])
  const [columnSettingVisible, setColumnSettingVisible] = useState(false)
  const [columnSaving, setColumnSaving] = useState(false)
  const [apiModule, setApiModule] = useState<CrudApiModule | null>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const [scrollY, setScrollY] = useState<number>()

  const isApiMode = Boolean(api)
  const currentPage = isApiMode ? innerPage : pageProp
  const currentPageSize = isApiMode ? innerPageSize : pageSizeProp
  const displayLoading = isApiMode ? innerLoading : Boolean(externalLoading)
  const displayData = (isApiMode ? innerData : (data as Record<string, unknown>[]) || []) as Record<
    string,
    unknown
  >[]
  const displayTotal = isApiMode ? innerTotal : totalProp

  const resolvedColumns = useMemo(
    () => applyColumnSettings(columns, savedColumnSettings),
    [columns, savedColumnSettings],
  )
  const visibleColumns = useMemo(
    () => resolvedColumns.filter((col) => col.visible !== false),
    [resolvedColumns],
  )
  const settingRows = useMemo(
    () => resolvedColumns.map((col, index) => toSettingRow(col, index)),
    [resolvedColumns],
  )

  useLayoutEffect(() => {
    const el = bodyRef.current
    if (!el) return
    const measure = () => {
      const h = el.getBoundingClientRect().height
      if (h <= 0) return
      // 表头高度：优先量实际 sticky header，否则回退 thead / 47
      const head = el.querySelector('.ant-table-header, .ant-table-thead') as HTMLElement | null
      const headH = head?.getBoundingClientRect().height || 47
      const next = Math.max(120, Math.floor(h - headH))
      setScrollY(next)
      el.style.setProperty('--xn-table-scroll-y', `${next}px`)
    }
    measure()
    const raf = requestAnimationFrame(() => measure())
    const ro = new ResizeObserver(() => measure())
    ro.observe(el)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [displayData.length, displayLoading, showPagination])

  const loadData = useCallback(async () => {
    if (!api) return
    const mod = apiModule || loadCrudApi(api)
    if (!apiModule) setApiModule(mod)
    setInnerLoading(true)
    try {
      const res = await mod.list({
        ...queryParams,
        page: currentPage - 1,
        size: currentPageSize,
      })
      const payload = res.data as PageResult<Record<string, unknown>> | Record<string, unknown>[]
      if (Array.isArray(payload)) {
        let rows = payload
        if (listFilter) rows = rows.filter(listFilter)
        const start = (currentPage - 1) * currentPageSize
        setInnerTotal(rows.length)
        setInnerData(rows.slice(start, start + currentPageSize))
        onDataChange?.(rows)
      } else {
        let rows = payload.records || []
        if (listFilter) rows = rows.filter(listFilter)
        setInnerData(rows)
        setInnerTotal(payload.total ?? rows.length)
        onDataChange?.(rows)
      }
    } finally {
      setInnerLoading(false)
    }
  }, [api, apiModule, queryParams, currentPage, currentPageSize, listFilter, onDataChange])

  useEffect(() => {
    if (api && immediate) void loadData()
  }, [api, immediate, loadData])

  useEffect(() => {
    if (!tableKey) {
      setSavedColumnSettings([])
      return
    }
    void getTableColumns(tableKey)
      .then((res) => {
        setSavedColumnSettings(res.data?.columns ?? [])
      })
      .catch(() => {
        setSavedColumnSettings([])
      })
  }, [tableKey])

  const visibleActionItems = useMemo(
    () => (actionItems || []).filter((item) => !item.permission || hasPermission(item.permission)),
    [actionItems, hasPermission],
  )

  const actionsColumnWidth = useMemo(
    () => (visibleActionItems.length ? estimateTableActionsWidth(visibleActionItems) : undefined),
    [visibleActionItems],
  )

  function isActionsColumn(col: TableColumnItem, slotName?: string) {
    return slotName === 'actions' || col.slot === 'actions' || col.label === '操作'
  }

  const antdColumns: ColumnsType<Record<string, unknown>> = useMemo(() => {
    const cols: ColumnsType<Record<string, unknown>> = []

    for (const col of visibleColumns) {
      if (col.type === 'selection') continue

      if (col.type === 'index') {
        cols.push({
          title: col.label || '#',
          width: col.width ?? 60,
          fixed: col.fixed === true ? 'left' : col.fixed || undefined,
          align: col.align || 'center',
          render: (_v, _r, index) => (currentPage - 1) * currentPageSize + index + (col.index ?? 1),
        })
        continue
      }

      const slotName = col.slot || col.prop
      if (col.type === 'slot' && slotName && slots?.[slotName]) {
        const actions = isActionsColumn(col, slotName)
        cols.push({
          title: col.label,
          dataIndex: col.prop,
          // 操作列：始终按可见按钮估算宽度（覆盖页面过窄 width），保证不换行
          width: actions && actionsColumnWidth != null ? actionsColumnWidth : col.width,
          minWidth:
            actions && actionsColumnWidth != null
              ? actionsColumnWidth
              : typeof col.minWidth === 'number'
                ? col.minWidth
                : undefined,
          fixed: actions ? 'right' : col.fixed === true ? 'left' : col.fixed || undefined,
          align: col.align || (actions ? 'center' : undefined),
          className: actions ? 'xn-table-col-actions' : undefined,
          onCell: actions ? () => ({ style: { whiteSpace: 'nowrap' } }) : undefined,
          render: (_v, row, index) => slots[slotName]!({ row, index }),
        })
        continue
      }

      if (col.type === 'tag') {
        cols.push({
          title: col.label,
          dataIndex: col.prop,
          width: col.width,
          render: (_v, row) => {
            const opt = resolveOption(row, col)
            if (!opt) return emptyOf(col)
            const color =
              opt.type === 'danger'
                ? 'error'
                : opt.type === 'info'
                  ? 'default'
                  : opt.type || 'default'
            return <Tag color={color}>{opt.label}</Tag>
          },
        })
        continue
      }

      if (col.type === 'switch') {
        cols.push({
          title: col.label,
          dataIndex: col.prop,
          width: col.width,
          render: (_v, row) => (
            <Switch
              checked={getCellValue(row, col.prop) === (col.activeValue ?? 1)}
              disabled={Boolean(col.disabledProp && row[col.disabledProp])}
              onChange={(checked) => {
                const value = checked ? (col.activeValue ?? 1) : (col.inactiveValue ?? 0)
                onSwitchChange?.({ row, prop: col.prop || '', value })
              }}
            />
          ),
        })
        continue
      }

      if (col.type === 'iconText') {
        cols.push({
          title: col.label,
          dataIndex: col.prop,
          width: col.width,
          render: (_v, row) => {
            const iconName = String(row[col.iconProp || 'icon'] || '')
            return (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {iconName ? <XnAppIcon name={iconName} size={col.iconSize || 16} /> : null}
                <span>{formatText(row, col)}</span>
              </span>
            )
          },
        })
        continue
      }

      if (col.type === 'longText') {
        cols.push({
          title: col.label,
          dataIndex: col.prop,
          width: col.width,
          render: (_v, row) => (
            <XnLongText
              text={String(getCellValue(row, col.prop) ?? '')}
              title={col.label || '详细内容'}
              emptyText={emptyOf(col)}
              maxLength={col.longTextMaxLength ?? 48}
            />
          ),
        })
        continue
      }

      if (col.type === 'slot' && slotName === 'actions' && visibleActionItems.length) {
        cols.push({
          title: col.label || '操作',
          key: 'actions',
          fixed: 'right',
          align: 'center',
          width: actionsColumnWidth || estimateTableActionsWidth(visibleActionItems),
          className: 'xn-table-col-actions',
          onCell: () => ({ style: { whiteSpace: 'nowrap' } }),
          render: (_v, row) => (
            <XnTableActions
              items={visibleActionItems}
              row={row}
              onActionClick={({ action }) => handleAction(action, row)}
            />
          ),
        })
        continue
      }

      cols.push({
        title: col.label,
        dataIndex: col.prop,
        width: col.width,
        minWidth: typeof col.minWidth === 'number' ? col.minWidth : undefined,
        fixed: col.fixed === true ? 'left' : col.fixed || undefined,
        align: col.align,
        ellipsis: col.showOverflowTooltip,
        render: (_v, row) => formatText(row, col),
      })
    }

    return cols
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    visibleColumns,
    slots,
    actionItems,
    visibleActionItems,
    actionsColumnWidth,
    currentPage,
    currentPageSize,
    hasPermission,
    onSwitchChange,
  ])

  async function handleDelete(row: Record<string, unknown>) {
    const mod = apiModule || (api ? loadCrudApi(api) : null)
    if (!mod) return
    const id = row[idField]
    await mod.remove(id as number)
    message.success('删除成功')
    onSuccess?.()
    if (isApiMode) await loadData()
  }

  function handleAction(action: string, row?: Record<string, unknown>) {
    if (action === 'delete' && row) void handleDelete(row)
    // add/edit/view 由外部 save 组件或 slots 处理
  }

  function openSave(_mode: string, _id?: number | string) {
    // 由页面持有 save 组件时自行处理；api 模式可扩展
  }

  useImperativeHandle(ref, () => ({
    openSave,
    handleDelete,
    handleAction,
    loadData,
    selected,
    getApi: () => apiModule,
  }))

  const hasSelection = visibleColumns.some((c) => c.type === 'selection')

  const rowSelection: TableProps<Record<string, unknown>>['rowSelection'] | undefined = hasSelection
    ? {
        selectedRowKeys: selectedKeys,
        onChange: (keys, rows) => {
          setSelectedKeys(keys)
          setSelected(rows)
          onSelectionChange?.(rows)
        },
      }
    : undefined

  function handlePageChange(p: number, s: number) {
    if (isApiMode) {
      setInnerPage(p)
      setInnerPageSize(s)
    }
    onPageChange?.(p, s)
  }

  async function openColumnSetting() {
    if (!tableKey) {
      message.warning('未配置 tableKey，无法使用列设置')
      return
    }
    setColumnSettingVisible(true)
  }

  async function handleSaveColumns(nextColumns: TableColumnSetting[]) {
    if (!tableKey) return
    setColumnSaving(true)
    try {
      const res = await saveTableColumns({
        tableKey,
        columns: nextColumns,
      })
      setSavedColumnSettings(res.data?.columns ?? nextColumns)
      setColumnSettingVisible(false)
      message.success('列设置已保存')
    } finally {
      setColumnSaving(false)
    }
  }

  async function handleResetColumns() {
    if (!tableKey) return
    const defaults = columns.map((col, index) => toSettingRow(col, index))
    setColumnSaving(true)
    try {
      const res = await saveTableColumns({
        tableKey,
        columns: defaults,
      })
      setSavedColumnSettings(res.data?.columns ?? defaults)
      setColumnSettingVisible(false)
      message.success('已恢复默认列设置')
    } finally {
      setColumnSaving(false)
    }
  }

  function handleRefresh() {
    if (isApiMode) {
      void loadData()
      return
    }
    if (onRefresh) {
      onRefresh()
      return
    }
    onPageChange?.(currentPage, currentPageSize)
  }

  return (
    <CrudApiContext.Provider value={apiModule}>
      <div className="xn-table">
        <div className="xn-table__body" ref={bodyRef}>
          <Table
            size="middle"
            rowKey={rowKey as TableProps<Record<string, unknown>>['rowKey']}
            loading={displayLoading}
            columns={antdColumns}
            dataSource={displayData}
            pagination={false}
            rowSelection={rowSelection}
            scroll={{ x: 'max-content', y: scrollY }}
            locale={{
              emptyText: <XnEmpty type={emptyType} description={emptyDescription} size="small" />,
            }}
          />
        </div>
        {showPagination ? (
          <div className="xn-table__pagination">
            <Pagination
              current={currentPage}
              pageSize={currentPageSize}
              total={displayTotal}
              pageSizeOptions={pageSizes.map(String)}
              showSizeChanger
              showQuickJumper
              showTotal={(t) => `共 ${t} 条`}
              onChange={handlePageChange}
            />
            <Space>
              <Tooltip title="刷新">
                <Button shape="circle" icon={<ReloadOutlined />} onClick={handleRefresh} />
              </Tooltip>
              {tableKey ? (
                <Tooltip title="列设置">
                  <Button
                    shape="circle"
                    icon={<SettingOutlined />}
                    onClick={() => void openColumnSetting()}
                  />
                </Tooltip>
              ) : null}
            </Space>
          </div>
        ) : null}
      </div>

      {tableKey ? (
        <ColumnSettingDialog
          open={columnSettingVisible}
          columns={settingRows}
          saving={columnSaving}
          onCancel={() => setColumnSettingVisible(false)}
          onSave={(cols) => void handleSaveColumns(cols)}
          onReset={() => void handleResetColumns()}
        />
      ) : null}
    </CrudApiContext.Provider>
  )
})

export default XnTable
