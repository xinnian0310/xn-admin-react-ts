import { useCallback, useMemo, useState, type ReactNode } from 'react'
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
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
import XnImageUpload from '@/components/XnImageUpload'
import XnDialog from '@/components/XnDialog'
import XnExport from '@/components/XnExport'
import XnDictSelect from '@/components/XnDictSelect'
import XnCron from '@/components/XnCron'
import XnDesc from '@/components/XnDesc'
import XnOrgSelect from '@/components/XnOrgSelect'
import XnFilePicker from '@/components/XnFilePicker'
import XnCaptcha from '@/components/XnCaptcha'
import XnAvatarCrop from '@/components/XnAvatarCrop'
import XnWatermark from '@/components/XnWatermark'
import XnRegion from '@/components/XnRegion'
import XnCopy from '@/components/XnCopy'
import XnCode from '@/components/XnCode'
import XnSmsCode from '@/components/XnSmsCode'
import XnEmpty from '@/components/XnEmpty'
import XnPopconfirm from '@/components/XnPopconfirm'
import type { FileInfo } from '@/types'
import { DEFAULT_UPLOADER_OPTIONS } from '@/utils/upload'
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
      variant="borderless"
    >
      <Alert type="info" showIcon title={intro} className={styles.intro} />
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

  const [uploadChunkSize, setUploadChunkSize] = useState(DEFAULT_UPLOADER_OPTIONS.chunkSize)
  const [uploadConcurrency, setUploadConcurrency] = useState(DEFAULT_UPLOADER_OPTIONS.concurrency)
  const [uploadMaxRetries, setUploadMaxRetries] = useState(DEFAULT_UPLOADER_OPTIONS.maxRetries)
  const [uploadHashAlgo, setUploadHashAlgo] = useState<'sha256-tree' | 'sha256'>(
    DEFAULT_UPLOADER_OPTIONS.hashAlgo,
  )
  const [uploadInstant, setUploadInstant] = useState(DEFAULT_UPLOADER_OPTIONS.enableInstant)
  const [uploadResume, setUploadResume] = useState(DEFAULT_UPLOADER_OPTIONS.enableResume)
  const [uploadHash, setUploadHash] = useState(DEFAULT_UPLOADER_OPTIONS.enableHash)
  const [uploadLogs, setUploadLogs] = useState<string[]>([])
  const [singleImage, setSingleImage] = useState('')
  const [multiImages, setMultiImages] = useState<string[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogLoadingOpen, setDialogLoadingOpen] = useState(false)
  const [smsPhone, setSmsPhone] = useState('18888888888')
  const [smsCode, setSmsCode] = useState('')
  const [regionTextModel, setRegionTextModel] = useState('浙江省 / 杭州市 / 西湖区')
  const [dictValue, setDictValue] = useState<string | number | Array<string | number> | null>('1')
  const [cronValue, setCronValue] = useState('0 */5 * * * ?')
  const [orgUnit, setOrgUnit] = useState<number | undefined>(1)
  const [orgUser, setOrgUser] = useState<number | undefined>(1)
  const [orgRole, setOrgRole] = useState<number | undefined>(1)
  const [pickedFile, setPickedFile] = useState('')
  const [captchaCode, setCaptchaCode] = useState('')
  const [avatarDemo, setAvatarDemo] = useState('')
  const [regionCodes, setRegionCodes] = useState<string[]>(['33', '3301', '330106'])
  const [regionCity, setRegionCity] = useState<string[]>([])
  const [regionText, setRegionText] = useState('浙江省 / 杭州市 / 西湖区')

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
        type: 'dict',
        options: [
          { label: '启用', value: 1 },
          { label: '停用', value: 0 },
        ],
      },
      { label: '地区', prop: 'region', type: 'region', width: 260 },
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

  const dictOptions = [
    { label: '启用', value: '1' },
    { label: '停用', value: '0' },
  ]
  const descItems = [
    { label: '模块', value: '用户管理' },
    { label: '操作人', value: 'admin' },
    { label: '状态', value: '成功' },
    { label: '请求 ID', value: '1024', type: 'copy' as const },
    { label: '参数', value: '{"id":1}', type: 'pre' as const, span: 2 },
  ]
  const orgTree = [
    {
      id: 1,
      name: '总公司',
      children: [
        { id: 2, name: '研发中心' },
        { id: 3, name: '运营中心' },
      ],
    },
  ]
  const orgUsers = [
    { id: 1, label: '管理员（admin）' },
    { id: 2, label: '演示用户（demo）' },
  ]
  const orgRoles = [
    { id: 1, label: '超级管理员' },
    { id: 2, label: '普通角色' },
  ]
  const mockFiles: FileInfo[] = [
    {
      path: 'docs/readme.md',
      name: 'readme.md',
      size: 1024,
      directory: false,
      lastModified: '2026-08-26',
    },
    {
      path: 'images/logo.png',
      name: 'logo.png',
      size: 20480,
      directory: false,
      lastModified: '2026-08-26',
    },
  ]

  async function demoExport() {
    const blob = new Blob(['name,status\n示例,启用\n'], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'demo.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

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
          intro="根据 SearchItem[] 配置驱动的查询表单，支持 input / number / select / date / daterange / datetime / dict / region，字段过多时可折叠。"
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
                options={[5, 8, 10, 20, 50].map((mb) => ({
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
      key: 'image',
      label: '图片上传',
      children: (
        <DemoBlock
          title="图片上传"
          name="XnImageUpload"
          intro="卡片预览、点击放大。limit=1 只传一张，大于 1 可多张。默认写入 MinIO（/files/upload），也可传入自定义 request。"
        >
          <Space orientation="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <Text type="secondary">单张</Text>
              <XnImageUpload
                value={singleImage}
                onChange={(value) => setSingleImage(typeof value === 'string' ? value : '')}
                limit={1}
                tip="用于 Logo / 头像这类只要一张的场景"
              />
            </div>
            <div>
              <Text type="secondary">多张</Text>
              <XnImageUpload
                value={multiImages}
                onChange={(value) => setMultiImages(Array.isArray(value) ? value : [])}
                limit={6}
                tip="最多 6 张，点击缩略图可预览"
              />
            </div>
          </Space>
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
      key: 'dialog',
      label: '弹窗',
      children: (
        <DemoBlock
          title="业务弹窗"
          name="XnDialog"
          intro="统一页脚、限高、可拖拽。支持 size 预设、内容区 loading、标题栏全屏。"
        >
          <Space wrap>
            <Button type="primary" onClick={() => setDialogOpen(true)}>
              打开弹窗
            </Button>
            <Button onClick={() => setDialogLoadingOpen(true)}>内容 loading</Button>
          </Space>
          <XnDialog
            open={dialogOpen}
            title="示例弹窗"
            size="large"
            showFullscreen
            onCancel={() => setDialogOpen(false)}
            onConfirm={() => setDialogOpen(false)}
          >
            <p>这里放表单或详情。右上角可切换全屏。确定 / 取消由组件提供，也可自定义 footer。</p>
          </XnDialog>
          <XnDialog
            open={dialogLoadingOpen}
            title="拉取详情"
            loading
            onCancel={() => setDialogLoadingOpen(false)}
            onConfirm={() => setDialogLoadingOpen(false)}
          >
            <p>打开后内容区会有遮罩，适合 getDetail 未返回时。</p>
          </XnDialog>
        </DemoBlock>
      ),
    },
    {
      key: 'export',
      label: '导出',
      children: (
        <DemoBlock
          title="导出"
          name="XnExport"
          intro="演示走本地生成 CSV，不打后端。业务页把 request 换成 exportUsers 一类接口即可。"
        >
          <Space wrap>
            <XnExport request={demoExport} text="导出示例 CSV" />
            <XnExport request={demoExport} confirm text="确认后导出" />
            <XnExport
              request={demoExport}
              showMessage={false}
              text="静默导出"
              onSuccess={() => message.info('页面自己提示')}
            />
          </Space>
        </DemoBlock>
      ),
    },
    {
      key: 'dict',
      label: '字典',
      children: (
        <DemoBlock
          title="字典下拉"
          name="XnDictSelect"
          intro="演示传入本地 options。业务页写 dictType 即可按类型拉启用项。"
        >
          <XnDictSelect
            value={dictValue}
            onChange={(v) => setDictValue(v ?? null)}
            options={dictOptions}
            style={{ maxWidth: 280 }}
          />
          <Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
            当前值：{dictValue || '—'}
          </Paragraph>
        </DemoBlock>
      ),
    },
    {
      key: 'cron',
      label: 'Cron',
      children: (
        <DemoBlock
          title="Cron 编辑器"
          name="XnCron"
          intro="Quartz 六段：秒 分 时 日 月 周。定时任务页已接入。"
        >
          <XnCron value={cronValue} onChange={setCronValue} />
          <Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
            {cronValue}
          </Paragraph>
        </DemoBlock>
      ),
    },
    {
      key: 'desc',
      label: '描述',
      children: (
        <DemoBlock
          title="详情描述"
          name="XnDesc"
          intro="详情描述列表。type: pre 用于长文本；type: copy 在值旁显示复制按钮。"
        >
          <XnDesc column={2} items={descItems} />
        </DemoBlock>
      ),
    },
    {
      key: 'org',
      label: '组织',
      children: (
        <DemoBlock
          title="组织选择器"
          name="XnOrgSelect"
          intro="演示用本地数据。type 支持 unit / user / role / post。"
        >
          <Form labelCol={{ flex: '72px' }} style={{ maxWidth: 420 }}>
            <Form.Item label="单位">
              <XnOrgSelect
                value={orgUnit}
                onChange={(v) => setOrgUnit(v as number | undefined)}
                type="unit"
                treeData={orgTree}
              />
            </Form.Item>
            <Form.Item label="用户">
              <XnOrgSelect
                value={orgUser}
                onChange={(v) => setOrgUser(v as number | undefined)}
                type="user"
                options={orgUsers}
              />
            </Form.Item>
            <Form.Item label="角色">
              <XnOrgSelect
                value={orgRole}
                onChange={(v) => setOrgRole(v as number | undefined)}
                type="role"
                options={orgRoles}
              />
            </Form.Item>
          </Form>
        </DemoBlock>
      ),
    },
    {
      key: 'file',
      label: '文件选择',
      children: (
        <DemoBlock
          title="文件选择器"
          name="XnFilePicker"
          intro="演示用本地文件列表。业务页不传 data 则浏览 MinIO。"
        >
          <XnFilePicker
            value={pickedFile}
            onChange={(v) => setPickedFile(typeof v === 'string' ? v : v.join(', '))}
            data={mockFiles}
          />
          <Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
            {pickedFile || '—'}
          </Paragraph>
        </DemoBlock>
      ),
    },
    {
      key: 'captcha',
      label: '验证码',
      children: (
        <DemoBlock title="验证码" name="XnCaptcha" intro="演示用本地图形码 / 滑块，不打登录接口。">
          <Space orientation="vertical" style={{ maxWidth: 360, width: '100%' }}>
            <XnCaptcha value={captchaCode} onChange={setCaptchaCode} mode="local" type="IMAGE" />
            <XnCaptcha mode="local" type="SLIDER" />
          </Space>
        </DemoBlock>
      ),
    },
    {
      key: 'avatar',
      label: '头像裁剪',
      children: (
        <DemoBlock
          title="头像裁剪"
          name="XnAvatarCrop"
          intro="选图 → 画布缩放拖拽 → 输出正方形 PNG。演示用本地 blob，不上传。"
        >
          <XnAvatarCrop value={avatarDemo} onChange={setAvatarDemo} />
        </DemoBlock>
      ),
    },
    {
      key: 'region',
      label: '省市区',
      children: (
        <DemoBlock
          title="省市区级联"
          name="XnRegion"
          intro="内置中国行政区划。演示不打接口。含非省会区县。valueType 可切 codes / labels / text。"
        >
          <Form labelCol={{ flex: '72px' }} style={{ maxWidth: 420 }}>
            <Form.Item label="省市区">
              <XnRegion
                value={regionCodes}
                onChange={(value, extra) => {
                  setRegionCodes(Array.isArray(value) ? value : [])
                  setRegionText(extra?.text || '')
                }}
              />
            </Form.Item>
            <Form.Item label="省市">
              <XnRegion
                value={regionCity}
                onChange={(value) => setRegionCity(Array.isArray(value) ? value : [])}
                level={2}
              />
            </Form.Item>
            <Form.Item label="文案">
              <XnRegion
                value={regionTextModel}
                onChange={(value) => setRegionTextModel(typeof value === 'string' ? value : '')}
                valueType="text"
              />
            </Form.Item>
          </Form>
          <Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
            {regionText || '—'} {regionCodes.join(' / ') || ''}
          </Paragraph>
        </DemoBlock>
      ),
    },
    {
      key: 'copy',
      label: '复制',
      children: (
        <DemoBlock title="复制按钮" name="XnCopy" intro="用于密钥、ID、日志等需要一键复制的场景。">
          <Space wrap>
            <XnCopy text="sk-demo-8f3a2c" showText label="复制密钥" />
            <XnCopy text="1024" showText />
            <XnCopy text="192.168.1.8" label="复制 IP" />
          </Space>
        </DemoBlock>
      ),
    },
    {
      key: 'code',
      label: '代码查看',
      children: (
        <DemoBlock
          title="JSON / 代码查看"
          name="XnCode"
          intro="异常日志、接口文档常用。JSON 会格式化并着色。"
        >
          <XnCode
            title="请求参数"
            language="json"
            value={{
              id: 1024,
              title: '更新用户',
              params: { username: 'admin', status: 1 },
            }}
          />
          <div style={{ height: 12 }} />
          <XnCode
            title="堆栈"
            language="text"
            value={`java.lang.IllegalArgumentException: token expired
    at com.smartadmin.security.JwtService.parse(JwtService.java:88)
    at com.smartadmin.security.AuthFilter.doFilter(AuthFilter.java:42)`}
          />
        </DemoBlock>
      ),
    },
    {
      key: 'sms',
      label: '短信验证码',
      children: (
        <DemoBlock
          title="短信倒计时"
          name="XnSmsCode"
          intro="手机登录 / 绑定用。演示 mode=local，不打短信接口。业务页传入 request 即可。"
        >
          <Form labelCol={{ flex: '72px' }} style={{ maxWidth: 420 }}>
            <Form.Item label="手机号">
              <Input
                value={smsPhone}
                maxLength={11}
                placeholder="请输入手机号"
                onChange={(e) => setSmsPhone(e.target.value)}
              />
            </Form.Item>
            <Form.Item label="验证码">
              <XnSmsCode value={smsCode} onChange={setSmsCode} phone={smsPhone} mode="local" />
            </Form.Item>
          </Form>
          <Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
            验证码：{smsCode || '—'}
          </Paragraph>
        </DemoBlock>
      ),
    },
    {
      key: 'empty',
      label: '空状态',
      children: (
        <DemoBlock
          title="空状态"
          name="XnEmpty"
          intro="无数据 / 无权限 / 无搜索结果 / 失败。表格空槽已默认使用本组件。"
        >
          <Space align="start" wrap size={24}>
            <XnEmpty type="data" size="small" />
            <XnEmpty type="permission" size="small" />
            <XnEmpty type="search" size="small" />
            <XnEmpty type="error" size="small" />
          </Space>
          <div style={{ marginTop: 16 }}>
            <XnTable data={[]} columns={tableColumns} rowKey="id" showPagination={false} />
          </div>
        </DemoBlock>
      ),
    },
    {
      key: 'popconfirm',
      label: '确认气泡',
      children: (
        <DemoBlock
          title="行内确认"
          name="XnPopconfirm"
          intro="行内删除比整页 Modal.confirm 轻。表格操作列的 delete 已默认接入。"
        >
          <XnPopconfirm
            title="确定删除「示例用户 A」吗？"
            onConfirm={() => message.success('已删除（演示）')}
          >
            <Button type="link" danger>
              删除
            </Button>
          </XnPopconfirm>
        </DemoBlock>
      ),
    },
    {
      key: 'watermark',
      label: '水印',
      children: (
        <DemoBlock
          title="页面水印"
          name="XnWatermark"
          intro="后台布局已套一层全局水印。这里是局部示例。"
        >
          <XnWatermark content="心念科技">
            <div className={styles.watermarkBox}>被水印覆盖的内容区</div>
          </XnWatermark>
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
          <Space orientation="vertical">
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
      <Tabs items={items} tabPlacement="start" className={styles.tabs} />
    </div>
  )
}
