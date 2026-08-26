import { useEffect, useMemo, useState, type Key, type ReactNode } from 'react'
import { Alert, Badge, Button, Checkbox, Empty, Modal, Space, Tag, Tree, message } from 'antd'
import type { DataNode } from 'antd/es/tree'
import { useSearchParams } from 'react-router-dom'
import XnPageLayout from '@/components/XnPageLayout'
import XnTreePanel from '@/components/XnTreePanel'
import { assignPermissions, get, getOptions } from '@/api/role'
import { list as listPermissions } from '@/api/permission'
import { list as listRoutes } from '@/api/route'
import type { Permission, Role, SysRoute } from '@/types'
import './rolePermissions.scss'

type MenuNode = SysRoute & {
  permissionId?: number
  children?: MenuNode[]
}

function sortBySort<T extends { sort?: number }>(list: T[]) {
  return [...list].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
}

function methodColor(method?: string) {
  const m = (method || '').toUpperCase()
  if (m === 'GET') return 'success'
  if (m === 'POST') return 'processing'
  if (m === 'PUT') return 'warning'
  if (m === 'DELETE') return 'error'
  return 'default'
}

function collectAssignable(permByCode: Map<string, Permission>, route: MenuNode): Permission[] {
  const result: Permission[] = []
  const menuPerm = route.permission ? permByCode.get(route.permission) : undefined
  if (menuPerm?.children?.length) {
    for (const child of menuPerm.children) {
      if (child.type !== 'MENU') result.push(child)
    }
  }
  return sortBySort(result)
}

function countChecked(ids: Set<number>, items: Permission[]) {
  let n = 0
  for (const item of items) if (ids.has(item.id)) n++
  return n
}

function collectTreeKeys(nodes: DataNode[]): Key[] {
  const keys: Key[] = []
  const walk = (list: DataNode[]) => {
    for (const n of list) {
      keys.push(n.key)
      if (n.children?.length) walk(n.children)
    }
  }
  walk(nodes)
  return keys
}

export default function RolePermissionsPage() {
  const [searchParams] = useSearchParams()
  const roleIdQuery = searchParams.get('roleId')

  const [roles, setRoles] = useState<Role[]>([])
  const [roleFilter, setRoleFilter] = useState('')
  const [currentRole, setCurrentRole] = useState<Role | null>(null)
  const [routes, setRoutes] = useState<MenuNode[]>([])
  const [permByCode, setPermByCode] = useState<Map<string, Permission>>(new Map())
  const [menuFilter, setMenuFilter] = useState('')
  const [selectedRouteKey, setSelectedRouteKey] = useState<string>()
  const [selectedRoute, setSelectedRoute] = useState<MenuNode | null>(null)
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set())
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set())
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  const dirty = useMemo(() => {
    if (checkedIds.size !== savedIds.size) return true
    for (const id of checkedIds) if (!savedIds.has(id)) return true
    return false
  }, [checkedIds, savedIds])

  const filteredRoles = useMemo(() => {
    const kw = roleFilter.trim().toLowerCase()
    return roles.filter((r) => {
      if (r.code === 'SUPER_ADMIN') return false
      if (!kw) return true
      return r.name.toLowerCase().includes(kw) || r.code.toLowerCase().includes(kw)
    })
  }, [roles, roleFilter])

  function indexPermissions(nodes: Permission[]) {
    const byCode = new Map<string, Permission>()
    const walk = (list: Permission[]) => {
      for (const n of list) {
        byCode.set(n.code, n)
        if (n.children?.length) walk(n.children)
      }
    }
    walk(nodes)
    setPermByCode(byCode)
  }

  function linkRoutes(routeNodes: SysRoute[], byCode: Map<string, Permission>): MenuNode[] {
    const map = (list: SysRoute[]): MenuNode[] =>
      sortBySort(list).map((r) => ({
        ...r,
        permissionId: r.permission ? byCode.get(r.permission)?.id : undefined,
        children: r.children?.length ? map(r.children) : undefined,
      }))
    return map(routeNodes)
  }

  async function loadBase() {
    setLoading(true)
    try {
      const [rolesRes, routesRes, permsRes] = await Promise.all([
        getOptions(),
        listRoutes(),
        listPermissions(),
      ])
      setRoles(rolesRes.data || [])
      indexPermissions(permsRes.data || [])
      const byCode = new Map<string, Permission>()
      const walk = (list: Permission[]) => {
        for (const n of list) {
          byCode.set(n.code, n)
          if (n.children?.length) walk(n.children)
        }
      }
      walk(permsRes.data || [])
      setRoutes(linkRoutes(routesRes.data || [], byCode))
    } finally {
      setLoading(false)
    }
  }

  async function selectRole(role: Role) {
    if (dirty) {
      const ok = await new Promise<boolean>((resolve) => {
        Modal.confirm({
          title: '未保存的更改',
          content: '切换角色将丢弃未保存的权限修改，是否继续？',
          onOk: () => resolve(true),
          onCancel: () => resolve(false),
        })
      })
      if (!ok) return
    }
    setCurrentRole(role)
    if (role.code === 'SUPER_ADMIN') {
      setCheckedIds(new Set())
      setSavedIds(new Set())
      return
    }
    const res = await get(role.id)
    const ids = new Set(res.data.permissionIds || [])
    setCheckedIds(new Set(ids))
    setSavedIds(new Set(ids))
  }

  useEffect(() => {
    void loadBase()
  }, [])

  useEffect(() => {
    if (!roles.length) return
    const filtered = roles.filter((r) => r.code !== 'SUPER_ADMIN')
    const fromQuery = roleIdQuery ? filtered.find((r) => String(r.id) === roleIdQuery) : undefined
    const target = fromQuery || filtered[0]
    if (target && (!currentRole || currentRole.id !== target.id)) {
      void selectRole(target)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roles, roleIdQuery])

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirty) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  const assignableOfSelected = useMemo(() => {
    if (!selectedRoute) return []
    return collectAssignable(permByCode, selectedRoute)
  }, [selectedRoute, permByCode])

  const groups = useMemo(() => {
    const sensitive: Permission[] = []
    const button: Permission[] = []
    const tableButton: Permission[] = []
    const api: Permission[] = []
    for (const p of assignableOfSelected) {
      if (p.action === 'capability' || p.code === 'user:sensitive:view') sensitive.push(p)
      else if (p.type === 'BUTTON') button.push(p)
      else if (p.type === 'TABLE_BUTTON') tableButton.push(p)
      else if (p.type === 'API') api.push(p)
    }
    return [
      { key: 'sensitive', title: '敏感信息', items: sensitive },
      { key: 'button', title: '按钮', items: button },
      { key: 'table', title: '表格按钮', items: tableButton },
      { key: 'api', title: '接口', items: api },
    ].filter((g) => g.items.length)
  }, [assignableOfSelected])

  const menuTreeData = useMemo(() => {
    const kw = menuFilter.trim().toLowerCase()
    const filterNode = (list: MenuNode[]): MenuNode[] => {
      const result: MenuNode[] = []
      for (const n of list) {
        const children = n.children?.length ? filterNode(n.children) : []
        const hit =
          !kw ||
          n.title.toLowerCase().includes(kw) ||
          (n.path || '').toLowerCase().includes(kw) ||
          (n.permission || '').toLowerCase().includes(kw)
        if (hit || children.length) result.push({ ...n, children })
      }
      return result
    }
    const mapped = filterNode(routes)
    const toData = (list: MenuNode[]): DataNode[] =>
      list.map((n) => {
        const disabled = !(n.type === 'MENU' && n.permissionControl)
        const assignable = collectAssignable(permByCode, n)
        const checked = countChecked(checkedIds, assignable)
        const menuChecked = n.permissionId != null && checkedIds.has(n.permissionId)
        let badge: ReactNode = null
        if (n.type === 'MENU' && !n.permissionControl) {
          badge = <Tag>未控权</Tag>
        } else if (assignable.length) {
          badge = (
            <Badge
              count={`${checked + (menuChecked ? 1 : 0)}/${assignable.length + (n.permissionId ? 1 : 0)}`}
              style={{ backgroundColor: '#1677ff' }}
            />
          )
        }
        return {
          key: String(n.id),
          title: (
            <span className="role-perm__menu-title">
              {n.permissionId != null ? (
                <Checkbox
                  checked={menuChecked}
                  disabled={disabled || !currentRole || currentRole.code === 'SUPER_ADMIN'}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    const next = new Set(checkedIds)
                    if (e.target.checked) next.add(n.permissionId!)
                    else next.delete(n.permissionId!)
                    setCheckedIds(next)
                  }}
                />
              ) : null}
              <span>{n.title}</span>
              {badge}
            </span>
          ),
          disabled,
          children: n.children?.length ? toData(n.children) : undefined,
          raw: n,
        }
      })
    return toData(mapped)
  }, [routes, menuFilter, permByCode, checkedIds, currentRole])

  const menuTreeKeys = useMemo(() => collectTreeKeys(menuTreeData), [menuTreeData])
  const menuTreeKeysSig = menuTreeKeys.join('|')
  const [menuExpandedKeys, setMenuExpandedKeys] = useState<Key[]>([])
  useEffect(() => {
    setMenuExpandedKeys(menuTreeKeysSig ? menuTreeKeysSig.split('|') : [])
  }, [menuTreeKeysSig])

  function toggleGroup(items: Permission[], checked: boolean) {
    const next = new Set(checkedIds)
    for (const item of items) {
      if (checked) next.add(item.id)
      else next.delete(item.id)
    }
    setCheckedIds(next)
  }

  async function handleSave() {
    if (!currentRole || currentRole.code === 'SUPER_ADMIN') return
    setSaving(true)
    try {
      await assignPermissions(currentRole.id, [...checkedIds])
      setSavedIds(new Set(checkedIds))
      message.success('权限已保存')
    } finally {
      setSaving(false)
    }
  }

  const locked = currentRole?.code === 'SUPER_ADMIN'

  return (
    <XnPageLayout
      showViewSwitch={false}
      loading={loading}
      aside={
        <XnTreePanel
          title="角色"
          width={240}
          filter={roleFilter}
          onFilterChange={setRoleFilter}
          filterPlaceholder="筛选角色"
        >
          {filteredRoles.length ? (
            filteredRoles.map((r) => (
              <div
                key={r.id}
                className={`role-perm__role${currentRole?.id === r.id ? ' is-active' : ''}`}
                onClick={() => void selectRole(r)}
              >
                <div className="role-perm__role-name">{r.name}</div>
                <div className="role-perm__role-code">{r.code}</div>
              </div>
            ))
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="无匹配角色" />
          )}
        </XnTreePanel>
      }
      toolbar={
        <div>
          <strong>
            {locked
              ? '超级管理员拥有全部权限'
              : currentRole
                ? `为「${currentRole.name}」配置权限`
                : '请选择角色'}
          </strong>
          {dirty ? (
            <Tag color="warning" style={{ marginLeft: 8 }}>
              未保存
            </Tag>
          ) : null}
        </div>
      }
      toolbarExtra={
        <Button
          type="primary"
          disabled={!currentRole || locked}
          loading={saving}
          onClick={() => void handleSave()}
        >
          保存
        </Button>
      }
      table={
        locked ? (
          <div className="role-perm__locked">
            <Alert type="info" showIcon title="超级管理员默认拥有全部权限，无需配置。" />
          </div>
        ) : (
          <div className="role-perm__body">
            <div className="role-perm__menus">
              <XnTreePanel
                title="菜单"
                width={280}
                filter={menuFilter}
                onFilterChange={setMenuFilter}
                filterPlaceholder="筛选菜单"
              >
                <Tree
                  treeData={menuTreeData}
                  selectedKeys={selectedRouteKey ? [selectedRouteKey] : []}
                  expandedKeys={menuExpandedKeys}
                  onExpand={(keys) => setMenuExpandedKeys(keys)}
                  onSelect={(keys, info) => {
                    const raw = (info.node as DataNode & { raw?: MenuNode; disabled?: boolean }).raw
                    if (!raw || info.node.disabled) return
                    setSelectedRouteKey(String(keys[0] || ''))
                    setSelectedRoute(raw)
                  }}
                />
              </XnTreePanel>
            </div>

            <section className="role-perm__detail">
              {!selectedRoute ? (
                <div className="role-perm__detail-empty">
                  <Empty description="请选择左侧菜单" />
                </div>
              ) : !groups.length ? (
                <div className="role-perm__detail-empty">
                  <Empty description="该菜单下暂无按钮/接口权限" />
                </div>
              ) : (
                <>
                  <div className="role-perm__detail-header">
                    <strong>{selectedRoute.title}</strong>
                  </div>
                  <div className="role-perm__detail-scroll">
                    {groups.map((g) => {
                      const allChecked = g.items.every((i) => checkedIds.has(i.id))
                      const someChecked = g.items.some((i) => checkedIds.has(i.id))
                      return (
                        <div key={g.key} className="role-perm__group">
                          <div className="role-perm__group-title">
                            <strong>{g.title}</strong>
                            <Checkbox
                              checked={allChecked}
                              indeterminate={!allChecked && someChecked}
                              onChange={(e) => toggleGroup(g.items, e.target.checked)}
                            >
                              全选
                            </Checkbox>
                          </div>
                          <div className="role-perm__group-items">
                            {g.items.map((item) => (
                              <Checkbox
                                key={item.id}
                                checked={checkedIds.has(item.id)}
                                onChange={(e) => {
                                  const next = new Set(checkedIds)
                                  if (e.target.checked) next.add(item.id)
                                  else next.delete(item.id)
                                  setCheckedIds(next)
                                }}
                              >
                                <Space size={6}>
                                  {g.key === 'sensitive' ? <Tag color="error">敏感</Tag> : null}
                                  {item.type === 'API' ? (
                                    <Tag color={methodColor(item.method)}>{item.method}</Tag>
                                  ) : null}
                                  <span>{item.name}</span>
                                  <span style={{ color: '#94a3b8', fontSize: 12 }}>
                                    {item.type === 'API' ? item.path : item.code}
                                  </span>
                                </Space>
                              </Checkbox>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </section>
          </div>
        )
      }
    />
  )
}
