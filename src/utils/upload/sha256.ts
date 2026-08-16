/**
 * 增量 SHA-256。
 *
 * 之所以自带实现：浏览器原生 `crypto.subtle.digest` 是一次性接口，不支持流式喂数据，
 * 无法在「分块读取 → 计算 → 释放内存」的前提下算出整文件摘要；且 `crypto.subtle`
 * 仅在安全上下文（https / localhost）可用，用 http 访问内网地址时为 undefined。
 *
 * 因此：分片摘要优先走原生（快），整文件全量摘要与非安全上下文兜底走这里。
 */

const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
])

const BLOCK_SIZE = 64

function rotr(value: number, shift: number): number {
  return (value >>> shift) | (value << (32 - shift))
}

export class Sha256 {
  private readonly state = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ])
  private readonly block = new Uint8Array(BLOCK_SIZE)
  private readonly w = new Uint32Array(64)
  private blockLength = 0
  private bytesHashed = 0
  private finished = false

  update(data: Uint8Array): void {
    if (this.finished) throw new Error('SHA-256 已完成计算，不能继续 update')
    this.bytesHashed += data.length
    let offset = 0

    if (this.blockLength > 0) {
      const take = Math.min(BLOCK_SIZE - this.blockLength, data.length)
      this.block.set(data.subarray(0, take), this.blockLength)
      this.blockLength += take
      offset = take
      if (this.blockLength === BLOCK_SIZE) {
        this.compress(this.block, 0)
        this.blockLength = 0
      }
    }

    while (data.length - offset >= BLOCK_SIZE) {
      this.compress(data, offset)
      offset += BLOCK_SIZE
    }

    if (offset < data.length) {
      this.block.set(data.subarray(offset), 0)
      this.blockLength = data.length - offset
    }
  }

  digest(): Uint8Array<ArrayBuffer> {
    if (this.finished) throw new Error('SHA-256 已完成计算，不能重复 digest')
    this.finished = true

    const bitLength = this.bytesHashed * 8
    const padded = new Uint8Array(this.blockLength < BLOCK_SIZE - 8 ? BLOCK_SIZE : BLOCK_SIZE * 2)
    padded.set(this.block.subarray(0, this.blockLength))
    padded[this.blockLength] = 0x80

    const view = new DataView(padded.buffer)
    view.setUint32(padded.length - 8, Math.floor(bitLength / 0x100000000))
    view.setUint32(padded.length - 4, bitLength % 0x100000000)

    for (let offset = 0; offset < padded.length; offset += BLOCK_SIZE) {
      this.compress(padded, offset)
    }

    const out = new Uint8Array(32)
    const outView = new DataView(out.buffer)
    for (let i = 0; i < 8; i++) {
      outView.setUint32(i * 4, this.state[i])
    }
    return out
  }

  private compress(block: Uint8Array, offset: number): void {
    const w = this.w
    for (let i = 0; i < 16; i++) {
      const p = offset + i * 4
      w[i] = (block[p] << 24) | (block[p + 1] << 16) | (block[p + 2] << 8) | block[p + 3]
    }
    for (let i = 16; i < 64; i++) {
      const x = w[i - 15]
      const y = w[i - 2]
      const s0 = rotr(x, 7) ^ rotr(x, 18) ^ (x >>> 3)
      const s1 = rotr(y, 17) ^ rotr(y, 19) ^ (y >>> 10)
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0
    }

    let a = this.state[0]
    let b = this.state[1]
    let c = this.state[2]
    let d = this.state[3]
    let e = this.state[4]
    let f = this.state[5]
    let g = this.state[6]
    let h = this.state[7]

    for (let i = 0; i < 64; i++) {
      const s1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)
      const ch = (e & f) ^ (~e & g)
      const t1 = (h + s1 + ch + K[i] + w[i]) | 0
      const s0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)
      const maj = (a & b) ^ (a & c) ^ (b & c)
      const t2 = (s0 + maj) | 0

      h = g
      g = f
      f = e
      e = (d + t1) | 0
      d = c
      c = b
      b = a
      a = (t1 + t2) | 0
    }

    this.state[0] = (this.state[0] + a) | 0
    this.state[1] = (this.state[1] + b) | 0
    this.state[2] = (this.state[2] + c) | 0
    this.state[3] = (this.state[3] + d) | 0
    this.state[4] = (this.state[4] + e) | 0
    this.state[5] = (this.state[5] + f) | 0
    this.state[6] = (this.state[6] + g) | 0
    this.state[7] = (this.state[7] + h) | 0
  }
}

export function bytesToHex(bytes: Uint8Array): string {
  let hex = ''
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0')
  }
  return hex
}

export function sha256Sync(data: Uint8Array): Uint8Array<ArrayBuffer> {
  const hash = new Sha256()
  hash.update(data)
  return hash.digest()
}
