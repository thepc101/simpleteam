// Client-side security helpers. On localhost (a secure context) the Web Crypto
// SubtleCrypto API is available. Real enforcement happens server-side once the
// Supabase backend is wired in — this is the production-shaped client layer.

const enc = new TextEncoder()

function bytesToHex(b: Uint8Array): string {
  return Array.from(b)
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('')
}

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2)
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  return out
}

function base64url(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** PBKDF2-SHA256 password hashing (120k iterations). */
export async function hashPassword(
  password: string,
  saltHex?: string,
): Promise<{ hash: string; salt: string }> {
  const salt = saltHex ? hexToBytes(saltHex) : crypto.getRandomValues(new Uint8Array(16))
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(password) as BufferSource,
    { name: 'PBKDF2' },
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: 120_000, hash: 'SHA-256' },
    key,
    256,
  )
  return { hash: bytesToHex(new Uint8Array(bits)), salt: bytesToHex(salt) }
}

export async function verifyPassword(
  password: string,
  hash: string,
  salt: string,
): Promise<boolean> {
  const res = await hashPassword(password, salt)
  return timingSafeEqual(res.hash, hash)
}

/** Constant-time string compare to avoid timing leaks. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

/** A long, high-entropy invite code (256 bits). */
export function generateInviteCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return `stm_${base64url(bytes)}`
}

export function randomId(prefix: string): string {
  const r =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : base64url(crypto.getRandomValues(new Uint8Array(12)))
  return `${prefix}-${r}`
}

/** Keep digits only — wa.me requires a country-coded number with no symbols. */
export function sanitizePhone(input: string): string {
  return (input || '').replace(/\D/g, '')
}

export function isValidPhone(input: string): boolean {
  const d = sanitizePhone(input)
  return d.length >= 10 && d.length <= 15
}
