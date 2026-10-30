import {
  base32Decode,
  base32Encode,
  generateTotpSecret,
  matchTotp,
  totpCode,
  totpStep,
} from './totp.js';

// RFC 6238 appendix B: the SHA-1 secret is the ASCII string "12345678901234567890".
const RFC_SECRET = base32Encode(Buffer.from('12345678901234567890'));

describe('TOTP', () => {
  it('matches the RFC 6238 test vectors (last 6 digits)', () => {
    expect(totpCode(RFC_SECRET, totpStep(59_000))).toBe('287082');
    expect(totpCode(RFC_SECRET, totpStep(1_111_111_109_000))).toBe('081804');
    expect(totpCode(RFC_SECRET, totpStep(1_234_567_890_000))).toBe('005924');
    expect(totpCode(RFC_SECRET, totpStep(20_000_000_000_000))).toBe('353130');
  });

  it('round-trips base32', () => {
    const bytes = Buffer.from([0, 1, 2, 250, 251, 252, 253]);
    expect(base32Decode(base32Encode(bytes))).toEqual(bytes);
  });

  it('generates 160-bit secrets', () => {
    const secret = generateTotpSecret();
    expect(secret).toMatch(/^[A-Z2-7]{32}$/);
    expect(base32Decode(secret)).toHaveLength(20);
  });

  it('accepts one step of drift and nothing beyond', () => {
    const secret = generateTotpSecret();
    const now = 1_800_000_000_000;
    const step = totpStep(now);
    expect(matchTotp(secret, totpCode(secret, step), now)).toBe(step);
    expect(matchTotp(secret, totpCode(secret, step - 1), now)).toBe(step - 1);
    expect(matchTotp(secret, totpCode(secret, step + 1), now)).toBe(step + 1);
    expect(matchTotp(secret, totpCode(secret, step - 2), now)).toBeNull();
    expect(matchTotp(secret, '12345', now)).toBeNull();
    expect(matchTotp(secret, 'abcdef', now)).toBeNull();
  });
});
