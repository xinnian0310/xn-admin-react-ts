import { useEffect, useMemo, useState } from 'react'
import { Card, Col, Empty, Image, Row, Statistic, Tag, Timeline, Typography, message } from 'antd'
import { Line, Pie } from '@ant-design/plots'
import {
  TeamOutlined,
  UserSwitchOutlined,
  UserAddOutlined,
  SafetyCertificateOutlined,
  BankOutlined,
  NotificationOutlined,
  PhoneOutlined,
  CoffeeOutlined,
  DesktopOutlined,
  CloudServerOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import { appConfig } from '@/config/app'
import { changelogTypeMeta, homeConfig } from '@/config/home'
import { getDashboardStats } from '@/api/dashboard'
import { getPublicSiteContact } from '@/api/site-contact'
import { resolveContactType, type SiteContactItem } from '@/types/site-contact'
import XnAppIcon from '@/components/XnAppIcon'
import type { DashboardStats } from '@/types'
import { gitChangelog } from 'virtual:git-changelog'
import styles from './dashboard.module.scss'

const STAT_META = [
  { key: 'totalUsers', title: '用户总数', icon: TeamOutlined, tone: 'blue' },
  { key: 'activeUsers', title: '活跃用户', icon: UserSwitchOutlined, tone: 'cyan' },
  { key: 'todayNewUsers', title: '今日新增', icon: UserAddOutlined, tone: 'green' },
  { key: 'totalRoles', title: '角色数', icon: SafetyCertificateOutlined, tone: 'purple' },
  { key: 'totalUnits', title: '单位数', icon: BankOutlined, tone: 'orange' },
  { key: 'publishedNotices', title: '已发公告', icon: NotificationOutlined, tone: 'magenta' },
] as const

const PIE_COLORS = [
  '#1677ff',
  '#13c2c2',
  '#52c41a',
  '#722ed1',
  '#fa8c16',
  '#eb2f96',
  '#2f54eb',
  '#a0d911',
]

type StatKey = (typeof STAT_META)[number]['key']

/** 坐标轴日期：YYYY-MM-DD → MM-DD，减少拥挤 */
function formatAxisDate(value: unknown) {
  const raw = String(value ?? '')
  const m = raw.match(/(?:\d{4}-)?(\d{2})-(\d{2})/)
  return m ? `${m[1]}-${m[2]}` : raw
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [contacts, setContacts] = useState<SiteContactItem[]>(() =>
    homeConfig.contacts.map((c) => ({ ...c, groups: c.groups?.map((g) => ({ ...g })) })),
  )
  /** 捐赠二维码固定用本地配置，不接受接口下发 */
  const donation = homeConfig.donation

  useEffect(() => {
    void getDashboardStats()
      .then((res) => setStats(res.data || null))
      .catch(() => setStats(null))
  }, [])

  useEffect(() => {
    void getPublicSiteContact()
      .then((res) => {
        const data = res.data
        if (data?.contacts?.length) {
          setContacts(data.contacts)
        }
      })
      .catch(() => {
        // 后端未就绪时沿用本地默认配置
      })
  }, [])

  async function copyQq(value: string, full?: boolean) {
    if (full || !value) return
    try {
      await navigator.clipboard.writeText(value)
      message.success(`已复制群号 ${value}`)
    } catch {
      message.error('复制失败，请手动选择')
    }
  }

  const visibleQrcodes = donation.qrcodes.filter((q) => q.src)
  const singleQrcode = visibleQrcodes.length === 1

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
          <Tag color="processing" variant="filled">
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

      <Row gutter={[14, 14]} className={styles.techRow}>
        <Col xs={24} lg={12}>
          <Card
            size="small"
            className={`${styles.panel} ${styles.techCard}`}
            title={
              <span className={styles.cardTitle}>
                <DesktopOutlined />
                前端技术选型
                <span className={styles.techCount}>{homeConfig.frontendTech.length}</span>
              </span>
            }
          >
            <div className={styles.techScroll}>
              {homeConfig.frontendTech.map((t) => (
                <div key={t.name} className={styles.techRowItem}>
                  <div className={styles.techMain}>
                    <span className={styles.techName}>{t.name}</span>
                    <span className={styles.techSep}>·</span>
                    <span className={styles.techDesc}>{t.desc}</span>
                  </div>
                  <Tag color="processing">{t.version}</Tag>
                </div>
              ))}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            size="small"
            className={`${styles.panel} ${styles.techCard}`}
            title={
              <span className={styles.cardTitle}>
                <CloudServerOutlined />
                后端技术选型
                <span className={styles.techCount}>{homeConfig.backendTech.length}</span>
              </span>
            }
          >
            <div className={styles.techScroll}>
              {homeConfig.backendTech.map((t) => (
                <div key={t.name} className={styles.techRowItem}>
                  <div className={styles.techMain}>
                    <span className={styles.techName}>{t.name}</span>
                    <span className={styles.techSep}>·</span>
                    <span className={styles.techDesc}>{t.desc}</span>
                  </div>
                  <Tag color="success">{t.version}</Tag>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[14, 14]} className={styles.bottomRow}>
        <Col xs={24} lg={14}>
          <Card
            size="small"
            className={`${styles.panel} ${styles.logCard}`}
            title={
              <span className={styles.cardTitle}>
                <ClockCircleOutlined />
                更新日志
                <Tag color="processing">{homeConfig.intro.version}</Tag>
                <Tag>当前</Tag>
                <span className={styles.logSource}>同步自 Git</span>
              </span>
            }
          >
            {gitChangelog.length ? (
              <Timeline
                className={styles.timeline}
                items={gitChangelog.map((item, idx) => ({
                  color: idx === 0 ? 'blue' : 'gray',
                  children: (
                    <div className={styles.logLine}>
                      <Tag
                        color={
                          ({ success: 'success', warning: 'warning', info: 'default' } as const)[
                            changelogTypeMeta[item.type].tag
                          ]
                        }
                      >
                        {changelogTypeMeta[item.type].label}
                      </Tag>
                      <span className={styles.logText}>{item.text}</span>
                      <span className={styles.logMeta}>
                        {item.date} · {item.hash}
                      </span>
                    </div>
                  ),
                }))}
              />
            ) : (
              <Empty description="暂无可用的 Git 提交记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <div className={styles.asideStack}>
            <Card
              size="small"
              className={styles.panel}
              title={
                <span className={styles.cardTitle}>
                  <PhoneOutlined />
                  联系信息
                </span>
              }
            >
              <div className={styles.contactList}>
                {contacts.map((c, ci) => (
                  <div key={`${c.label}-${ci}`} className={styles.contactItem}>
                    {c.icon ? (
                      <span className={styles.contactIcon}>
                        <XnAppIcon name={c.icon} size={16} />
                      </span>
                    ) : null}
                    <span className={styles.contactLabel}>{c.label}</span>
                    {resolveContactType(c) === 'qq' && c.groups?.length ? (
                      <div className={styles.contactGroups}>
                        {c.groups.map((g, gi) => (
                          <button
                            key={`${g.value}-${gi}`}
                            type="button"
                            className={`${styles.qqChip}${g.full ? ` ${styles.qqChipFull}` : ''}`}
                            title={g.full ? '群已满' : '点击复制群号'}
                            disabled={!!g.full}
                            onClick={() => void copyQq(g.value, g.full)}
                          >
                            <XnAppIcon name="ri:qq-fill" size={14} className={styles.qqIcon} />
                            <span className={styles.qqNum}>{g.value}</span>
                            {g.full ? <span className={styles.qqBadge}>已满</span> : null}
                          </button>
                        ))}
                      </div>
                    ) : c.link ? (
                      <a
                        href={c.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${styles.contactValue} ${styles.contactLink}`}
                      >
                        {c.value}
                      </a>
                    ) : (
                      <span className={styles.contactValue}>{c.value}</span>
                    )}
                  </div>
                ))}
              </div>
            </Card>
            <Card
              size="small"
              className={styles.panel}
              title={
                <span className={styles.cardTitle}>
                  <CoffeeOutlined />
                  捐赠情况
                </span>
              }
            >
              {donation.tip ? <p className={styles.donationTip}>{donation.tip}</p> : null}
              <div
                className={
                  singleQrcode
                    ? `${styles.donationBody} ${styles.donationBodySingle}`
                    : styles.donationBody
                }
              >
                {visibleQrcodes.length ? (
                  visibleQrcodes.map((qr) => (
                    <div key={`${qr.label}-${qr.src}`} className={styles.donationQr}>
                      <Image
                        src={qr.src}
                        alt={qr.label}
                        width={singleQrcode ? undefined : 140}
                        height={singleQrcode ? undefined : 190}
                        rootClassName={singleQrcode ? styles.donationQrWrap : undefined}
                        style={{ objectFit: 'contain', borderRadius: 10 }}
                        className={styles.donationQrImg}
                      />
                      {qr.label ? <span className={styles.donationQrLabel}>{qr.label}</span> : null}
                    </div>
                  ))
                ) : (
                  <Empty description="暂未配置捐赠二维码" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )}
              </div>
            </Card>
          </div>
        </Col>
      </Row>
    </div>
  )
}
