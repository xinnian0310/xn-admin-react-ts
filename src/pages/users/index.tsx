import { useEffect, useMemo, useRef, useState } from 'react'
import { Avatar, Card, Switch, Tag, message, Modal } from 'antd'
import XnPageLayout from '@/components/XnPageLayout'
import XnTreePanel from '@/components/XnTreePanel'
import XnSearch from '@/components/XnSearch'
import XnButton, { XnTableActions } from '@/components/XnButton'
import XnTable from '@/components/XnTable'
import XnImport, { type XnImportHandle } from '@/components/XnImport'
import XnAuth from '@/components/XnAuth'
import UserSave, { type UserSaveHandle } from './save'
import { usePageUi } from '@/hooks/usePageUi'
import { list, batchRemove, remove, updateStatus, importUsers, exportUsers } from '@/api/user'
import { getOptions as getRoleOptions } from '@/api/role'
import { getTree as getUnitTree } from '@/api/unit'
import { getOptions as getPostOptions } from '@/api/post'
import type { Post, Role, SysUnit, User } from '@/types'
import type { ExcelImportColumn } from '@/types/excel'
import type { SearchForm } from '@/types/search'
import type { SaveMode } from '@/types/save'
import type { TableColumnItem } from '@/types/table'

interface UnitTreeNode extends Record<string, unknown> {
  id: number
  name: string
  children?: UnitTreeNode[]
}

function mapUnitNodes(nodes: SysUnit[]): UnitTreeNode[] {
  return nodes.map((n) => ({
    id: n.id,
    name: n.name,
    children: n.children?.length ? mapUnitNodes(n.children) : undefined,
  }))
}

function flattenUnits(
  nodes: SysUnit[],
  path: string[] = [],
): Array<{ code: string; label: string }> {
  const result: Array<{ code: string; label: string }> = []
  for (const node of nodes) {
    const names = [...path, node.name]
    result.push({ code: node.code, label: names.length > 1 ? names.join(' / ') : node.name })
    if (node.children?.length) result.push(...flattenUnits(node.children, names))
  }
  return result
}

function inheritedRoles(row: User): Role[] {
  const directIds = new Set((row.roleList || []).map((r) => r.id))
  return (row.unitRoleList || []).filter((r) => !directIds.has(r.id))
}

export default function UsersPage() {
  const { searchItems, buttonItems, tableButtonItems, setSearchItems } = usePageUi('/users')
  const saveRef = useRef<UserSaveHandle>(null)
  const importRef = useRef<XnImportHandle>(null)
  const [loading, setLoading] = useState(false)
  const [tableData, setTableData] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)
  const [queryForm, setQueryForm] = useState<SearchForm>({})
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table')
  const [selected, setSelected] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [unitNodes, setUnitNodes] = useState<SysUnit[]>([])
  const [unitKeyword, setUnitKeyword] = useState('')
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null)

  const unitTree = useMemo(() => mapUnitNodes(unitNodes), [unitNodes])

  const userImportColumns = useMemo<ExcelImportColumn[]>(() => {
    const roleOptions = roles
      .filter((r) => r.code !== 'SUPER_ADMIN')
      .map((r) => ({ label: r.name, value: r.code }))
    const unitOptions = flattenUnits(unitNodes).map((u) => ({ label: u.label, value: u.code }))
    const postOptions = posts.map((p) => ({ label: p.name, value: p.code }))
    return [
      { key: 'username', title: '用户名', required: true, example: 'zhangsan', width: 14 },
      { key: 'password', title: '密码', example: 'User123456', width: 14 },
      { key: 'nickname', title: '昵称', example: '张三', width: 12 },
      { key: 'email', title: '邮箱', example: 'zhangsan@example.com', width: 22 },
      { key: 'phone', title: '手机号', example: '13800138000', width: 14 },
      {
        key: 'roleCodes',
        title: '角色',
        example:
          roleOptions.find((o) => o.value === 'USER')?.label || roleOptions[0]?.label || '普通用户',
        width: 16,
        options: roleOptions,
      },
      {
        key: 'unitCode',
        title: '单位',
        example: unitOptions[0]?.label || '研发一部',
        width: 18,
        options: unitOptions,
      },
      {
        key: 'postCode',
        title: '岗位',
        example:
          postOptions.find((o) => o.value === 'staff')?.label ||
          postOptions[0]?.label ||
          '普通员工',
        width: 14,
        options: postOptions,
      },
      {
        key: 'status',
        title: '状态',
        example: '启用',
        width: 10,
        options: [
          { label: '启用', value: '1' },
          { label: '禁用', value: '0' },
        ],
      },
    ]
  }, [roles, unitNodes, posts])

  const columns: TableColumnItem[] = [
    { type: 'selection', width: 50, fixed: true },
    { prop: 'username', label: '用户名', minWidth: 120 },
    { prop: 'nickname', label: '昵称', minWidth: 120 },
    { prop: 'unitName', label: '单位', minWidth: 140 },
    { prop: 'postName', label: '岗位', minWidth: 120 },
    { prop: 'email', label: '邮箱', minWidth: 180 },
    { prop: 'phone', label: '手机号', minWidth: 130 },
    { type: 'slot', slot: 'roles', prop: 'roleList', label: '角色', minWidth: 160 },
    { type: 'slot', slot: 'status', prop: 'status', label: '状态', width: 100 },
    { prop: 'createdAt', label: '创建时间', minWidth: 170, type: 'datetime' },
    { type: 'slot', slot: 'actions', label: '操作', fixed: 'right' },
  ]

  useEffect(() => {
    void getRoleOptions().then((res) => setRoles(res.data || []))
    void getUnitTree().then((res) => setUnitNodes(res.data || []))
    void getPostOptions().then((res) => setPosts(res.data || []))
  }, [])

  useEffect(() => {
    setSearchItems((prev) =>
      prev.map((item) =>
        item.prop === 'roleId'
          ? { ...item, options: roles.map((r) => ({ label: r.name, value: r.id })) }
          : item,
      ),
    )
  }, [roles, setSearchItems])

  async function loadData(nextPage = page, nextSize = size, nextQuery = queryForm) {
    setLoading(true)
    try {
      const roleIdRaw = nextQuery.roleId
      const roleId =
        roleIdRaw === '' || roleIdRaw === undefined || roleIdRaw === null
          ? undefined
          : Number(roleIdRaw)
      const res = await list({
        page: nextPage - 1,
        size: nextSize,
        keyword: String(nextQuery.FuzzyWord ?? '').trim() || undefined,
        roleId: Number.isFinite(roleId) ? roleId : undefined,
        unitId: selectedUnitId ?? undefined,
      })
      setTableData(res.data.records)
      setTotal(res.data.total)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUnitId])

  function openSave(mode: SaveMode, id?: number) {
    void saveRef.current?.open(mode, id)
  }

  function tableActionDisabled(action: string, row: Record<string, unknown>) {
    if (action === 'delete' && row.username === 'admin') return 'admin 用户不可删除'
    return false
  }

  async function handleDelete(row: User) {
    if (row.username === 'admin') {
      message.warning('admin 用户不可删除')
      return
    }
    Modal.confirm({
      title: '确认删除',
      content: `确定删除用户「${row.username}」吗？`,
      okType: 'danger',
      onOk: async () => {
        await remove(row.id)
        message.success('删除成功')
        await loadData()
      },
    })
  }

  async function handleBatchDelete() {
    if (!selected.length) {
      message.warning('请选择要删除的数据')
      return
    }
    if (selected.some((u) => u.username === 'admin')) {
      message.warning('选中项包含 admin 用户，不可删除')
      return
    }
    Modal.confirm({
      title: '确认删除',
      content: `确定删除选中的 ${selected.length} 个用户吗？`,
      okType: 'danger',
      onOk: async () => {
        await batchRemove(selected.map((u) => u.id))
        message.success('删除成功')
        setSelected([])
        await loadData()
      },
    })
  }

  async function handleStatusChange(row: User, val: boolean) {
    const prev = row.status
    try {
      await updateStatus(row.id, val ? 1 : 0)
      message.success('状态已更新')
      await loadData()
    } catch {
      row.status = prev
    }
  }

  async function handleExport() {
    try {
      await exportUsers({
        keyword: String(queryForm.FuzzyWord ?? '').trim() || undefined,
        roleId:
          queryForm.roleId === '' || queryForm.roleId == null
            ? undefined
            : Number(queryForm.roleId),
        unitId: selectedUnitId ?? undefined,
      })
      message.success('导出成功')
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : '导出失败')
    }
  }

  function buttonClick(action: string) {
    if (action === 'add') {
      openSave('add')
      return
    }
    if (action === 'import') {
      importRef.current?.open()
      return
    }
    if (action === 'export') {
      void handleExport()
      return
    }
    if (action === 'edit' || action === 'view') {
      if (selected.length !== 1) {
        message.warning('请选择一项操作')
        return
      }
      openSave(action, selected[0].id)
      return
    }
    if (action === 'delete') void handleBatchDelete()
  }

  return (
    <>
      <XnPageLayout
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        showPagination={viewMode === 'card'}
        page={page}
        pageSize={size}
        total={total}
        loading={viewMode === 'card' ? loading : false}
        onPageChange={(p, s) => {
          setPage(p)
          setSize(s)
          void loadData(p, s)
        }}
        aside={
          <XnTreePanel
            title="单位"
            width={240}
            filter={unitKeyword}
            onFilterChange={setUnitKeyword}
            filterPlaceholder="搜索单位"
            data={unitTree}
            treeProps={{ label: 'name', children: 'children' }}
            currentKey={selectedUnitId ?? undefined}
            onNodeClick={(data) => {
              const id = Number(data.id)
              if (selectedUnitId === id) return
              setSelectedUnitId(id)
              setPage(1)
            }}
          />
        }
        search={
          <XnSearch
            searchItem={searchItems}
            onQueryForm={(form) => {
              setQueryForm(form)
              setPage(1)
              void loadData(1, size, form)
            }}
            onReset={(form) => {
              setQueryForm(form)
              setPage(1)
              void loadData(1, size, form)
            }}
          />
        }
        toolbar={
          <XnButton listItem={buttonItems} selected={selected} onButtonClick={buttonClick} />
        }
        table={
          <XnTable
            data={tableData}
            total={total}
            loading={loading}
            page={page}
            pageSize={size}
            tableKey="system:users"
            entityName="用户"
            nameField="username"
            columns={columns}
            actionItems={tableButtonItems}
            onSelectionChange={(rows) => setSelected(rows as User[])}
            onPageChange={(p, s) => {
              setPage(p)
              setSize(s)
              void loadData(p, s)
            }}
            slots={{
              roles: ({ row }) => {
                const u = row as unknown as User
                const direct = u.roleList || []
                const inherited = inheritedRoles(u)
                if (!(u.effectiveRoleList || u.roleList || []).length) return <span>—</span>
                return (
                  <>
                    {direct.map((r) => (
                      <Tag
                        key={`d-${r.id}`}
                        color={r.code === 'SUPER_ADMIN' ? 'error' : 'default'}
                        style={{ marginBottom: 2 }}
                      >
                        {r.name}
                      </Tag>
                    ))}
                    {inherited.map((r) => (
                      <Tag key={`u-${r.id}`} color="success" style={{ marginBottom: 2 }}>
                        {r.name}（单位）
                      </Tag>
                    ))}
                  </>
                )
              },
              status: ({ row }) => {
                const u = row as unknown as User
                return (
                  <XnAuth permission="user:update">
                    <Switch
                      checked={u.status === 1}
                      onChange={(val) => void handleStatusChange(u, val)}
                    />
                  </XnAuth>
                )
              },
              actions: ({ row }) => (
                <XnTableActions
                  items={tableButtonItems}
                  row={row}
                  disabled={tableActionDisabled}
                  onActionClick={({ action, row: r }) => {
                    const u = r as unknown as User
                    if (action === 'delete') void handleDelete(u)
                    else if (action === 'edit' || action === 'view') openSave(action, u.id)
                  }}
                />
              ),
            }}
          />
        }
        card={
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 12,
            }}
          >
            {tableData.map((row) => (
              <Card key={row.id} size="small">
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                  <Avatar>{(row.nickname || row.username).charAt(0).toUpperCase()}</Avatar>
                  <div>
                    <div style={{ fontWeight: 600 }}>{row.nickname || row.username}</div>
                    <div style={{ color: '#94a3b8' }}>@{row.username}</div>
                  </div>
                </div>
                <div>单位：{row.unitName || '—'}</div>
                <div>
                  角色：
                  {(row.effectiveRoleList || row.roleList || []).map((r) => r.name).join('、') ||
                    '—'}
                </div>
                <div>邮箱：{row.email || '—'}</div>
                <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                  <XnAuth permission="user:update">
                    <Switch
                      checked={row.status === 1}
                      onChange={(val) => void handleStatusChange(row, val)}
                    />
                  </XnAuth>
                  <XnTableActions
                    items={tableButtonItems}
                    row={row as unknown as Record<string, unknown>}
                    disabled={tableActionDisabled}
                    onActionClick={({ action, row: r }) => {
                      const u = r as unknown as User
                      if (action === 'delete') void handleDelete(u)
                      else if (action === 'edit' || action === 'view') openSave(action, u.id)
                    }}
                  />
                </div>
              </Card>
            ))}
          </div>
        }
      />
      <UserSave ref={saveRef} onSuccess={() => void loadData()} />
      <XnImport
        ref={importRef}
        title="导入用户"
        templateName="用户导入模板"
        columns={userImportColumns}
        importer={async (rows) => {
          const payload = rows.map((row) => ({
            username: row.username,
            password: row.password || undefined,
            nickname: row.nickname || undefined,
            email: row.email || undefined,
            phone: row.phone || undefined,
            roleCodes: row.roleCodes || undefined,
            unitCode: row.unitCode || undefined,
            postCode: row.postCode || undefined,
            status: row.status === '' || row.status == null ? undefined : Number(row.status),
          }))
          const res = await importUsers(payload)
          return res.data
        }}
        onSuccess={() => void loadData()}
      />
    </>
  )
}
