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
import { Button, Modal, Pagination, Space, Switch, Table, Tag, Tooltip, message } from 'antd'
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
import { getTableColumns, saveTableColumns } from '@/api/table-column'
import XnAppIcon from '@/components/XnAppIcon'
import XnLongText from '@/components/XnLongText'
import { usePermission } from '@/hooks/usePermission'
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
  onSelectionChange?: (rows: unknown[]) => void
  onSwitchChange?: (payload: { row: Record<string, unknown>; prop: string; value: unknown }) => void
  onDataChange?: (rows: unknown[]) => void
  onSuccess?: () => void
  slots?: Record<string, (ctx: { row: Record<string, unknown>; index: number }) => ReactNode>
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
    entityName = '数据',
    nameField = 'name',
    idField = 'id',
    immediate = true,
    tableKey,
    actionItems,
    rowKey = 'id',
    onPageChange,
    onSelectionChange,
    onSwitchChange,
    onDataChange,
    onSuccess,
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
  const [columnPrefs, setColumnPrefs] = useState<Record<string, boolean>>({})
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

  useLayoutEffect(() => {
    const el = bodyRef.current
    if (!el) return
    const measure = () => {
      const h = el.getBoundingClientRect().height
      if (h <= 0) return
      // 表头高度：优先量实际 thead，否则回退 47
      const head = el.querySelector('.ant-table-header, .ant-table-thead') as HTMLElement | null
      const headH = head?.getBoundingClientRect().height || 47
      setScrollY(Math.max(120, Math.floor(h - headH)))
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
    if (!tableKey) return
    void getTableColumns(tableKey)
      .then((res) => {
        const map: Record<string, boolean> = {}
        for (const c of res.data?.columns || []) {
          if (c.prop) map[c.prop] = c.visible !== false
        }
        setColumnPrefs(map)
      })
      .catch(() => {
        /* ignore */
      })
  }, [tableKey])

  const visibleColumns = useMemo(() => {
    return columns.filter((col) => {
      if (col.visible === false) return false
      if (col.prop && col.prop in columnPrefs) return columnPrefs[col.prop]
      return true
    })
  }, [columns, columnPrefs])

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
        cols.push({
          title: col.label,
          dataIndex: col.prop,
          width: col.width,
          minWidth: typeof col.minWidth === 'number' ? col.minWidth : undefined,
          fixed: col.fixed === true ? 'left' : col.fixed || undefined,
          align: col.align,
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

      if (col.type === 'slot' && slotName === 'actions' && actionItems?.length) {
        cols.push({
          title: col.label || '操作',
          key: 'actions',
          fixed: 'right',
          width: col.width || estimateTableActionsWidth(actionItems),
          render: (_v, row) => (
            <Space size={0}>
              {actionItems
                .filter((item) => !item.permission || hasPermission(item.permission))
                .map((item) => {
                  const action = item.action || item.name
                  return (
                    <Button
                      key={action}
                      type="link"
                      size="small"
                      danger={item.typeColor === 'danger'}
                      onClick={() => handleAction(action, row)}
                    >
                      {item.name}
                    </Button>
                  )
                })}
            </Space>
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
    currentPage,
    currentPageSize,
    hasPermission,
    onSwitchChange,
  ])

  async function handleDelete(row: Record<string, unknown>) {
    const mod = apiModule || (api ? loadCrudApi(api) : null)
    if (!mod) return
    const id = row[idField]
    const label = String(row[nameField] ?? id ?? '')
    Modal.confirm({
      title: '确认删除',
      content: `确定删除${entityName}「${label}」吗？`,
      okType: 'danger',
      onOk: async () => {
        await mod.remove(id as number)
        message.success('删除成功')
        onSuccess?.()
        if (isApiMode) await loadData()
      },
    })
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
    if (!tableKey) return
    Modal.info({
      title: '列设置',
      content: '列个性化设置将在后续完善；当前已支持从服务端读取列可见性偏好。',
    })
    try {
      await saveTableColumns({
        tableKey,
        columns: columns
          .filter((c) => c.prop)
          .map((c, index) => ({
            key: c.prop!,
            prop: c.prop!,
            label: c.label,
            visible: columnPrefs[c.prop!] !== false,
            sort: index,
          })),
      })
    } catch {
      /* ignore */
    }
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
                <Button
                  shape="circle"
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    if (isApiMode) void loadData()
                    else onPageChange?.(currentPage, currentPageSize)
                  }}
                />
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
    </CrudApiContext.Provider>
  )
})

export default XnTable
