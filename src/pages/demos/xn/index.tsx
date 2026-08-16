import { useCallback, useMemo, useState, type ReactNode } from 'react'
import {
  Alert,
  Card,
  InputNumber,
  Select,
  Space,
  Switch,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd'
import XnPageLayout from '@/components/XnPageLayout'
import XnSearch from '@/components/XnSearch'
import XnButton from '@/components/XnButton'
import XnTable from '@/components/XnTable'
import XnModal from '@/components/XnModal'
import XnTreePanel from '@/components/XnTreePanel'
import XnIconPicker from '@/components/XnIconPicker'
import XnRichEditor from '@/components/XnRichEditor'
import XnLongText from '@/components/XnLongText'
import XnAppIcon from '@/components/XnAppIcon'
import XnAppBrandLogo from '@/components/XnAppBrandLogo'
import XnAuth from '@/components/XnAuth'
import XnUpload from '@/components/XnUpload'
import type { FileInfo } from '@/types'
import type { UploadTaskSnapshot } from '@/utils/upload/types'
import type { SearchItem } from '@/types/search'
import type { ButtonListItem } from '@/types/button'
import type { TableColumnItem } from '@/types/table'
import styles from '../demo.module.scss'

const { Paragraph, Text } = Typography

type DemoBlockProps = {
  title: string
  name: string
  intro: string
  children: ReactNode
}

function DemoBlock({ title, name, intro, children }: DemoBlockProps) {
  return (
    <Card
      size="small"
      className={styles.section}
      title={
        <Space>
          <span>{title}</span>
          <Tag color="processing">{name}</Tag>
        </Space>
      }
      bordered={false}
    >
      <Alert type="info" showIcon message={intro} className={styles.intro} />
      <div className={styles.demoBody}>{children}</div>
    </Card>
  )
}

const treeData = [
  {
    id: '1',
    name: '总公司',
    children: [
      { id: '1-1', name: '研发中心', children: [{ id: '1-1-1', name: '前端组' }] },
      { id: '1-2', name: '运营中心' },
    ],
  },
]

const tableColumns: TableColumnItem[] = [
  { type: 'selection', width: 48 },
  { type: 'index', label: '#', width: 56 },
  { label: '名称', prop: 'name', minWidth: 120 },
  {
    label: '状态',
    prop: 'status',
    type: 'tag',
    width: 100,
    options: [
      { label: '启用', value: 1, type: 'success' },
      { label: '停用', value: 0, type: 'info' },
    ],
  },
  { label: '备注', prop: 'remark', type: 'longText', minWidth: 160 },
]

const tableRows = [
  { id: 1, name: '示例用户 A', status: 1, remark: '这是一段较短的备注' },
  {
    id: 2,
    name: '示例用户 B',
    status: 0,
    remark: '这是一段很长很长的备注内容，用于演示 longText 列在表格中的截断与点击展开效果。',
  },
  { id: 3, name: '示例用户 C', status: 1, remark: '另一条备注' },
]

export default function DemoXnPage() {
  const [treeKey, setTreeKey] = useState<string | number>('1')
  const [icon, setIcon] = useState('mdi:home')
  const [richHtml, setRichHtml] = useState('<p>欢迎使用 <strong>XnRichEditor</strong></p>')
  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected] = useState<unknown[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [uploadChunkSize, setUploadChunkSize] = useState(8 * 1024 * 1024)
  const [uploadConcurrency, setUploadConcurrency] = useState(3)
  const [uploadMaxRetries, setUploadMaxRetries] = useState(3)
  const [uploadHashAlgo, setUploadHashAlgo] = useState<'sha256-tree' | 'sha256'>('sha256-tree')
  const [uploadInstant, setUploadInstant] = useState(true)
  const [uploadResume, setUploadResume] = useState(true)
  const [uploadHash, setUploadHash] = useState(true)
  const [uploadLogs, setUploadLogs] = useState<string[]>([])

  const pushUploadLog = useCallback((text: string) => {
    setUploadLogs((logs) => [`${new Date().toLocaleTimeString()} · ${text}`, ...logs].slice(0, 8))
  }, [])

  const handleUploadSuccess = useCallback(
    (file: FileInfo, task: UploadTaskSnapshot) => {
      pushUploadLog(
        `${task.instant ? '秒传命中' : '上传成功'}：${file.name} → ${file.url || file.path}`,
      )
      message.success(`${file.name} ${task.instant ? '秒传完成' : '上传完成'}`)
    },
    [pushUploadLog],
  )

  const handleUploadError = useCallback(
    (text: string, task: UploadTaskSnapshot) => {
      pushUploadLog(`失败：${task.name} — ${text}`)
      message.error(`${task.name} 上传失败：${text}`)
    },
    [pushUploadLog],
  )

  const searchItems: SearchItem[] = useMemo(
    () => [
      { label: '名称', prop: 'name', type: 'input', placeholder: '请输入名称' },
      {
        label: '状态',
        prop: 'status',
        type: 'select',
        options: [
          { label: '启用', value: 1 },
          { label: '停用', value: 0 },
        ],
      },
      { label: '创建日期', prop: 'createdAt', type: 'daterange' },
      { label: '年龄', prop: 'age', type: 'number' },
    ],
    [],
  )

  const buttonItems: ButtonListItem[] = useMemo(
    () => [
      { name: '新增', action: 'add', type: 'button', icon: 'PlusOutlined', typeColor: 'primary' },
      {
        name: '编辑',
        action: 'edit',
        type: 'button',
        icon: 'EditOutlined',
        typeColor: 'primary',
        index: 0,
      },
      {
        name: '删除',
        action: 'delete',
        type: 'button',
        icon: 'DeleteOutlined',
        typeColor: 'danger',
        index: 1,
      },
      {
        name: '更多',
        type: 'down',
        icon: 'MoreOutlined',
        typeColor: 'default',
        searchItem: [
          { name: '导出', action: 'export', icon: 'DownloadOutlined' },
          { name: '导入', action: 'import', icon: 'UploadOutlined' },
        ],
      },
    ],
    [],
  )

  const items = [
    {
      key: 'layout',
      label: '页面布局',
      children: (
        <DemoBlock
          title="页面布局"
          name="XnPageLayout"
          intro="列表页标准壳：左侧树 / 搜索区 / 工具栏 / 表格或卡片 / 分页。业务页应优先使用该布局保持风格一致。"
        >
          <div className={styles.layoutDemo}>
            <XnPageLayout
              aside={
                <XnTreePanel
                  title="组织树"
                  data={treeData}
                  currentKey={treeKey}
                  onNodeClick={(node) => setTreeKey(String(node.id))}
                />
              }
              search={
                <XnSearch
                  searchItem={searchItems}
                  onQueryForm={(form) => message.info(`查询：${JSON.stringify(form)}`)}
                  onReset={() => message.success('已重置')}
                />
              }
              toolbar={
                <XnButton
                  listItem={buttonItems}
                  selected={selected}
                  onButtonClick={(action) => message.info(`工具栏：${action}`)}
                />
              }
              table={
                <XnTable
                  data={tableRows}
                  columns={tableColumns}
                  rowKey="id"
                  showPagination={false}
                  onSelectionChange={setSelected}
                />
              }
              showPagination
              page={page}
              pageSize={pageSize}
              total={tableRows.length}
              onPageChange={(p, s) => {
                setPage(p)
                setPageSize(s)
              }}
            />
          </div>
        </DemoBlock>
      ),
    },
    {
      key: 'search',
      label: '搜索表单',
      children: (
        <DemoBlock
          title="搜索表单"
          name="XnSearch"
          intro="根据 SearchItem[] 配置驱动的查询表单，支持 input / number / select / date / daterange / datetime，字段过多时可折叠。"
        >
          <XnSearch
            searchItem={searchItems}
            collapseCount={2}
            onQueryForm={(form) => message.info(`查询：${JSON.stringify(form)}`)}
          />
        </DemoBlock>
      ),
    },
    {
      key: 'button',
      label: '工具栏',
      children: (
        <DemoBlock
          title="工具栏按钮"
          name="XnButton"
          intro="配置化工具栏：支持权限过滤、按选中行数禁用、下拉分组。动作通过 action 回调交给页面处理。"
        >
          <XnButton
            listItem={buttonItems}
            selected={selected}
            onButtonClick={(action) => message.info(`点击：${action}`)}
          />
          <Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
            当前选中 {selected.length} 项（可在「页面布局」表格中勾选）。
          </Paragraph>
        </DemoBlock>
      ),
    },
    {
      key: 'table',
      label: '数据表格',
      children: (
        <DemoBlock
          title="数据表格"
          name="XnTable"
          intro="统一列表表格：内置序号/多选/标签/开关/长文本等列类型，可对接 CRUD API 或直接传入本地 data。"
        >
          <XnTable data={tableRows} columns={tableColumns} rowKey="id" showPagination={false} />
        </DemoBlock>
      ),
    },
    {
      key: 'modal',
      label: '弹窗',
      children: (
        <DemoBlock
          title="弹窗"
          name="XnModal"
          intro="基于 Ant Design Modal 封装，读取全局 appConfig.ui.antd.modal（居中、可拖拽等），业务弹窗推荐统一使用。"
        >
          <Space>
            <a onClick={() => setModalOpen(true)}>打开 XnModal</a>
          </Space>
          <XnModal
            title="XnModal 示例"
            open={modalOpen}
            onOk={() => setModalOpen(false)}
            onCancel={() => setModalOpen(false)}
          >
            <p>可拖拽与居中行为受系统配置控制，可在主题/系统配置中调整。</p>
          </XnModal>
        </DemoBlock>
      ),
    },
    {
      key: 'tree',
      label: '树面板',
      children: (
        <DemoBlock
          title="左侧树面板"
          name="XnTreePanel"
          intro="带标题与关键字过滤的树面板，常与 XnPageLayout 的 aside 插槽搭配，用于单位/菜单等树形筛选。"
        >
          <XnTreePanel
            title="示例树"
            width={280}
            data={treeData}
            currentKey={treeKey}
            onNodeClick={(node) => {
              setTreeKey(String(node.id))
              message.info(`选中：${String(node.name)}`)
            }}
          />
        </DemoBlock>
      ),
    },
    {
      key: 'icon',
      label: '图标选择',
      children: (
        <DemoBlock
          title="图标选择器"
          name="XnIconPicker"
          intro="与 Vue 同结构：Ant / Iconify / SVG 三栏选择，用于路由、菜单、按钮等图标配置。"
        >
          <div style={{ maxWidth: 420 }}>
            <XnIconPicker value={icon} onChange={setIcon} />
          </div>
        </DemoBlock>
      ),
    },
    {
      key: 'rich',
      label: '富文本',
      children: (
        <DemoBlock
          title="富文本编辑器"
          name="XnRichEditor"
          intro="基于 wangEditor，图片/视频/附件走 XnUpload；支持公式、@提及、Markdown、链接卡片。"
        >
          <XnRichEditor value={richHtml} onChange={setRichHtml} height={220} />
        </DemoBlock>
      ),
    },
    {
      key: 'longText',
      label: '长文本',
      children: (
        <DemoBlock
          title="长文本"
          name="XnLongText"
          intro="表格或详情中展示长文本：超出 maxLength 时截断，点击后弹窗查看全文。"
        >
          <XnLongText
            text="这是一段用于演示的超长文本内容，点击后可以在弹窗中查看完整信息，并便于复制或阅读。"
            maxLength={20}
            title="备注详情"
          />
        </DemoBlock>
      ),
    },
    {
      key: 'upload',
      label: '大文件上传',
      children: (
        <DemoBlock
          title="大文件分片上传"
          name="XnUpload"
          intro="小文件单请求直传，大文件自动分片：Worker 算指纹 → 秒传探测 → 并发上传（失败指数退避重试）→ 服务端合并。可暂停 / 继续 / 取消；刷新页面后重新选择同一文件即可续传。"
        >
          <Space wrap size="middle" className={styles.uploadForm}>
            <Space size={4}>
              <Text type="secondary">分片大小</Text>
              <Select
                size="small"
                style={{ width: 96 }}
                value={uploadChunkSize}
                onChange={setUploadChunkSize}
                options={[5, 8, 10, 20].map((mb) => ({
                  label: `${mb} MB`,
                  value: mb * 1024 * 1024,
                }))}
              />
            </Space>
            <Space size={4}>
              <Text type="secondary">并发数</Text>
              <InputNumber
                size="small"
                min={1}
                max={8}
                style={{ width: 72 }}
                value={uploadConcurrency}
                onChange={(value) => setUploadConcurrency(value ?? 1)}
              />
            </Space>
            <Space size={4}>
              <Text type="secondary">重试次数</Text>
              <InputNumber
                size="small"
                min={0}
                max={6}
                style={{ width: 72 }}
                value={uploadMaxRetries}
                onChange={(value) => setUploadMaxRetries(value ?? 0)}
              />
            </Space>
            <Space size={4}>
              <Text type="secondary">指纹算法</Text>
              <Select
                size="small"
                style={{ width: 190 }}
                value={uploadHashAlgo}
                onChange={setUploadHashAlgo}
                options={[
                  { label: '分片树摘要（原生，快）', value: 'sha256-tree' },
                  { label: '全量 SHA-256（较慢）', value: 'sha256' },
                ]}
              />
            </Space>
            <Space size={4}>
              <Text type="secondary">秒传</Text>
              <Switch size="small" checked={uploadInstant} onChange={setUploadInstant} />
            </Space>
            <Space size={4}>
              <Text type="secondary">断点续传</Text>
              <Switch size="small" checked={uploadResume} onChange={setUploadResume} />
            </Space>
            <Space size={4}>
              <Text type="secondary">计算指纹</Text>
              <Switch size="small" checked={uploadHash} onChange={setUploadHash} />
            </Space>
          </Space>
          <XnUpload
            chunkSize={uploadChunkSize}
            concurrency={uploadConcurrency}
            maxRetries={uploadMaxRetries}
            hashAlgo={uploadHashAlgo}
            enableInstant={uploadInstant}
            enableResume={uploadResume}
            enableHash={uploadHash}
            maxSize={10 * 1024 * 1024 * 1024}
            onSuccess={handleUploadSuccess}
            onError={handleUploadError}
          />
          {uploadLogs.length > 0 && (
            <div className={styles.uploadLogs}>
              {uploadLogs.map((log, index) => (
                <div key={index}>{log}</div>
              ))}
            </div>
          )}
        </DemoBlock>
      ),
    },
    {
      key: 'brand',
      label: '图标品牌',
      children: (
        <DemoBlock
          title="图标 / 品牌"
          name="XnAppIcon · XnAppBrandLogo"
          intro="XnAppIcon 统一解析 Iconify / Ant / SVG；XnAppBrandLogo 展示系统品牌 Logo 与名称。"
        >
          <Space size="large" wrap>
            <Space>
              <XnAppIcon name="mdi:home" size={20} />
              <XnAppIcon name="SettingOutlined" size={20} />
              <XnAppIcon name={icon} size={20} />
              <Text type="secondary">{icon}</Text>
            </Space>
            <XnAppBrandLogo />
          </Space>
        </DemoBlock>
      ),
    },
    {
      key: 'auth',
      label: '权限包裹',
      children: (
        <DemoBlock
          title="权限包裹"
          name="XnAuth"
          intro="无权限时不渲染子节点（可自定义 fallback）。按钮级权限控制的标准写法。"
        >
          <Space direction="vertical">
            <XnAuth permission="menu:dashboard">
              <Tag color="success">你拥有 menu:dashboard，因此能看到这段</Tag>
            </XnAuth>
            <XnAuth
              permission="demo:never-exist-permission"
              fallback={<Tag>无 demo:never-exist-permission 权限（fallback）</Tag>}
            >
              <Tag color="error">不应出现</Tag>
            </XnAuth>
          </Space>
        </DemoBlock>
      ),
    },
    {
      key: 'other',
      label: '其它说明',
      children: (
        <DemoBlock
          title="其它组件说明"
          name="XnImport / XnTagsView / …"
          intro="部分组件依赖布局或业务流程，此处仅作说明，不单独挂载。"
        >
          <ul className={styles.noteList}>
            <li>
              <Text strong>XnImport</Text>：Excel
              模板下载、预览与导入对话框，多用于用户/字典等批量导入。
            </li>
            <li>
              <Text strong>XnTagsView</Text>：多标签页访问记录，位于顶栏布局中。
            </li>
            <li>
              <Text strong>XnNoticeInbox</Text>：公告/消息铃铛与抽屉，位于顶栏。
            </li>
            <li>
              <Text strong>XnThemePicker / XnUiPreferenceFab</Text>：主题与界面偏好设置入口。
            </li>
            <li>
              <Text strong>XnErrorPage</Text>：403 / 404 / 503 错误页壳。
            </li>
            <li>
              <Text strong>XnSidebarMenu</Text>：侧栏菜单（含搜索高亮），由布局使用。
            </li>
          </ul>
        </DemoBlock>
      ),
    },
  ]

  return (
    <div className={`demo-page ${styles.page}`}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>系统组件</h2>
          <p className={styles.desc}>
            展示本项目封装的 Xn* 业务组件。说明文案为静态介绍，示例数据均为本地写死，不请求后端。
          </p>
        </div>
        <Tag color="purple">Xn*</Tag>
      </div>
      <Tabs items={items} tabPosition="left" className={styles.tabs} />
    </div>
  )
}
