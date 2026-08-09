import XnModal from '@/components/XnModal'
﻿import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Input, message } from 'antd'
import XnPageLayout from '@/components/XnPageLayout'
import XnTreePanel from '@/components/XnTreePanel'
import XnSearch from '@/components/XnSearch'
import XnButton, { XnTableActions } from '@/components/XnButton'
import XnTable from '@/components/XnTable'
import { usePageUi } from '@/hooks/usePageUi'
import { browseFiles, createFileDir, fetchFileTree, removeFile, uploadFile } from '@/api/file-job'
import type { FileInfo, FileTreeNode } from '@/types'
import type { SearchForm } from '@/types/search'
import type { TableColumnItem } from '@/types/table'
import type { ButtonListItem } from '@/types/button'

interface TreeNode extends Record<string, unknown> {
  id: string
  label: string
  path: string
  children?: TreeNode[]
}

function mapTree(node: FileTreeNode): TreeNode {
  return {
    id: node.id,
    label: node.label,
    path: node.path,
    children: node.children?.map(mapTree),
  }
}

function formatSize(size: number) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(2)} MB`
}

export default function SystemFilesPage() {
  const { searchItems, buttonItems, tableButtonItems } = usePageUi('/system/files')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [queryForm, setQueryForm] = useState<SearchForm>({})
  const [selected, setSelected] = useState<FileInfo[]>([])
  const [currentPrefix, setCurrentPrefix] = useState('')
  const [storage, setStorage] = useState('')
  const [dirs, setDirs] = useState<FileInfo[]>([])
  const [files, setFiles] = useState<FileInfo[]>([])
  const [treeRoot, setTreeRoot] = useState<FileTreeNode | null>(null)
  const [mkdirOpen, setMkdirOpen] = useState(false)
  const [mkdirName, setMkdirName] = useState('')

  const storageLabel = storage === 'minio' ? 'MinIO' : storage === 'local' ? '本地' : '-'
  const treeData = useMemo(() => (treeRoot ? [mapTree(treeRoot)] : []), [treeRoot])
  const tableData = useMemo(() => [...dirs, ...files], [dirs, files])

  const columns: TableColumnItem[] = [
    { type: 'selection', width: 50, fixed: true },
    { type: 'index', label: '#', width: 55 },
    { type: 'slot', slot: 'name', prop: 'name', label: '文件名', minWidth: 140 },
    { type: 'slot', slot: 'contentType', prop: 'contentType', label: '类型', minWidth: 120 },
    { type: 'longText', prop: 'path', label: '对象路径', minWidth: 200 },
    { type: 'longText', prop: 'url', label: '访问地址', minWidth: 200 },
    {
      prop: 'storage',
      label: '存储',
      width: 90,
      align: 'center',
      type: 'tag',
      options: [
        { value: 'minio', label: 'MinIO', type: 'success' },
        { value: 'local', label: '本地', type: 'info' },
      ],
    },
    { type: 'slot', slot: 'size', prop: 'size', label: '大小', width: 100 },
    { prop: 'uploader', label: '上传人', width: 100, showOverflowTooltip: true },
    { prop: 'lastModified', label: '上传时间', minWidth: 160, type: 'datetime' },
    { type: 'slot', slot: 'actions', label: '操作', width: 180, fixed: 'right' },
  ]

  function rowActionsFor(row: FileInfo): ButtonListItem[] {
    if (row.directory) {
      return tableButtonItems.filter((item) => (item.action || item.name) === 'enter')
    }
    return tableButtonItems.filter((item) => (item.action || item.name) !== 'enter')
  }

  async function loadTree() {
    const res = await fetchFileTree()
    setTreeRoot(res.data)
  }

  async function loadData(prefix = currentPrefix, nextQuery = queryForm) {
    setLoading(true)
    try {
      const keyword = String(nextQuery.FuzzyWord ?? '').trim() || undefined
      const res = await browseFiles(prefix, keyword)
      setStorage(res.data.storage)
      setDirs(res.data.dirs || [])
      setFiles(res.data.files || [])
      setSelected([])
    } finally {
      setLoading(false)
    }
  }

  async function refreshAll() {
    await Promise.all([loadTree(), loadData()])
  }

  useEffect(() => {
    void refreshAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function enterDir(path: string) {
    const next = path.endsWith('/') ? path : `${path}/`
    setCurrentPrefix(next)
    void loadData(next)
  }

  function downloadFile(row: FileInfo) {
    if (!row.url) return
    const link = document.createElement('a')
    link.href = row.url
    link.download = row.name || 'download'
    link.target = '_blank'
    link.rel = 'noopener'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  async function handleView(row: FileInfo) {
    if (row.previewUrl) {
      window.open(row.previewUrl, '_blank')
      return
    }
    if (!row.url) {
      message.warning('文件地址不存在，无法下载')
      return
    }
    XnModal.confirm({
      title: '提示',
      content: '该文件类型暂不支持在线预览，是否下载？',
      okText: '下载',
      onOk: () => downloadFile(row),
    })
  }

  async function handleDelete(row: FileInfo) {
    if (row.directory) {
      message.warning('不支持删除目录')
      return
    }
    XnModal.confirm({
      title: '删除确认',
      content: `确定删除文件「${row.path}」吗？`,
      okType: 'danger',
      onOk: async () => {
        await removeFile(row.path)
        message.success('删除成功')
        await refreshAll()
      },
    })
  }

  async function handleBatchDelete() {
    const targets = selected.filter((row) => !row.directory)
    if (!targets.length) {
      message.warning('请至少选择一个文件')
      return
    }
    XnModal.confirm({
      title: '删除确认',
      content: `确定删除选中的 ${targets.length} 个文件吗？`,
      okType: 'danger',
      onOk: async () => {
        for (const row of targets) {
          await removeFile(row.path)
        }
        message.success('删除成功')
        await refreshAll()
      },
    })
  }

  async function onFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    await uploadFile(file, currentPrefix || '')
    message.success('上传成功')
    await refreshAll()
  }

  async function submitMkdir() {
    const name = mkdirName.trim()
    if (!name) {
      message.warning('请输入目录名')
      return
    }
    if (/[\\/:*?"<>|]/.test(name)) {
      message.warning('目录名不合法')
      return
    }
    const path = `${currentPrefix || ''}${name}/`
    await createFileDir(path)
    message.success('目录已创建')
    setMkdirOpen(false)
    setMkdirName('')
    await refreshAll()
  }

  function buttonClick(action: string) {
    if (action === 'refresh') void refreshAll()
    else if (action === 'mkdir') {
      setMkdirName('')
      setMkdirOpen(true)
    } else if (action === 'upload') fileInputRef.current?.click()
    else if (action === 'delete') void handleBatchDelete()
  }

  return (
    <>
      <XnPageLayout
        showViewSwitch={false}

        aside={
          <XnTreePanel
            title={`存储路径（${storageLabel}）`}
            width={240}
            data={treeData}
            treeProps={{ label: 'label', key: 'id', children: 'children' }}
            currentKey={currentPrefix || treeRoot?.id}
            filterPlaceholder="筛选目录"
            onNodeClick={(node) => {
              const path = String(node.path || '')
              setCurrentPrefix(path)
              void loadData(path)
            }}
          />
        }
        search={
          <XnSearch
            searchItem={searchItems}
            onQueryForm={(form) => {
              setQueryForm(form)
              void loadData(currentPrefix, form)
            }}
            onReset={(form) => {
              setQueryForm(form)
              void loadData(currentPrefix, form)
            }}
          />
        }
        toolbar={
          <>
            <XnButton listItem={buttonItems} selected={selected} onButtonClick={buttonClick} />
            <input
              ref={fileInputRef}
              type="file"
              style={{ display: 'none' }}
              onChange={(e) => void onFileSelected(e)}
            />
          </>
        }
        toolbarExtra={
          <span style={{ fontSize: 'var(--app-font-size-main)', color: 'var(--app-text-muted)' }}>
            当前路径：{currentPrefix || '/'}
          </span>
        }
        table={
          <XnTable
            data={tableData as unknown as Record<string, unknown>[]}
            total={tableData.length}
            loading={loading}
            showPagination={false}
            tableKey="system:files"
            entityName="文件"
            nameField="name"
            rowKey="path"
            columns={columns}
            actionItems={tableButtonItems}
            onSelectionChange={(rows) => setSelected(rows as unknown as FileInfo[])}
            slots={{
              name: ({ row }) =>
                row.directory ? (
                  <Button type="link" onClick={() => enterDir(String(row.path))}>
                    {String(row.name)}/
                  </Button>
                ) : (
                  <>{String(row.name)}</>
                ),
              contentType: ({ row }) => (
                <>{row.directory ? '—' : String(row.contentType || row.extension || '—')}</>
              ),
              size: ({ row }) => <>{row.directory ? '—' : formatSize(Number(row.size || 0))}</>,
              actions: ({ row }) => {
                const file = row as unknown as FileInfo
                return (
                  <XnTableActions
                    items={rowActionsFor(file)}
                    row={row}
                    onActionClick={({ action, row: r }) => {
                      const item = r as unknown as FileInfo
                      if (action === 'enter') enterDir(item.path)
                      else if (action === 'view' || action === 'preview') void handleView(item)
                      else if (action === 'delete') void handleDelete(item)
                    }}
                  />
                )
              },
            }}
          />
        }
      />
      <XnModal
        title="新建目录"
        open={mkdirOpen}
        onCancel={() => setMkdirOpen(false)}
        onOk={() => void submitMkdir()}
        okText="创建"
        destroyOnHidden
      >
        <Input
          placeholder="输入新目录名（相对当前路径）"
          value={mkdirName}
          onChange={(e) => setMkdirName(e.target.value)}
          onPressEnter={() => void submitMkdir()}
        />
      </XnModal>
    </>
  )
}

