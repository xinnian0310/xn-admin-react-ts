export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export type { SearchForm, SearchItem, SearchItemOption, SearchItemType } from './search'
export { SEARCH_FIELD_DEFAULT_WIDTH } from './search'
export type { ButtonColorType, ButtonDropdownItem, ButtonListItem } from './button'
export type {
  TableColumnAlign,
  TableColumnFixed,
  TableColumnItem,
  TableColumnOption,
  TableColumnType,
  TableTagType,
} from './table'
export type { CrudApi, CrudApiModule, CrudSaveExpose } from './crud'
export type { DictType, DictTypeForm, DictData, DictDataForm } from './dict'
export type { Post, PostForm } from './post'
export type { JobLog } from './job-log'
export type { RecycleBinItem } from './recycle'
export type { LoginPageConfig, LoginPageConfigForm, LoginCaptchaType } from './login-page'
export { DICT_LIST_CLASS_OPTIONS } from './dict'
export type { LoginLog, OperLog, ExceptionLog, OperBusinessType } from './log'

export interface Role {
  id: number
  code: string
  name: string
  description?: string
  status: number
  builtIn: boolean
  /** ALL | UNIT_AND_CHILDREN | UNIT | SELF */
  dataScope?: string
}

export interface RoleDetail extends Role {
  permissionIds: number[]
}

export interface Permission {
  id: number
  code: string
  name: string
  type: 'MENU' | 'BUTTON' | 'API' | 'TABLE_BUTTON'
  parentId?: number | null
  path?: string
  method?: string
  /** 前端动作标识：add / edit / view / delete / assign / add-child 等 */
  action?: string
  /** Element Plus 图标名 */
  icon?: string
  /** React / Ant Design / Iconify 图标（可选） */
  iconAntd?: string
  /** 按钮颜色，对应 typeColor */
  buttonColor?: string
  sort: number
  builtIn: boolean
  children?: Permission[]
}

export interface MenuPermissionGroup {
  menuId: number
  menuName: string
  menuCode?: string
  api: Permission[]
  button: Permission[]
  tableButton: Permission[]
}

export interface User {
  id: number
  username: string
  nickname: string
  email: string
  phone: string
  /** 后端已对邮箱/手机号打码（无 user:sensitive:view） */
  sensitiveMasked?: boolean
  avatar?: string
  status: number
  role?: string
  roleList?: Role[]
  unitRoleList?: Role[]
  effectiveRoleList?: Role[]
  roles?: string[]
  permissions?: string[]
  unitId?: number | null
  unitName?: string
  postId?: number | null
  postName?: string
  /** 需强制修改密码（首次/管理员重置/已过期） */
  mustChangePassword?: boolean
  createdAt: string
  updatedAt: string
}

export interface LoginResult {
  token: string
  user: User
}

export interface PageResult<T> {
  records: T[]
  total: number
  page: number
  size: number
}

export interface NameValue {
  name: string
  value: number
}

export interface TrendPoint {
  date: string
  count: number
}

export interface RecentNotice {
  id: number
  title: string
  status: NoticeStatus
  publishedAt?: string
  publisherName?: string
}

export interface DashboardStats {
  totalUsers: number
  activeUsers: number
  adminUsers: number
  todayNewUsers: number
  yesterdayNewUsers: number
  totalRoles: number
  totalUnits: number
  publishedNotices: number
  roleDistribution: NameValue[]
  unitDistribution: NameValue[]
  statusDistribution: NameValue[]
  registerTrend: TrendPoint[]
  recentNotices: RecentNotice[]
}

export interface OnlineUser {
  userId: number
  username?: string
  nickname?: string
  unitName?: string
  roles?: string
  ip?: string
  sessionCount: number
  loginTime?: string
  onlineSeconds: number
}

export interface ServerMonitor {
  cpu: { cores: number; sysUsage: number; processUsage: number }
  memory: { total: number; used: number; free: number; usage: number }
  jvm: {
    total: number
    used: number
    free: number
    max: number
    usage: number
    version: string
    vendor: string
    home: string
    startTime?: string
    uptimeSeconds: number
  }
  system: {
    osName: string
    osArch: string
    osVersion: string
    hostName: string
    ip: string
    userDir: string
    availableProcessors: number
  }
  disks: { name: string; type: string; total: number; used: number; free: number; usage: number }[]
}

export interface InfraComponent {
  name?: string
  enabled: boolean
  status: string
  endpoint?: string
  message?: string
  restartable?: boolean
}

export interface InfraStatus {
  redis: InfraComponent
  minio: InfraComponent
  nacos: InfraComponent
  kkfileview: InfraComponent
  backend: InfraComponent
  restartEnabled?: boolean
  projectRoot?: string
  startCommand?: string
}

export interface UserForm {
  username: string
  password?: string
  nickname: string
  email: string
  phone: string
  status: number
  roleIds: number[]
  unitId?: number | null
  postId?: number | null
}

export type NoticeStatus = 'DRAFT' | 'PUBLISHED' | 'REVOKED'

export interface Notice {
  id: number
  title: string
  content: string
  status: NoticeStatus
  publisherId?: number
  publisherName?: string
  publishedAt?: string
  revokedAt?: string
  createdAt?: string
  updatedAt?: string
  readCount?: number
  totalCount?: number
}

export interface NoticeForm {
  title: string
  content: string
}

export interface NoticeReader {
  userId: number
  username?: string
  nickname?: string
  readAt?: string
}

export interface MyNotice {
  id: number
  title: string
  content: string
  publishedAt?: string
  /** 接收时间 */
  receivedAt?: string
  read: boolean
  readAt?: string
  publisherId?: number
  publisherName?: string
}

export type MessageStatus = 'DRAFT' | 'SENT'

export interface Message {
  id: number
  title: string
  content: string
  status: MessageStatus
  senderId?: number
  senderName?: string
  sentAt?: string
  createdAt?: string
  updatedAt?: string
  readCount?: number
  totalCount?: number
}

export interface MessageForm {
  title: string
  content: string
}

export interface MessageSendForm {
  userIds?: number[]
  sendToAll?: boolean
}

export interface MessageReader {
  userId: number
  username?: string
  nickname?: string
  readAt?: string
}

export interface MyMessage {
  id: number
  title: string
  content: string
  status: MessageStatus
  sentAt?: string
  senderName?: string
  read: boolean
  readAt?: string
  receivedAt?: string
}

export interface FileInfo {
  id?: number
  path: string
  name: string
  storedName?: string
  extension?: string
  contentType?: string
  size: number
  directory: boolean
  lastModified?: string
  storage?: 'local' | 'minio' | string
  bucket?: string
  url?: string
  previewUrl?: string
  uploader?: string
  prefix?: string
}

export interface FileTreeNode {
  id: string
  label: string
  path: string
  children?: FileTreeNode[]
}

export interface FileBrowseResult {
  storage: string
  prefix: string
  dirs: FileInfo[]
  files: FileInfo[]
}

export interface Job {
  id: number
  name: string
  jobKey: string
  cron: string
  invokeTarget: string
  status: number
  remark?: string
  concurrent?: boolean
  /** 0默认 1忽略misfire 2补偿执行 3不触发 */
  misfirePolicy?: string
  lastRunAt?: string
  lastStatus?: string
  lastMessage?: string
  createdAt?: string
  updatedAt?: string
}

export interface JobForm {
  name: string
  jobKey: string
  cron: string
  invokeTarget: string
  status?: number
  remark?: string
  concurrent?: boolean
  misfirePolicy?: string
}

export interface RedisMonitor {
  status: 'ENABLED' | 'DISABLED' | 'ERROR'
  message?: string
  host?: string
  port?: number
  keyCount?: number
  info?: Record<string, string>
  sampleKeys?: string[]
}

export interface SqlRecord {
  id?: number
  sql: string
  durationMs?: number | null
  executedAt?: string
}

export interface SqlMonitor {
  queryCount: number
  bufferSize: number
  records: SqlRecord[]
}

export interface RoleForm {
  code: string
  name: string
  description?: string
  status?: number
  dataScope?: string
}

export interface SysUnit {
  id: number
  code: string
  name: string
  parentId?: number | null
  description?: string
  sort: number
  status: number
  builtIn: boolean
  roleIds?: number[]
  roleList?: Role[]
  children?: SysUnit[]
}

export interface SysUnitForm {
  code: string
  name: string
  parentId?: number | null
  description?: string
  sort?: number
  status?: number
  roleIds?: number[]
}

export interface PermissionForm {
  code: string
  name: string
  type: 'MENU' | 'BUTTON' | 'API' | 'TABLE_BUTTON'
  parentId?: number | null
  path?: string
  method?: string
  action?: string
  icon?: string
  iconAntd?: string
  buttonColor?: string
  sort?: number
}

export interface SysRoute {
  id: number
  title: string
  path?: string
  viewPath?: string
  icon?: string
  /** React 端菜单图标；优先于 icon */
  iconAntd?: string
  permission?: string
  parentId?: number | null
  type: 'DIR' | 'MENU'
  sort: number
  status: number
  hidden: boolean
  affix: boolean
  /** 是否启用菜单权限控制 */
  permissionControl: boolean
  builtIn: boolean
  children?: SysRoute[]
}

export interface SysRouteForm {
  title: string
  path?: string
  viewPath?: string
  icon?: string
  iconAntd?: string
  permission?: string
  parentId?: number | null
  type: 'DIR' | 'MENU'
  sort?: number
  status?: number
  hidden?: boolean
  affix?: boolean
  permissionControl?: boolean
}
