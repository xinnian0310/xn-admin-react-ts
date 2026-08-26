import axios from 'axios'
import request, { formatRequestError } from '@/utils/request'
import type { ApiResponse, LoginResult, User } from '@/types'
import { encryptPasswordWithPem } from '@/utils/password-crypto'

export interface CaptchaPayload {
  captchaId: string
  captchaType: 'IMAGE' | 'SLIDER'
  imageBase64?: string | null
}

export interface LoginPayload {
  username: string
  password: string
  captchaId?: string
  captchaCode?: string
}

export function getPasswordPublicKey() {
  return axios
    .get<ApiResponse<{ publicKey: string }>>('/api/auth/password-public-key', { timeout: 10000 })
    .then((res) => {
      const data = res.data
      if (data.code !== 200 || !data.data?.publicKey) {
        return Promise.reject(new Error(data.message || '获取密码公钥失败'))
      }
      return data
    })
    .catch((error) => {
      return Promise.reject(new Error(formatRequestError(error, '获取密码公钥失败')))
    })
}

async function encryptTransportPassword(plain: string) {
  const res = await getPasswordPublicKey()
  const pem = res.data?.publicKey
  if (!pem) {
    throw new Error('获取密码公钥失败')
  }
  return encryptPasswordWithPem(plain, pem)
}

export async function login(data: LoginPayload) {
  return request.post<any, ApiResponse<LoginResult>>('/auth/login', {
    ...data,
    password: await encryptTransportPassword(data.password),
  })
}

export type SmsScene = 'LOGIN' | 'BIND'

export function sendSms(data: { phone: string; scene: SmsScene }, silentError = true) {
  return request.post<any, ApiResponse<{ code?: string | null }>>('/auth/sms/send', data, {
    silentError,
  })
}

export function loginBySms(data: { phone: string; code: string }) {
  return request.post<any, ApiResponse<LoginResult>>('/auth/sms/login', data)
}

export function bindPhone(data: { phone: string; code: string }) {
  return request.post<any, ApiResponse<User>>('/auth/me/phone/bind', data)
}

export interface RegisterPayload {
  username: string
  password: string
  nickname?: string
  captchaId?: string
  captchaCode?: string
}

export async function register(data: RegisterPayload) {
  return request.post<any, ApiResponse<null>>('/auth/register', {
    ...data,
    password: await encryptTransportPassword(data.password),
  })
}

export function logout(token?: string) {
  return request.post<any, ApiResponse<null>>(
    '/auth/logout',
    null,
    token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
  )
}

export function fetchCaptcha() {
  return request.get<any, ApiResponse<CaptchaPayload | null>>('/auth/captcha')
}

export function verifySliderCaptcha(captchaId: string, percent: number) {
  return request.post<any, ApiResponse<null>>('/auth/captcha/slider', { captchaId, percent })
}

/** 滑动续期：换发新 JWT */
export function refreshToken() {
  return request.post<any, ApiResponse<LoginResult>>('/auth/refresh')
}

export function getCurrentUser() {
  return request.get<any, ApiResponse<User>>('/auth/me')
}

export interface ProfileUpdatePayload {
  nickname?: string
  email?: string
  phone?: string
  password?: string
  avatar?: string
}

export function updateCurrentUser(data: ProfileUpdatePayload) {
  return request.put<any, ApiResponse<User>>('/auth/me', data)
}

export function changePassword(data: { oldPassword: string; newPassword: string }) {
  return request.put<any, ApiResponse<null>>('/auth/me/password', data)
}

export interface PasswordRules {
  minLength: number
  maxLength: number
  requireUpper: boolean
  requireLower: boolean
  requireDigit: boolean
  requireSpecial: boolean
  expireDays: number
  forceChangeFirst: boolean
  historyCount: number
  tip: string
}

export function getPasswordRules() {
  return request.get<any, ApiResponse<PasswordRules>>('/auth/password-rules')
}

export function uploadAvatar(file: File) {
  const form = new FormData()
  form.append('file', file)
  return request.post<any, ApiResponse<User>>('/auth/me/avatar', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export function getAuthMenus() {
  return request.get<any, ApiResponse<import('@/types').SysRoute[]>>('/auth/menus')
}

export interface ApiRegistry {
  apis: { method: string; path: string }[]
  codes: string[]
}

export function getApiRegistry() {
  return request.get<any, ApiResponse<ApiRegistry>>('/auth/api-registry')
}
