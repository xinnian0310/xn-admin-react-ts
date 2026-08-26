import { useState } from 'react'
import {
  Affix,
  Alert,
  Anchor,
  App,
  Avatar,
  Badge,
  Breadcrumb,
  Button,
  Calendar,
  Card,
  Carousel,
  Cascader,
  Checkbox,
  Col,
  Collapse,
  ColorPicker,
  DatePicker,
  Descriptions,
  Divider,
  Drawer,
  Dropdown,
  Empty,
  FloatButton,
  Form,
  Image,
  Input,
  InputNumber,
  Mentions,
  Modal,
  Pagination,
  Popconfirm,
  Popover,
  Progress,
  Radio,
  Rate,
  Result,
  Row,
  Segmented,
  Select,
  Skeleton,
  Slider,
  Space,
  Spin,
  Steps,
  Switch,
  Table,
  Tabs,
  Tag,
  Timeline,
  TimePicker,
  Tooltip,
  Transfer,
  Tree,
  TreeSelect,
  Typography,
  Upload,
  theme,
} from 'antd'
import {
  DownloadOutlined,
  HomeOutlined,
  PlusOutlined,
  SearchOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons'
import type { TransferProps, UploadProps } from 'antd'
import dayjs from 'dayjs'
import styles from '../demo.module.scss'

const { Title, Paragraph, Text } = Typography
const { RangePicker } = DatePicker

const cascaderOptions = [
  {
    value: 'zhejiang',
    label: '浙江',
    children: [
      { value: 'hangzhou', label: '杭州', children: [{ value: 'xihu', label: '西湖' }] },
      { value: 'ningbo', label: '宁波' },
    ],
  },
  {
    value: 'jiangsu',
    label: '江苏',
    children: [
      { value: 'nanjing', label: '南京', children: [{ value: 'zhonghuamen', label: '中华门' }] },
    ],
  },
]

const treeData = [
  {
    title: '总公司',
    key: '0',
    children: [
      { title: '研发部', key: '0-0', children: [{ title: '前端组', key: '0-0-0' }] },
      { title: '市场部', key: '0-1' },
    ],
  },
]

const transferData: TransferProps['dataSource'] = Array.from({ length: 8 }).map((_, i) => ({
  key: String(i),
  title: `选项 ${i + 1}`,
  description: `描述 ${i + 1}`,
}))

const tableData = [
  { key: '1', name: '张三', age: 28, city: '杭州' },
  { key: '2', name: '李四', age: 32, city: '上海' },
  { key: '3', name: '王五', age: 24, city: '北京' },
]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card size="small" title={title} className={styles.section} variant="borderless">
      {children}
    </Card>
  )
}

export default function DemoUiPage() {
  const { message, notification, modal } = App.useApp()
  const { token } = theme.useToken()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [transferTarget, setTransferTarget] = useState<TransferProps['targetKeys']>([])
  const [segment, setSegment] = useState('日')

  const uploadProps: UploadProps = {
    beforeUpload: () => {
      message.info('演示环境不实际上传')
      return false
    },
  }

  const items = [
    {
      key: 'general',
      label: '通用',
      children: (
        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
          <Section title="Button 按钮">
            <Space wrap>
              <Button type="primary">Primary</Button>
              <Button>Default</Button>
              <Button type="dashed">Dashed</Button>
              <Button type="text">Text</Button>
              <Button type="link">Link</Button>
              <Button type="primary" danger>
                Danger
              </Button>
              <Button type="primary" icon={<PlusOutlined />}>
                带图标
              </Button>
              <Button type="primary" loading>
                Loading
              </Button>
              <Button type="primary" shape="circle" icon={<SearchOutlined />} />
              <Button disabled>Disabled</Button>
            </Space>
          </Section>
          <Section title="Typography 排版">
            <Title level={4} style={{ marginTop: 0 }}>
              标题 Typography.Title
            </Title>
            <Paragraph>
              这是一段正文。支持 <Text type="secondary">次要</Text>、
              <Text type="success">成功</Text>、<Text type="warning">警告</Text>、
              <Text type="danger">危险</Text>、<Text code>code</Text>、<Text mark>标记</Text>、
              <Text strong>加粗</Text>。
            </Paragraph>
            <Paragraph copyable>可复制文本</Paragraph>
          </Section>
          <Section title="FloatButton 悬浮按钮">
            <Text type="secondary">页面右下角可见 FloatButton（本页已挂载）。</Text>
            <FloatButton.Group shape="circle" style={{ right: 40, bottom: 40 }}>
              <FloatButton icon={<SettingOutlined />} tooltip="设置" />
              <FloatButton.BackTop visibilityHeight={80} />
            </FloatButton.Group>
          </Section>
        </Space>
      ),
    },
    {
      key: 'layout',
      label: '布局',
      children: (
        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
          <Section title="Grid 栅格">
            <Row gutter={[8, 8]}>
              {[6, 6, 6, 6, 8, 8, 8, 12, 12].map((span, i) => (
                <Col key={i} span={span}>
                  <div
                    className={styles.gridCell}
                    style={{ background: i % 2 ? token.colorPrimaryBg : token.colorFillSecondary }}
                  >
                    span={span}
                  </div>
                </Col>
              ))}
            </Row>
          </Section>
          <Section title="Space / Divider">
            <Space>
              <Button>A</Button>
              <Button>B</Button>
              <Button>C</Button>
            </Space>
            <Divider titlePlacement="left">分割线</Divider>
            <Space split={<Divider vertical />}>
              <Text>链接一</Text>
              <Text>链接二</Text>
              <Text>链接三</Text>
            </Space>
          </Section>
          <Section title="Affix 固钉">
            <Affix offsetTop={80}>
              <Button type="primary">固钉示例（滚动时吸顶）</Button>
            </Affix>
          </Section>
        </Space>
      ),
    },
    {
      key: 'nav',
      label: '导航',
      children: (
        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
          <Section title="Breadcrumb / Dropdown / Pagination">
            <Breadcrumb
              items={[
                { href: '', title: <HomeOutlined /> },
                { title: '组件演示' },
                { title: '基础组件' },
              ]}
            />
            <Divider />
            <Dropdown
              menu={{
                items: [
                  { key: '1', label: '菜单项一' },
                  { key: '2', label: '菜单项二' },
                  { key: '3', label: '菜单项三', danger: true },
                ],
              }}
            >
              <Button>下拉菜单</Button>
            </Dropdown>
            <Divider />
            <Pagination defaultCurrent={1} total={50} showSizeChanger showQuickJumper />
          </Section>
          <Section title="Steps / Tabs / Segmented / Anchor">
            <Steps
              current={1}
              items={[
                { title: '填写', content: '基本信息' },
                { title: '确认', content: '核对内容' },
                { title: '完成', content: '提交成功' },
              ]}
            />
            <Divider />
            <Segmented options={['日', '周', '月', '年']} value={segment} onChange={setSegment} />
            <Divider />
            <Tabs
              size="small"
              items={[
                { key: 'a', label: '标签 A', children: '内容 A' },
                { key: 'b', label: '标签 B', children: '内容 B' },
                { key: 'c', label: '标签 C', children: '内容 C' },
              ]}
            />
            <Divider />
            <Anchor
              affix={false}
              items={[
                { key: '1', href: '#demo-ui-top', title: '页顶' },
                { key: '2', href: '#demo-ui-form', title: '表单区' },
              ]}
            />
          </Section>
        </Space>
      ),
    },
    {
      key: 'form',
      label: '数据录入',
      children: (
        <div id="demo-ui-form">
          <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
            <Section title="表单控件">
              <Form layout="vertical" style={{ maxWidth: 640 }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label="Input">
                      <Input placeholder="请输入" allowClear prefix={<UserOutlined />} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Input.Password">
                      <Input.Password placeholder="密码" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Input.TextArea">
                      <Input.TextArea rows={2} placeholder="多行文本" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="InputNumber">
                      <InputNumber style={{ width: '100%' }} min={0} max={100} defaultValue={10} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Select">
                      <Select
                        placeholder="请选择"
                        options={[
                          { value: 'a', label: '选项 A' },
                          { value: 'b', label: '选项 B' },
                        ]}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="TreeSelect">
                      <TreeSelect
                        treeData={[
                          {
                            title: '节点 1',
                            value: '1',
                            children: [{ title: '子节点', value: '1-1' }],
                          },
                        ]}
                        placeholder="请选择"
                        treeDefaultExpandAll
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Cascader">
                      <Cascader options={cascaderOptions} placeholder="省 / 市 / 区" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="DatePicker">
                      <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="RangePicker">
                      <RangePicker style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="TimePicker">
                      <TimePicker
                        style={{ width: '100%' }}
                        defaultValue={dayjs('12:00:00', 'HH:mm:ss')}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item label="Mentions">
                      <Mentions
                        rows={2}
                        placeholder="输入 @ 提及"
                        options={[
                          { value: '张三', label: '张三' },
                          { value: '李四', label: '李四' },
                        ]}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Radio">
                      <Radio.Group defaultValue="a">
                        <Radio value="a">A</Radio>
                        <Radio value="b">B</Radio>
                        <Radio.Button value="c">C</Radio.Button>
                      </Radio.Group>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Checkbox">
                      <Checkbox.Group options={['苹果', '香蕉', '橙子']} defaultValue={['苹果']} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Switch" valuePropName="checked">
                      <Switch defaultChecked />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Slider">
                      <Slider defaultValue={36} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Rate">
                      <Rate allowHalf defaultValue={3.5} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="ColorPicker">
                      <ColorPicker defaultValue="#1677ff" showText />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item label="Upload">
                      <Upload {...uploadProps} listType="picture-card">
                        <button type="button" style={{ border: 0, background: 'none' }}>
                          <PlusOutlined />
                          <div style={{ marginTop: 8 }}>上传</div>
                        </button>
                      </Upload>
                    </Form.Item>
                  </Col>
                </Row>
              </Form>
            </Section>
            <Section title="Transfer 穿梭框">
              <Transfer
                dataSource={transferData}
                targetKeys={transferTarget}
                onChange={setTransferTarget}
                render={(item) => item.title}
                listStyle={{ width: 200, height: 240 }}
              />
            </Section>
          </Space>
        </div>
      ),
    },
    {
      key: 'data',
      label: '数据展示',
      children: (
        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
          <Section title="Table / Tag / Badge / Avatar">
            <Space wrap style={{ marginBottom: 12 }}>
              <Tag color="blue">blue</Tag>
              <Tag color="success">success</Tag>
              <Tag color="warning">warning</Tag>
              <Tag color="error">error</Tag>
              <Badge count={5}>
                <Avatar shape="square" icon={<UserOutlined />} />
              </Badge>
              <Badge status="processing" text="进行中" />
              <Avatar.Group>
                <Avatar style={{ background: '#1677ff' }}>A</Avatar>
                <Avatar style={{ background: '#87d068' }}>B</Avatar>
                <Avatar icon={<UserOutlined />} />
              </Avatar.Group>
            </Space>
            <Table
              size="small"
              pagination={false}
              dataSource={tableData}
              columns={[
                { title: '姓名', dataIndex: 'name' },
                { title: '年龄', dataIndex: 'age' },
                { title: '城市', dataIndex: 'city' },
              ]}
            />
          </Section>
          <Section title="Descriptions / List / Empty / Image">
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="系统">xn-admin-react-ts</Descriptions.Item>
              <Descriptions.Item label="UI">Ant Design 6</Descriptions.Item>
              <Descriptions.Item label="说明" span={2}>
                本页用于演示 Ant Design 常用组件外观与交互。
              </Descriptions.Item>
            </Descriptions>
            <Divider />
            <ul className={styles.plainList}>
              {['列表项一', '列表项二', '列表项三'].map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <Divider />
            <Space align="start" size="large">
              <Empty description="空状态" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              <Image
                width={120}
                src="https://gw.alipayobjects.com/zos/antfincdn/aPkFc8XQLv/method-draw-image.svg"
              />
            </Space>
          </Section>
          <Section title="Tree / Timeline / Collapse / Calendar / Carousel">
            <Row gutter={16}>
              <Col span={8}>
                <Tree treeData={treeData} defaultExpandAll />
              </Col>
              <Col span={8}>
                <Timeline
                  items={[
                    { content: '创建账号' },
                    { content: '完善资料', color: 'green' },
                    { content: '开始使用', color: 'gray' },
                  ]}
                />
              </Col>
              <Col span={8}>
                <Collapse
                  size="small"
                  items={[
                    { key: '1', label: '面板一', children: '内容一' },
                    { key: '2', label: '面板二', children: '内容二' },
                  ]}
                />
              </Col>
            </Row>
            <Divider />
            <Calendar fullscreen={false} style={{ maxWidth: 420 }} />
            <Divider />
            <Carousel autoplay style={{ maxWidth: 420 }}>
              {['#1677ff', '#13c2c2', '#52c41a'].map((bg) => (
                <div key={bg}>
                  <div className={styles.carouselItem} style={{ background: bg }}>
                    Carousel
                  </div>
                </div>
              ))}
            </Carousel>
          </Section>
          <Section title="Tooltip / Popover / Popconfirm">
            <Space>
              <Tooltip title="提示文案">
                <Button>Tooltip</Button>
              </Tooltip>
              <Popover content="气泡卡片内容" title="标题">
                <Button>Popover</Button>
              </Popover>
              <Popconfirm title="确认删除？" onConfirm={() => message.success('已确认')}>
                <Button danger>Popconfirm</Button>
              </Popconfirm>
            </Space>
          </Section>
        </Space>
      ),
    },
    {
      key: 'feedback',
      label: '反馈',
      children: (
        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
          <Section title="Alert / Progress / Spin / Skeleton">
            <Space orientation="vertical" style={{ width: '100%' }}>
              <Alert title="成功提示" type="success" showIcon />
              <Alert title="信息提示" type="info" showIcon />
              <Alert title="警告提示" type="warning" showIcon closable />
              <Alert title="错误提示" type="error" showIcon />
            </Space>
            <Divider />
            <Space wrap>
              <Progress percent={60} style={{ width: 180 }} />
              <Progress type="circle" percent={75} size={72} />
              <Spin />
            </Space>
            <Divider />
            <Skeleton active avatar paragraph={{ rows: 2 }} />
          </Section>
          <Section title="Message / Notification / Modal / Drawer / Result">
            <Space wrap>
              <Button onClick={() => message.success('操作成功')}>Message</Button>
              <Button
                onClick={() =>
                  notification.info({ message: '通知标题', description: '这是一条通知说明。' })
                }
              >
                Notification
              </Button>
              <Button onClick={() => setModalOpen(true)}>Modal</Button>
              <Button onClick={() => setDrawerOpen(true)}>Drawer</Button>
              <Button
                onClick={() =>
                  modal.confirm({
                    title: '确认操作？',
                    content: '使用 App.useApp().modal 调用。',
                  })
                }
              >
                Confirm
              </Button>
            </Space>
            <Divider />
            <Result
              status="success"
              title="操作成功"
              subTitle="Result 组件用于展示处理结果。"
              extra={<Button type="primary">返回</Button>}
            />
          </Section>
        </Space>
      ),
    },
    {
      key: 'other',
      label: '其他',
      children: (
        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
          <Section title="Card">
            <Row gutter={16}>
              <Col span={8}>
                <Card title="卡片标题" extra={<a href="#demo-ui-top">更多</a>} size="small">
                  卡片内容区域
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" cover={<div className={styles.cardCover} />}>
                  <Card.Meta title="带封面" description="Meta 描述文案" />
                </Card>
              </Col>
              <Col span={8}>
                <Card
                  size="small"
                  actions={[<SettingOutlined key="s" />, <DownloadOutlined key="d" />]}
                >
                  带操作区
                </Card>
              </Col>
            </Row>
          </Section>
        </Space>
      ),
    },
  ]

  return (
    <div className={`demo-page ${styles.page}`} id="demo-ui-top">
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Ant Design 基础组件</h2>
          <p className={styles.desc}>
            按 Ant Design 常用分类展示组件示例，便于对照主题色、尺寸与暗色模式效果。完整 API
            请参阅官方文档。
          </p>
        </div>
        <Tag color="blue">antd</Tag>
      </div>
      <Tabs items={items} tabPlacement="start" className={styles.tabs} />
      <Modal
        title="Modal 示例"
        open={modalOpen}
        onOk={() => setModalOpen(false)}
        onCancel={() => setModalOpen(false)}
      >
        <p>这是 Ant Design Modal 的基础用法。</p>
      </Modal>
      <Drawer title="Drawer 示例" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <p>从右侧滑出的抽屉面板。</p>
      </Drawer>
    </div>
  )
}
