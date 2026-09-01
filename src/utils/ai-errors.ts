/** PRD §6.7：按错误码给出中文，避免把厂商英文原文甩给员工。 */
const TEXTS: Record<string, string> = {
  AI_QUOTA_MONTHLY_EXCEEDED: '本月试用额度已用完，请在「模型」中添加自己的模型继续使用',
  AI_QUOTA_DAILY_EXCEEDED: '今日试用额度已用完，请在「模型」中添加自己的模型继续使用',
  AI_CONCURRENCY_LIMIT: '当前已有对话在生成，请稍后再试',
  AI_TRIAL_DISABLED: '平台试用已停用，请在「模型」中添加自己的模型',
  AI_ENDPOINT_FORBIDDEN: '该地址不允许访问，请检查 Base URL',
  AI_UPSTREAM_AUTH: '密钥无效或已过期，请在「模型」中更新',
  AI_UPSTREAM_RATE_LIMIT: '模型服务繁忙，请稍后重试',
  AI_UPSTREAM_TIMEOUT: '模型响应超时，可点重新生成',
  AI_CONTENT_BLOCKED: '内容不合规，请调整后再试',
  AI_CONTEXT_TOO_LONG: '本次输入过长，请缩短或新建会话',
  AI_INPUT_TOO_LONG: '输入超出长度限制，请精简后再发送',
  AI_NO_MODEL_AVAILABLE: '暂无可用模型，请先在「模型」中添加',
  AI_MODEL_UNBOUND: '原模型已删除，请重新选择模型',
  AI_PROVIDER_UNAVAILABLE: '该模型已下架，请联系管理员或改用其他模型',
}

const VENDOR_ENGLISH = /^(error|invalid|unauthorized|rate limit|timeout|exceeded|forbidden)/i

export function aiErrorText(code?: string, fallback?: string) {
  if (code && TEXTS[code]) {
    return TEXTS[code]
  }
  const raw = (fallback || '').trim()
  if (raw && !VENDOR_ENGLISH.test(raw)) {
    return raw
  }
  return '模型服务异常，请稍后重试'
}
