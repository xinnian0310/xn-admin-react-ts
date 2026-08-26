function pemToSpki(pem: string): ArrayBuffer {
  const body = pem
    .replace(/-----BEGIN PUBLIC KEY-----/, '')
    .replace(/-----END PUBLIC KEY-----/, '')
    .replace(/\s+/g, '')
  const binary = atob(body)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/** RSA-OAEP SHA-256，密文 Base64。登录请求只传密文，避免 F12 看到明文。 */
export async function encryptPasswordWithPem(plain: string, pem: string): Promise<string> {
  if (!plain) {
    throw new Error('密码不能为空')
  }
  if (!pem) {
    throw new Error('密码公钥无效')
  }
  const key = await crypto.subtle.importKey(
    'spki',
    pemToSpki(pem),
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt'],
  )
  const cipher = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    key,
    new TextEncoder().encode(plain),
  )
  return bytesToBase64(new Uint8Array(cipher))
}
