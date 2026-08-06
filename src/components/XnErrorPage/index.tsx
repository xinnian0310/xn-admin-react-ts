import { Button, Result } from 'antd'
import { useNavigate } from 'react-router-dom'

interface XnErrorPageProps {
  status?: 403 | 404 | 500 | 503
  title?: string
  subTitle?: string
}

const PRESETS: Record<
  number,
  { status: 403 | 404 | 500; title: string; subTitle: string }
> = {
  403: {
    status: 403,
    title: '403',
    subTitle: '抱歉，您没有权限访问该页面',
  },
  404: {
    status: 404,
    title: '404',
    subTitle: '抱歉，您访问的页面不存在',
  },
  503: {
    status: 500,
    title: '503',
    subTitle: '服务暂时不可用，菜单加载失败，请稍后重试',
  },
}

export default function XnErrorPage({ status = 404, title, subTitle }: XnErrorPageProps) {
  const navigate = useNavigate()
  const preset = PRESETS[status] || PRESETS[404]

  return (
    <div style={{ padding: 48 }}>
      <Result
        status={preset.status}
        title={title || preset.title}
        subTitle={subTitle || preset.subTitle}
        extra={
          <Button type="primary" onClick={() => navigate('/dashboard')}>
            返回首页
          </Button>
        }
      />
    </div>
  )
}
