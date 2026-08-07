import { useEffect, useMemo, useState } from 'react'
import { Card, Col, Row, Statistic, Tag, Typography } from 'antd'
import { Line, Pie } from '@ant-design/plots'
import {
  TeamOutlined,
  UserSwitchOutlined,
  UserAddOutlined,
  SafetyCertificateOutlined,
  BankOutlined,
  NotificationOutlined,
} from '@ant-design/icons'
import { appConfig } from '@/config/app'
import { homeConfig } from '@/config/home'
import { getDashboardStats } from '@/api/dashboard'
import XnAppIcon from '@/components/XnAppIcon'
import type { DashboardStats } from '@/types'
import styles from './dashboard.module.scss'

const STAT_META = [
  { key: 'totalUsers', title: '用户总数', icon: TeamOutlined, tone: 'blue' },
  { key: 'activeUsers', title: '活跃用户', icon: UserSwitchOutlined, tone: 'cyan' },
  { key: 'todayNewUsers', title: '今日新增', icon: UserAddOutlined, tone: 'green' },
  { key: 'totalRoles', title: '角色数', icon: SafetyCertificateOutlined, tone: 'purple' },
  { key: 'totalUnits', title: '单位数', icon: BankOutlined, tone: 'orange' },
  { key: 'publishedNotices', title: '已发公告', icon: NotificationOutlined, tone: 'magenta' },
] as const

const PIE_COLORS = ['#1677ff', '#13c2c2', '#52c41a', '#722ed1', '#fa8c16', '#eb2f96', '#2f54eb', '#a0d911']

type StatKey = (typeof STAT_META)[number]['key']

/** 坐标轴日期：YYYY-MM-DD → MM-DD，减少拥挤 */
function formatAxisDate(value: unknown) {
  const raw = String(value ?? '')
  const m = raw.match(/(?:\d{4}-)?(\d{2})-(\d{2})/)
  return m ? `${m[1]}-${m[2]}` : raw
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)

  useEffect(() => {
    void getDashboardStats()
      .then((res) => setStats(res.data || null))
      .catch(() => setStats(null))
  }, [])

  const trendConfig = useMemo(() => {
    const points = stats?.registerTrend || []
    const tickStep = Math.max(1, Math.ceil(points.length / 7))
    return {
      data: points.map((p) => ({ date: p.date, count: p.count })),
      xField: 'date',
      yField: 'count',
      height: 280,
      autoFit: true,
      smooth: true,
      style: { lineWidth: 2 },
      axis: {
        x: {
          labelFormatter: formatAxisDate,
          labelAutoRotate: false,
          labelAutoHide: true,
          labelFontSize: 11,
          tickFilter: (_: unknown, index: number) =>
            index % tickStep === 0 || index === points.length - 1,
        },
        y: { tickInterval: 1, labelFontSize: 11 },
      },
      tooltip: {
        title: (d: { date?: string }) => d.date ?? '',
      },
    }
  }, [stats])

  const roleItems = useMemo(() => {
    const items = stats?.roleDistribution || []
    const total = items.reduce((sum, i) => sum + (i.value || 0), 0) || 1
    return items.map((i, index) => {
      const value = i.value || 0
      return {
        name: i.name,
        value,
        pct: Math.round((value / total) * 100),
        color: PIE_COLORS[index % PIE_COLORS.length],
      }
    })
  }, [stats])

  const roleConfig = useMemo(
    () => ({
      data: roleItems,
      angleField: 'value',
      colorField: 'name',
      scale: { color: { range: roleItems.map((i) => i.color) } },
      height: 220,
      autoFit: true,
      innerRadius: 0.62,
      padding: 4,
      label: false,
      legend: false,
      tooltip: {
        title: (d: { name?: string }) => d.name ?? '',
        items: [{ field: 'value', name: '数量' }],
      },
    }),
    [roleItems],
  )

  return (
    <div className={styles.home}>
      <section className={styles.hero}>
        <div className={styles.heroHead}>
          <Typography.Title level={3} className={styles.heroTitle}>
            {appConfig.app.name || homeConfig.intro.title}
          </Typography.Title>
          <Tag color="processing" bordered={false}>
            {homeConfig.intro.version}
          </Tag>
        </div>
        <Typography.Paragraph type="secondary" className={styles.heroDesc}>
          {appConfig.app.intro || homeConfig.intro.description}
        </Typography.Paragraph>
      </section>

      {stats ? (
        <>
          <Row gutter={[14, 14]} className={styles.statRow}>
            {STAT_META.map((item) => {
              const Icon = item.icon
              const value = stats[item.key as StatKey]
              return (
                <Col key={item.key} xs={12} sm={8} lg={4}>
                  <div className={`${styles.statCard} ${styles[`tone_${item.tone}`]}`}>
                    <div className={styles.statIcon}>
                      <Icon />
                    </div>
                    <Statistic title={item.title} value={value} />
                  </div>
                </Col>
              )
            })}
          </Row>

          <Row gutter={[14, 14]} className={styles.chartRow}>
            <Col xs={24} lg={14}>
              <Card size="small" title="注册趋势" className={styles.panel}>
                <Line {...trendConfig} />
              </Card>
            </Col>
            <Col xs={24} lg={10}>
              <Card size="small" title="角色分布" className={styles.panel}>
                <div className={styles.pieBlock}>
                  <Pie {...roleConfig} />
                  <ul className={styles.pieLegend}>
                    {roleItems.map((item) => (
                      <li key={item.name} className={styles.pieLegendItem}>
                        <span className={styles.pieDot} style={{ background: item.color }} />
                        <span className={styles.pieLegendText}>
                          {item.name}
                          <em>
                            {item.value}（{item.pct}%）
                          </em>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            </Col>
          </Row>
        </>
      ) : null}

      <section className={styles.features}>
        <div className={styles.sectionLabel}>能力亮点</div>
        <div className={styles.featureGrid}>
          {homeConfig.intro.features.map((f) => (
            <div key={f.title} className={styles.featureChip}>
              <div className={styles.featureIcon}>
                <XnAppIcon name={f.icon} size={18} />
              </div>
              <div className={styles.featureBody}>
                <div className={styles.featureTitle}>{f.title}</div>
                <div className={styles.featureDesc}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
