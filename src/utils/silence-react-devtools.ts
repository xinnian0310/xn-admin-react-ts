/**
 * 开发态 React 会提示安装 DevTools。此补丁只拦截这一条，其它 console.info 照常输出。
 * 必须在导入 react / react-dom 之前执行。
 */
const HINT = 'Download the React DevTools'

const originalInfo = console.info.bind(console)
console.info = (...args: unknown[]) => {
  const first = args[0]
  if (typeof first === 'string' && first.includes(HINT)) return
  originalInfo(...args)
}
