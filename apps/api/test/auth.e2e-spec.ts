import { randomUUID } from 'node:crypto';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createApp } from '../src/app.js';
import { EmailSender, LogEmailSender } from '../src/auth/email-sender.js';
import { SESSION_COOKIE } from '../src/auth/session-cookie.js';

describe('Auth', () => {
  let app: NestFastifyApplication;
  let outbox: LogEmailSender['outbox'];

  beforeAll(async () => {
    app = await createApp();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    outbox = app.get<LogEmailSender>(EmailSender).outbox;
  });

  afterAll(() => app.close());

  // The test database persists between runs, so each test gets its own address.
  const newEmail = () => `lojista+${randomUUID()}@exemplo.com`;

  const requestCode = (email: string) =>
    app.inject({ method: 'POST', url: '/auth/email-code', payload: { email } });

  const verifyCode = (email: string, code: string) =>
    app.inject({
      method: 'POST',
      url: '/auth/email-code/verify',
      payload: { email, code },
    });

  const lastCodeSentTo = (email: string) => {
    const message = outbox.findLast((sent) => sent.to === email);
    return message?.subject.match(/^\d{6}/)?.[0] ?? '';
  };

  const wrongCode = (code: string) =>
    ((Number(code) + 1) % 1_000_000).toString().padStart(6, '0');

  const me = (cookie?: string) =>
    app.inject({
      method: 'GET',
      url: '/me',
      cookies: cookie ? { [SESSION_COOKIE]: cookie } : {},
    });

  it('signs up with an emailed code, keeps the session and logs out', async () => {
    const email = newEmail();
    expect((await requestCode(email.toUpperCase())).statusCode).toBe(204);
    const code = lastCodeSentTo(email);
    expect(code).toMatch(/^\d{6}$/);

    const wrong = await verifyCode(email, wrongCode(code));
    expect(wrong.statusCode).toBe(400);
    expect(wrong.json().message).toContain('Código incorreto');

    const verified = await verifyCode(email, code);
    expect(verified.statusCode).toBe(200);
    expect(verified.json()).toMatchObject({ email });
    const session = verified.cookies.find((c) => c.name === SESSION_COOKIE);
    expect(session).toMatchObject({ httpOnly: true, sameSite: 'Lax' });

    const signedIn = await me(session!.value);
    expect(signedIn.statusCode).toBe(200);
    expect(signedIn.json()).toMatchObject({ email });

    const logout = await app.inject({
      method: 'POST',
      url: '/auth/logout',
      cookies: { [SESSION_COOKIE]: session!.value },
    });
    expect(logout.statusCode).toBe(204);
    expect((await me(session!.value)).statusCode).toBe(401);
  });

  it('signs an existing account back in instead of creating another', async () => {
    const email = newEmail();
    await requestCode(email);
    const first = await verifyCode(email, lastCodeSentTo(email));
    await requestCode(email);
    const second = await verifyCode(email, lastCodeSentTo(email));
    expect(second.json().id).toBe(first.json().id);
  });

  it('accepts an earlier code after a resend', async () => {
    const email = newEmail();
    await requestCode(email);
    const firstCode = lastCodeSentTo(email);
    await requestCode(email);
    expect((await verifyCode(email, firstCode)).statusCode).toBe(200);
  });

  it('protects routes by default', async () => {
    const res = await me();
    expect(res.statusCode).toBe(401);
    expect(res.json().message).toBe('Entre na sua conta para continuar.');
    expect((await me('not-a-real-session')).statusCode).toBe(401);
  });

  it('limits how many codes one email can request', async () => {
    const email = newEmail();
    for (let i = 0; i < 5; i++) {
      expect((await requestCode(email)).statusCode).toBe(204);
    }
    const blocked = await requestCode(email);
    expect(blocked.statusCode).toBe(429);
    expect(blocked.json().message).toContain('muitos códigos');
  });

  it('stops accepting codes after too many wrong guesses', async () => {
    const email = newEmail();
    await requestCode(email);
    const code = lastCodeSentTo(email);
    for (let i = 0; i < 5; i++) {
      await verifyCode(email, wrongCode(code));
    }
    const res = await verifyCode(email, code);
    expect(res.statusCode).toBe(400);
    expect(res.json().message).toContain('Muitas tentativas');
  });

  it('rejects a code that was never sent', async () => {
    const res = await verifyCode(newEmail(), '123456');
    expect(res.statusCode).toBe(400);
    expect(res.json().message).toContain('expirou');
  });

  it('validates the email with a pt-BR message', async () => {
    const res = await requestCode('ana@');
    expect(res.statusCode).toBe(400);
    expect(res.json().message).toEqual([
      'Confira o e-mail: parece que falta alguma coisa',
    ]);
  });

  it('keeps Google sign-in off without a client id', async () => {
    const config = await app.inject({ method: 'GET', url: '/auth/config' });
    expect(config.json()).toEqual({ googleClientId: null });
    const google = await app.inject({
      method: 'POST',
      url: '/auth/google',
      payload: { credential: 'x' },
    });
    expect(google.statusCode).toBe(404);
  });
});
