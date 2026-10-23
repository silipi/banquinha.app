import { hashPassword, verifyPassword } from './password.js';

describe('password hashing', () => {
  it('verifies the right password and rejects others', async () => {
    const stored = await hashPassword('minha-senha-123');
    expect(stored).toMatch(/^scrypt\$32768\$8\$1\$/);
    expect(await verifyPassword('minha-senha-123', stored)).toBe(true);
    expect(await verifyPassword('minha-senha-124', stored)).toBe(false);
  });

  it('salts each hash', async () => {
    expect(await hashPassword('igual')).not.toBe(await hashPassword('igual'));
  });

  it('rejects a malformed stored value', async () => {
    expect(await verifyPassword('x', 'not-a-hash')).toBe(false);
  });
});
