import { Result } from 'antd'

/** 页面迁移中占位，动态路由注册用 */
export default function PagePlaceholder() {
  return (
    <div className="page-card">
      <Result
        status="info"
        title="页面迁移中"
        subTitle="该页面正在从 Vue 基准迁移到 React + Ant Design，请暂时使用基准前端完成完整操作。"
      />
    </div>
  )
}
