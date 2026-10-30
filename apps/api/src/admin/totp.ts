import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

// Time-based one-time passwords (RFC 6238, the 6-digit codes of authenticator apps).
// SHA-1, 30-second steps and 6 digits are what every authenticator app supports.
const STEP_SECONDS = 30;
const DIGITS = 6;
const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Encode(bytes: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += BASE32[(value << (5 - bits)) & 31];
  return output;
}

export function base32Decode(text: string): Buffer {
  let bits = 0;
  let value = 0;
  const output: number[] = [];
  for (const char of text.replace(/=+$/, '').toUpperCase()) {
    const index = BASE32.indexOf(char);
    if (index === -1) throw new Error('Invalid base32');
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(output);
}

/** A new 160-bit secret, base32 encoded (32 characters). */
export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

/** The 30-second step a moment falls in. */
export function totpStep(at = Date.now()): number {
  return Math.floor(at / 1000 / STEP_SECONDS);
}

export function totpCode(secret: string, step: number): string {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const hmac = createHmac('sha1', base32Decode(secret))
    .update(counter)
    .digest();
  const offset = hmac[hmac.length - 1]! & 15;
  const binary = hmac.readUInt32BE(offset) & 0x7fffffff;
  return (binary % 10 ** DIGITS).toString().padStart(DIGITS, '0');
}

/**
 * The step whose code matches, allowing one step of clock drift either way, or null.
 * Callers reject a step already used, so a code works only once.
 */
export function matchTotp(
  secret: string,
  code: string,
  at = Date.now(),
): number | null {
  if (!/^\d{6}$/.test(code)) return null;
  const current = totpStep(at);
  for (const step of [current - 1, current, current + 1]) {
    const expected = Buffer.from(totpCode(secret, step));
    if (timingSafeEqual(expected, Buffer.from(code))) return step;
  }
  return null;
}

/** URI an authenticator app reads (as a QR code or pasted) to add the account. */
export function totpUri(secret: string, label: string): string {
  const params = new URLSearchParams({
    secret,
    issuer: 'banquinha.app',
    algorithm: 'SHA1',
    digits: String(DIGITS),
    period: String(STEP_SECONDS),
  });
  return `otpauth://totp/${encodeURIComponent(`banquinha.app:${label}`)}?${params}`;
}
