import { useEffect, useMemo, useState } from 'react'
import { Card, Col, Row, Statistic, Typography } from 'antd'
import ReactECharts from 'echarts-for-react'
import { appConfig } from '@/config/app'
import { homeConfig } from '@/config/home'
import { getDashboardStats } from '@/api/dashboard'
import type { DashboardStats } from '@/types'

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)

  useEffect(() => {
    void getDashboardStats()
      .then((res) => setStats(res.data || null))
      .catch(() => setStats(null))
  }, [])

  const trendOption = useMemo(() => {
    const points = stats?.registerTrend || []
    return {
      tooltip: { trigger: 'axis' },
      grid: { left: 40, right: 16, top: 24, bottom: 32 },
      xAxis: {
        type: 'category',
        data: points.map((p) => p.date),
        axisLabel: { fontSize: 11 },
      },
      yAxis: { type: 'value', minInterval: 1 },
      series: [
        {
          name: '新增用户',
          type: 'line',
          smooth: true,
          areaStyle: { opacity: 0.12 },
          data: points.map((p) => p.count),
        },
      ],
    }
  }, [stats])

  const roleOption = useMemo(() => {
    const items = stats?.roleDistribution || []
    return {
      tooltip: { trigger: 'item' },
      legend: { bottom: 0, type: 'scroll' },
      series: [
        {
          type: 'pie',
          radius: ['36%', '62%'],
          data: items.map((i) => ({ name: i.name, value: i.value })),
          label: { formatter: '{b}: {c}' },
        },
      ],
    }
  }, [stats])

  return (
    <div className="page-card">
      <div className="page-header">
        <h2 className="page-title">首页</h2>
      </div>
      <Typography.Title level={4} style={{ marginTop: 0 }}>
        {appConfig.app.name}
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        {appConfig.app.intro || homeConfig.intro.description}
      </Typography.Paragraph>

      {stats ? (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={12} sm={8} lg={4}>
              <Card size="small">
                <Statistic title="用户总数" value={stats.totalUsers} />
              </Card>
            </Col>
            <Col xs={12} sm={8} lg={4}>
              <Card size="small">
                <Statistic title="活跃用户" value={stats.activeUsers} />
              </Card>
            </Col>
            <Col xs={12} sm={8} lg={4}>
              <Card size="small">
                <Statistic title="今日新增" value={stats.todayNewUsers} />
              </Card>
            </Col>
            <Col xs={12} sm={8} lg={4}>
              <Card size="small">
                <Statistic title="角色数" value={stats.totalRoles} />
              </Card>
            </Col>
            <Col xs={12} sm={8} lg={4}>
              <Card size="small">
                <Statistic title="单位数" value={stats.totalUnits} />
              </Card>
            </Col>
            <Col xs={12} sm={8} lg={4}>
              <Card size="small">
                <Statistic title="已发公告" value={stats.publishedNotices} />
              </Card>
            </Col>
          </Row>
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} lg={14}>
              <Card size="small" title="注册趋势">
                <ReactECharts option={trendOption} style={{ height: 260 }} />
              </Card>
            </Col>
            <Col xs={24} lg={10}>
              <Card size="small" title="角色分布">
                <ReactECharts option={roleOption} style={{ height: 260 }} />
              </Card>
            </Col>
          </Row>
        </>
      ) : null}

      <Row gutter={[16, 16]}>
        {homeConfig.intro.features.map((f) => (
          <Col key={f.title} xs={24} sm={12} lg={8}>
            <Card size="small" title={f.title}>
              {f.desc}
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  )
}
