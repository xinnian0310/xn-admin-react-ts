import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Button,
  Card,
  Col,
  Descriptions,
  Progress,
  Row,
  Space,
  Switch,
  Table,
  Tag,
  message,
  Modal,
  Spin,
} from 'antd'
import * as echarts from 'echarts/core'
import { GaugeChart } from 'echarts/charts'
import { CanvasRenderer } from 'echarts/renderers'
import type { EChartsType } from 'echarts/core'
import XnAuth from '@/components/XnAuth'
import { getInfraStatus, getServerMonitor, restartInfra } from '@/api/monitor'
import type { InfraComponent, InfraStatus, ServerMonitor } from '@/types'

echarts.use([GaugeChart, CanvasRenderer])

const emptyData: ServerMonitor = {
  cpu: { cores: 0, sysUsage: 0, processUsage: 0 },
  memory: { total: 0, used: 0, free: 0, usage: 0 },
  jvm: {
    total: 0,
    used: 0,
    free: 0,
    max: 0,
    usage: 0,
    version: '',
    vendor: '',
    home: '',
    uptimeSeconds: 0,
  },
  system: {
    osName: '',
    osArch: '',
    osVersion: '',
    hostName: '',
    ip: '',
    userDir: '',
    availableProcessors: 0,
  },
  disks: [],
}

const emptyComp = (): InfraComponent => ({
  enabled: false,
  status: '—',
  endpoint: '',
  message: '',
  restartable: false,
})

const emptyInfra = (): InfraStatus => ({
  redis: emptyComp(),
  minio: emptyComp(),
  nacos: emptyComp(),
  kkfileview: emptyComp(),
  backend: emptyComp(),
})

function usageColor(usage: number) {
  if (usage >= 90) return '#f56c6c'
  if (usage >= 70) return '#e6a23c'
  return '#67c23a'
}

function formatBytes(bytes: number) {
  if (!bytes || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const value = bytes / Math.pow(1024, i)
  return `${value.toFixed(value >= 100 || i === 0 ? 0 : 2)} ${units[i]}`
}

function formatUptime(seconds: number) {
  if (!seconds || seconds < 0) return '—'
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const parts: string[] = []
  if (d > 0) parts.push(`${d} 天`)
  if (h > 0) parts.push(`${h} 时`)
  parts.push(`${m} 分`)
  return parts.join(' ')
}

function statusTagColor(status?: string) {
  const s = (status || '').toUpperCase()
  if (s === 'UP') return 'success'
  if (s === 'DOWN') return 'error'
  if (s === 'DISABLED') return 'default'
  return 'warning'
}

function UsageGauge({ value }: { value: number }) {
  const color = usageColor(value)
  const hostRef = useRef<HTMLDivElement | null>(null)
  const chartRef = useRef<EChartsType | null>(null)

  useEffect(() => {
    const el = hostRef.current
    if (!el) return
    const chart = echarts.init(el)
    chartRef.current = chart
    const onResize = () => chart.resize()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      chart.dispose()
      chartRef.current = null
    }
  }, [])

  useEffect(() => {
    const chart = chartRef.current
    if (!chart) return
    chart.setOption(
      {
        animation: false,
        series: [
          {
            type: 'gauge',
            radius: '88%',
            center: ['50%', '58%'],
            startAngle: 210,
            endAngle: -30,
            min: 0,
            max: 100,
            splitNumber: 5,
            progress: { show: true, width: 10, roundCap: true, itemStyle: { color } },
            axisLine: { roundCap: true, lineStyle: { width: 10, color: [[1, '#ebeef5']] } },
            axisTick: { show: false },
            splitLine: {
              show: true,
              length: 8,
              distance: 2,
              lineStyle: { color: '#c0c4cc', width: 1 },
            },
            axisLabel: { distance: 14, color: '#909399', fontSize: 11 },
            pointer: { show: true, length: '46%', width: 3, itemStyle: { color } },
            anchor: { show: true, showAbove: true, size: 6, itemStyle: { color } },
            title: { show: false },
            detail: {
              valueAnimation: false,
              offsetCenter: [0, '28%'],
              fontSize: 20,
              fontWeight: 600,
              formatter: (v: number) => `${Number(v).toFixed(1)}%`,
              color,
            },
            data: [{ value: Number(value.toFixed(1)) }],
          },
        ],
      },
      true,
    )
  }, [value, color])

  return <div ref={hostRef} style={{ height: 180, width: '100%' }} />
}

export default function MonitorServerPage() {
  const [loading, setLoading] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [restarting, setRestarting] = useState('')
  const [data, setData] = useState<ServerMonitor>(emptyData)
  const [infra, setInfra] = useState<InfraStatus>(emptyInfra())

  const infraCards = useMemo(
    () => [
      { key: 'redis', title: 'Redis', ...infra.redis },
      { key: 'minio', title: 'MinIO', ...infra.minio },
      { key: 'nacos', title: 'Nacos', ...infra.nacos },
      { key: 'kkfileview', title: 'kkFileView', ...infra.kkfileview },
      { key: 'backend', title: 'Backend', ...infra.backend },
    ],
    [infra],
  )

  const gauges = useMemo(
    () => [
      {
        key: 'cpu',
        title: 'CPU 使用率',
        value: data.cpu.sysUsage,
        foot: `进程 ${data.cpu.processUsage}% · ${data.cpu.cores} 核`,
      },
      {
        key: 'mem',
        title: '内存使用率',
        value: data.memory.usage,
        foot: `${formatBytes(data.memory.used)} / ${formatBytes(data.memory.total)}`,
      },
      {
        key: 'jvm',
        title: 'JVM 使用率',
        value: data.jvm.usage,
        foot: `${formatBytes(data.jvm.used)} / ${formatBytes(data.jvm.max)}`,
      },
    ],
    [data],
  )

  async function load() {
    setLoading(true)
    try {
      const [serverRes, infraRes] = await Promise.all([getServerMonitor(), getInfraStatus()])
      setData(serverRes.data)
      setInfra(infraRes.data)
    } finally {
      setLoading(false)
    }
  }

  async function loadInfraOnly() {
    try {
      const res = await getInfraStatus()
      setInfra(res.data)
      return res.data
    } catch {
      return null
    }
  }

  useEffect(() => {
    void load()
  }, [])

  useEffect(() => {
    if (!autoRefresh) return
    const timer = setInterval(() => void load(), 5000)
    return () => clearInterval(timer)
  }, [autoRefresh])

  async function onRestart(name: string, title: string) {
    Modal.confirm({
      title: '一键重启',
      content: `确定重启 ${title}？将先释放端口再后台拉起，完成后请稍候查看状态。`,
      okText: '重启',
      onOk: async () => {
        setRestarting(name)
        try {
          const res = await restartInfra(name)
          message.success(res.data?.message || '已发送重启指令')
          const deadline = Date.now() + 90_000
          while (Date.now() < deadline) {
            await new Promise((r) => setTimeout(r, 2000))
            const next = await loadInfraOnly()
            const card = next
              ? [
                  { key: 'redis', ...next.redis },
                  { key: 'minio', ...next.minio },
                  { key: 'nacos', ...next.nacos },
                  { key: 'kkfileview', ...next.kkfileview },
                  { key: 'backend', ...next.backend },
                ].find((c) => c.key === name)
              : undefined
            if (card?.status === 'UP') {
              message.success(`${title} 已恢复`)
              break
            }
          }
        } finally {
          setRestarting('')
        }
      },
    })
  }

  return (
    <Spin spinning={loading}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 16 }}>
        <Card
          title="服务监控"
          extra={
            <Space>
              <span>自动刷新</span>
              <Switch checked={autoRefresh} onChange={setAutoRefresh} />
              <XnAuth permission="server:refresh">
                <Button onClick={() => void load()}>刷新</Button>
              </XnAuth>
            </Space>
          }
        >
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 12 }}>
              <strong>配套组件</strong>
            </div>
            <div
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'stretch',
              }}
            >
              {infraCards.map((item) => (
                <div
                  key={item.key}
                  style={{
                    flex: '1 1 0',
                    minWidth: 0,
                    display: 'flex',
                  }}
                >
                  <Card
                    size="small"
                    style={{ width: '100%', height: '100%' }}
                    styles={{ body: { padding: 12, height: '100%' } }}
                  >
                    <div
                      style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}
                    >
                      <strong>{item.title}</strong>
                      <Tag color={statusTagColor(item.status)}>{item.status || '—'}</Tag>
                    </div>
                    <div
                      title={item.endpoint}
                      style={{
                        fontSize: 12,
                        color: 'rgba(0,0,0,0.45)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.endpoint || '—'}
                    </div>
                    <div
                      title={item.message}
                      style={{
                        fontSize: 12,
                        margin: '6px 0 10px',
                        minHeight: 36,
                        color: 'rgba(0,0,0,0.65)',
                      }}
                    >
                      {item.message || '—'}
                    </div>
                    {item.restartable && item.status !== 'UP' && item.status !== 'DISABLED' ? (
                      <XnAuth permission="server:restart">
                        <Button
                          type="primary"
                          size="small"
                          loading={restarting === item.key}
                          onClick={() => void onRestart(item.key, item.title)}
                        >
                          重启
                        </Button>
                      </XnAuth>
                    ) : (
                      <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
                        {item.key === 'backend' ? '本服务' : item.status === 'UP' ? '运行中' : ''}
                      </span>
                    )}
                  </Card>
                </div>
              ))}
            </div>
          </div>

          <Row gutter={16}>
            {gauges.map((g) => (
              <Col key={g.key} xs={24} sm={8}>
                <Card size="small">
                  <UsageGauge value={g.value} />
                  <div style={{ textAlign: 'center', fontWeight: 600 }}>{g.title}</div>
                  <div style={{ textAlign: 'center', color: 'rgba(0,0,0,0.45)', fontSize: 12 }}>
                    {g.foot}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>

        <Row gutter={16}>
          <Col xs={24} lg={12}>
            <Card title="服务器信息" size="small">
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="操作系统">{data.system.osName}</Descriptions.Item>
                <Descriptions.Item label="系统架构">{data.system.osArch}</Descriptions.Item>
                <Descriptions.Item label="系统版本">{data.system.osVersion}</Descriptions.Item>
                <Descriptions.Item label="主机名称">{data.system.hostName}</Descriptions.Item>
                <Descriptions.Item label="服务器 IP">{data.system.ip}</Descriptions.Item>
                <Descriptions.Item label="CPU 核心数">{data.cpu.cores} 核</Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="JVM 信息" size="small">
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="Java 版本">{data.jvm.version}</Descriptions.Item>
                <Descriptions.Item label="运行厂商">{data.jvm.vendor}</Descriptions.Item>
                <Descriptions.Item label="堆内存 (已用/最大)">
                  {formatBytes(data.jvm.used)} / {formatBytes(data.jvm.max)}
                </Descriptions.Item>
                <Descriptions.Item label="启动时间">{data.jvm.startTime || '—'}</Descriptions.Item>
                <Descriptions.Item label="运行时长">
                  {formatUptime(data.jvm.uptimeSeconds)}
                </Descriptions.Item>
                <Descriptions.Item label="安装路径">{data.jvm.home}</Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
        </Row>

        <Card title="磁盘状态" size="small">
          <Table
            rowKey="name"
            dataSource={data.disks}
            pagination={false}
            locale={{ emptyText: '暂无磁盘数据' }}
            columns={[
              { title: '盘符 / 挂载点', dataIndex: 'name', minWidth: 160 },
              { title: '文件系统', dataIndex: 'type', minWidth: 120 },
              {
                title: '总大小',
                dataIndex: 'total',
                minWidth: 110,
                render: (v: number) => formatBytes(v),
              },
              {
                title: '已用',
                dataIndex: 'used',
                minWidth: 110,
                render: (v: number) => formatBytes(v),
              },
              {
                title: '可用',
                dataIndex: 'free',
                minWidth: 110,
                render: (v: number) => formatBytes(v),
              },
              {
                title: '使用率',
                dataIndex: 'usage',
                minWidth: 200,
                render: (v: number) => (
                  <Progress percent={Math.round(v)} strokeColor={usageColor(v)} size="small" />
                ),
              },
            ]}
          />
        </Card>
      </div>
    </Spin>
  )
}
