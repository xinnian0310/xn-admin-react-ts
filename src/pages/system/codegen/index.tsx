import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Checkbox,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Steps,
  Table,
  message,
} from 'antd'
import XnPageLayout from '@/components/XnPageLayout'
import XnSearch from '@/components/XnSearch'
import XnButton, { XnTableActions } from '@/components/XnButton'
import XnTable from '@/components/XnTable'
import { usePageUi } from '@/hooks/usePageUi'
import {
  generate,
  listColumns,
  listTables,
  type ColumnMeta,
  type TableCodegenColumnRequest,
  type TableCodegenRequest,
  type TableInfo,
} from '@/api/codegen'
import type { SearchForm, SearchItem } from '@/types/search'
import type { TableColumnItem } from '@/types/table'

const fallbackSearchItems: SearchItem[] = [
  { label: '综合查询', prop: 'FuzzyWord', type: 'input', placeholder: '搜索表名/备注' },
  {
    label: '系统表',
    prop: 'includeSys',
    type: 'select',
    placeholder: '是否包含',
    options: [
      { label: '是', value: 'true' },
      { label: '否', value: 'false' },
    ],
  },
]

const javaTypes = [
  'String',
  'Integer',
  'Long',
  'Double',
  'BigDecimal',
  'Boolean',
  'LocalDateTime',
  'LocalDate',
]

const listColumnsDef: TableColumnItem[] = [
  { type: 'selection', width: 50, fixed: true },
  { prop: 'tableName', label: '表名', minWidth: 220 },
  { prop: 'remarks', label: '备注', minWidth: 220, showOverflowTooltip: true },
  { type: 'slot', slot: 'actions', label: '操作', width: 100, fixed: 'right' },
]

function toModulePrefix(table: string): string {
  const parts = table.split('_').filter(Boolean)
  if (parts.length <= 1) return table.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase()
  return parts
    .slice(1)
    .join('-')
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .toLowerCase()
}

function toClassName(prefix: string): string {
  return prefix
    .split(/[-_]/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join('')
}

function downloadZipBase64(base64: string, filename: string) {
  const bin = atob(base64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  const blob = new Blob([bytes], { type: 'application/zip' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function SystemCodegenPage() {
  const pageUi = usePageUi('/system/codegen')
  const { buttonItems, tableButtonItems } = pageUi
  const searchItems = pageUi.searchItems.length ? pageUi.searchItems : fallbackSearchItems

  const [loading, setLoading] = useState(false)
  const [allTables, setAllTables] = useState<TableInfo[]>([])
  const [tableData, setTableData] = useState<TableInfo[]>([])
  const [selected, setSelected] = useState<TableInfo[]>([])
  const [queryForm, setQueryForm] = useState<SearchForm>({ includeSys: 'true' })

  const [wizardVisible, setWizardVisible] = useState(false)
  const [wizardLoading, setWizardLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [step, setStep] = useState(0)
  const [tableRemarks, setTableRemarks] = useState('')
  const [form, setForm] = useState<TableCodegenRequest>({
    tableName: '',
    modulePrefix: '',
    className: '',
    apiBasePath: '',
    menuTitle: '',
    menuPath: '',
    viewPath: '',
    persistPermissions: true,
    generatePageUi: true,
    createMenu: true,
    columns: [],
  })

  const canNext = useMemo(() => {
    if (step === 0) {
      return (
        !!form.modulePrefix?.trim() &&
        !!form.apiBasePath?.trim() &&
        !!form.menuTitle?.trim() &&
        !!form.menuPath?.trim() &&
        !!form.viewPath?.trim()
      )
    }
    if (step === 1) return (form.columns || []).length > 0
    return true
  }, [step, form])

  function applyFilter(source = allTables, nextQuery = queryForm) {
    const kw = String(nextQuery.FuzzyWord ?? '')
      .trim()
      .toLowerCase()
    setTableData(
      kw
        ? source.filter(
            (t) =>
              (t.tableName || '').toLowerCase().includes(kw) ||
              (t.remarks || '').toLowerCase().includes(kw),
          )
        : [...source],
    )
  }

  async function loadData(nextQuery = queryForm) {
    setLoading(true)
    try {
      const includeSys = String(nextQuery.includeSys ?? 'true') === 'true'
      const res = await listTables(includeSys)
      const list = res.data ?? []
      setAllTables(list)
      applyFilter(list, nextQuery)
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : '加载库表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function onModulePrefixBlur() {
    setForm((prev) => {
      const p = (prev.modulePrefix || '').trim()
      if (!p) return prev
      return {
        ...prev,
        className: prev.className || toClassName(p),
        apiBasePath: prev.apiBasePath || `/api/${p.replace(/-/g, '')}`,
        menuPath: prev.menuPath || `/${p.replace(/-/g, '/')}`,
        viewPath: prev.viewPath || p.replace(/-/g, '/'),
      }
    })
  }

  async function openWizard(row: TableInfo) {
    setStep(0)
    setWizardVisible(true)
    setWizardLoading(true)
    setTableRemarks(row.remarks || '')
    const prefix = toModulePrefix(row.tableName)
    const next: TableCodegenRequest = {
      tableName: row.tableName,
      modulePrefix: prefix,
      className: toClassName(prefix),
      apiBasePath: `/api/${prefix.replace(/-/g, '')}`,
      menuTitle: row.remarks || toClassName(prefix) || prefix,
      menuPath: `/${prefix.replace(/-/g, '/')}`,
      viewPath: prefix.replace(/-/g, '/'),
      persistPermissions: true,
      generatePageUi: true,
      createMenu: true,
      columns: [],
    }
    setForm(next)
    try {
      const res = await listColumns(row.tableName)
      setForm({
        ...next,
        columns: (res.data ?? []).map((c: ColumnMeta) => ({
          columnName: c.columnName,
          label: c.label || c.remarks || c.columnName,
          javaType: c.javaType,
          javaField: c.javaField,
          formType: c.formType || 'input',
          pk: c.pk,
          nullable: c.nullable,
          columnSize: c.columnSize,
          listShow: c.listShow,
          queryable: c.queryable,
          formShow: c.formShow,
          required: c.required,
        })),
      })
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : '加载表结构失败')
      setWizardVisible(false)
    } finally {
      setWizardLoading(false)
    }
  }

  function updateColumn(columnName: string, patch: Partial<TableCodegenColumnRequest>) {
    setForm((prev) => ({
      ...prev,
      columns: prev.columns.map((c) => (c.columnName === columnName ? { ...c, ...patch } : c)),
    }))
  }

  async function doGenerate() {
    if (!canNext || !form.tableName) return
    setGenerating(true)
    try {
      const res = await generate({ ...form, columns: [...form.columns] })
      const data = res.data
      if (data?.zipBase64) {
        downloadZipBase64(data.zipBase64, `${data.className || form.tableName}-codegen.zip`)
      }
      message.success('生成成功，已下载 ZIP')
      setWizardVisible(false)
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : '生成失败')
    } finally {
      setGenerating(false)
    }
  }

  function buttonClick(action: string) {
    if (action === 'refresh' || action === 'view') {
      void loadData()
      return
    }
    if (action === 'generate') {
      if (selected.length !== 1) {
        message.warning('请选择一张表进行生成')
        return
      }
      void openWizard(selected[0])
    }
  }

  return (
    <>
      <XnPageLayout
        showViewSwitch={false}

        search={
          <XnSearch
            searchItem={searchItems}
            onQueryForm={(formData) => {
              setQueryForm(formData)
              void loadData(formData)
            }}
            onReset={() => {
              const next = { includeSys: 'true' }
              setQueryForm(next)
              void loadData(next)
            }}
          />
        }
        toolbar={
          <XnButton listItem={buttonItems} selected={selected} onButtonClick={buttonClick} />
        }
        table={
          <XnTable
            data={tableData as unknown as Record<string, unknown>[]}
            total={tableData.length}
            loading={loading}
            showPagination={false}
            tableKey="system:codegen"
            entityName="数据表"
            nameField="tableName"
            rowKey="tableName"
            columns={listColumnsDef}
            actionItems={tableButtonItems}
            onSelectionChange={(rows) => setSelected(rows as unknown as TableInfo[])}
            slots={{
              actions: ({ row }) => (
                <XnTableActions
                  items={tableButtonItems}
                  row={row}
                  onActionClick={({ action, row: r }) => {
                    if (action === 'generate') void openWizard(r as unknown as TableInfo)
                  }}
                />
              ),
            }}
          />
        }
      />

      <Modal
        title={`代码生成 — ${form.tableName || ''}`}
        open={wizardVisible}
        onCancel={() => setWizardVisible(false)}
        width={960}
        destroyOnHidden
        confirmLoading={wizardLoading}
        afterClose={() => {
          setStep(0)
          setForm((prev) => ({ ...prev, columns: [] }))
        }}
        footer={
          <Space>
            <Button onClick={() => setWizardVisible(false)}>取消</Button>
            {step > 0 ? <Button onClick={() => setStep((s) => s - 1)}>上一步</Button> : null}
            {step < 2 ? (
              <Button
                type="primary"
                disabled={!canNext || wizardLoading}
                onClick={() => setStep((s) => s + 1)}
              >
                下一步
              </Button>
            ) : (
              <Button
                type="primary"
                loading={generating}
                disabled={!canNext || !form.tableName}
                onClick={() => void doGenerate()}
              >
                生成并下载
              </Button>
            )}
          </Space>
        }
      >
        <Steps
          current={step}
          style={{ marginBottom: 24 }}
          items={[{ title: '基本信息' }, { title: '字段配置' }, { title: '生成选项' }]}
        />
        {step === 0 ? (
          <Form labelCol={{ span: 6 }} wrapperCol={{ span: 16 }}>
            <Form.Item label="表名">
              <Input value={form.tableName} disabled />
            </Form.Item>
            <Form.Item label="表备注">
              <Input value={tableRemarks} disabled />
            </Form.Item>
            <Form.Item label="模块前缀" required>
              <Input
                value={form.modulePrefix}
                placeholder="如 order、product"
                onChange={(e) => setForm((prev) => ({ ...prev, modulePrefix: e.target.value }))}
                onBlur={onModulePrefixBlur}
              />
            </Form.Item>
            <Form.Item label="类名">
              <Input
                value={form.className}
                placeholder="如 Order（空则由前缀推导）"
                onChange={(e) => setForm((prev) => ({ ...prev, className: e.target.value }))}
              />
            </Form.Item>
            <Form.Item label="API 路径" required>
              <Input
                value={form.apiBasePath}
                placeholder="/api/orders"
                onChange={(e) => setForm((prev) => ({ ...prev, apiBasePath: e.target.value }))}
              />
            </Form.Item>
            <Form.Item label="菜单标题" required>
              <Input
                value={form.menuTitle}
                placeholder="侧边栏显示名"
                onChange={(e) => setForm((prev) => ({ ...prev, menuTitle: e.target.value }))}
              />
            </Form.Item>
            <Form.Item label="菜单路径" required>
              <Input
                value={form.menuPath}
                placeholder="/biz/orders"
                onChange={(e) => setForm((prev) => ({ ...prev, menuPath: e.target.value }))}
              />
            </Form.Item>
            <Form.Item label="视图目录" required>
              <Input
                value={form.viewPath}
                placeholder="biz/orders"
                onChange={(e) => setForm((prev) => ({ ...prev, viewPath: e.target.value }))}
              />
            </Form.Item>
          </Form>
        ) : null}

        {step === 1 ? (
          <Table
            size="small"
            rowKey="columnName"
            pagination={false}
            scroll={{ y: 420 }}
            dataSource={form.columns}
            columns={[
              { title: '列名', dataIndex: 'columnName', fixed: 'left', width: 120 },
              {
                title: '显示名',
                dataIndex: 'label',
                width: 120,
                render: (_: unknown, row: TableCodegenColumnRequest) => (
                  <Input
                    size="small"
                    value={row.label}
                    onChange={(e) => updateColumn(row.columnName, { label: e.target.value })}
                  />
                ),
              },
              {
                title: 'Java 类型',
                dataIndex: 'javaType',
                width: 130,
                render: (_: unknown, row: TableCodegenColumnRequest) => (
                  <Select
                    size="small"
                    style={{ width: '100%' }}
                    value={row.javaType}
                    options={javaTypes.map((t) => ({ label: t, value: t }))}
                    onChange={(v) => updateColumn(row.columnName, { javaType: v })}
                  />
                ),
              },
              {
                title: '列表',
                dataIndex: 'listShow',
                width: 70,
                align: 'center' as const,
                render: (_: unknown, row: TableCodegenColumnRequest) => (
                  <Checkbox
                    checked={row.listShow}
                    onChange={(e) => updateColumn(row.columnName, { listShow: e.target.checked })}
                  />
                ),
              },
              {
                title: '查询',
                dataIndex: 'queryable',
                width: 70,
                align: 'center' as const,
                render: (_: unknown, row: TableCodegenColumnRequest) => (
                  <Checkbox
                    checked={row.queryable}
                    onChange={(e) => updateColumn(row.columnName, { queryable: e.target.checked })}
                  />
                ),
              },
              {
                title: '表单',
                dataIndex: 'formShow',
                width: 70,
                align: 'center' as const,
                render: (_: unknown, row: TableCodegenColumnRequest) => (
                  <Checkbox
                    checked={row.formShow}
                    disabled={row.pk}
                    onChange={(e) => updateColumn(row.columnName, { formShow: e.target.checked })}
                  />
                ),
              },
              {
                title: '必填',
                dataIndex: 'required',
                width: 70,
                align: 'center' as const,
                render: (_: unknown, row: TableCodegenColumnRequest) => (
                  <Checkbox
                    checked={row.required}
                    disabled={row.pk || !row.formShow}
                    onChange={(e) => updateColumn(row.columnName, { required: e.target.checked })}
                  />
                ),
              },
              {
                title: '控件',
                dataIndex: 'formType',
                width: 120,
                render: (_: unknown, row: TableCodegenColumnRequest) => (
                  <Select
                    size="small"
                    style={{ width: '100%' }}
                    value={row.formType}
                    options={[
                      { label: '输入框', value: 'input' },
                      { label: '数字', value: 'number' },
                      { label: '下拉', value: 'select' },
                      { label: '日期', value: 'datetime' },
                      { label: '文本域', value: 'textarea' },
                    ]}
                    onChange={(v) => updateColumn(row.columnName, { formType: v })}
                  />
                ),
              },
            ]}
          />
        ) : null}

        {step === 2 ? (
          <div>
            <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
              <Checkbox
                checked={form.persistPermissions}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, persistPermissions: e.target.checked }))
                }
              >
                写入权限并授予超管
              </Checkbox>
              <Checkbox
                checked={form.generatePageUi}
                onChange={(e) => setForm((prev) => ({ ...prev, generatePageUi: e.target.checked }))}
              >
                写入 PageUi 配置
              </Checkbox>
              <Checkbox
                checked={form.createMenu}
                onChange={(e) => setForm((prev) => ({ ...prev, createMenu: e.target.checked }))}
              >
                创建菜单路由
              </Checkbox>
            </Space>
            <Alert
              type="info"
              showIcon
              message="将生成后端 CRUD + 前端标准列表页（XnPageLayout / XnSearch / XnButton / XnTable），打包 ZIP 下载；请按包内 README 拷贝到工程后重启。"
            />
          </div>
        ) : null}
      </Modal>
    </>
  )
}
