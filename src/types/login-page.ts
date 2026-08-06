export type LoginCaptchaType = 'IMAGE' | 'SLIDER'

export interface LoginPageConfig {
  id: number
  name: string
  captchaEnabled: boolean
  captchaType?: LoginCaptchaType | null
  status: number
  remark?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface LoginPageConfigForm {
  name: string
  captchaEnabled: boolean
  captchaType?: LoginCaptchaType | ''
  status: number
  remark?: string
}
