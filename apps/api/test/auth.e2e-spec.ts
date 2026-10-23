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
  const PASSWORD = 'senha-boa-123';

  const signup = (overrides: Record<string, string> = {}) =>
    app.inject({
      method: 'POST',
      url: '/auth/signup',
      payload: {
        name: 'Maria das Flores',
        email: newEmail(),
        whatsapp: '(41) 99999-1234',
        password: PASSWORD,
        ...overrides,
      },
    });

  const login = (email: string, password: string) =>
    app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email, password },
    });

  const sessionOf = (res: { cookies: { name: string; value: string }[] }) =>
    res.cookies.find((c) => c.name === SESSION_COOKIE)?.value;

  const me = (session?: string) =>
    app.inject({
      method: 'GET',
      url: '/me',
      cookies: session ? { [SESSION_COOKIE]: session } : {},
    });

  const requestReset = (email: string) =>
    app.inject({
      method: 'POST',
      url: '/auth/password-reset',
      payload: { email },
    });

  const confirmReset = (email: string, code: string, password: string) =>
    app.inject({
      method: 'POST',
      url: '/auth/password-reset/confirm',
      payload: { email, code, password },
    });

  const lastCodeSentTo = (email: string) =>
    outbox
      .findLast((sent) => sent.to === email)
      ?.subject.match(/^\d{6}/)?.[0] ?? '';

  const wrongCode = (code: string) =>
    ((Number(code) + 1) % 1_000_000).toString().padStart(6, '0');

  it('signs up, keeps the session and logs out', async () => {
    const email = newEmail();
    const created = await signup({ email: email.toUpperCase() });
    expect(created.statusCode).toBe(201);
    expect(created.json()).toMatchObject({
      email,
      name: 'Maria das Flores',
      whatsapp: '5541999991234',
    });
    const session = sessionOf(created);
    expect(created.cookies[0]).toMatchObject({
      httpOnly: true,
      sameSite: 'Lax',
    });

    expect((await me(session)).json()).toMatchObject({ email });

    const logout = await app.inject({
      method: 'POST',
      url: '/auth/logout',
      cookies: { [SESSION_COOKIE]: session! },
    });
    expect(logout.statusCode).toBe(204);
    expect((await me(session)).statusCode).toBe(401);
  });

  it('logs in with email and password', async () => {
    const email = newEmail();
    const created = await signup({ email });

    const res = await login(` ${email.toUpperCase()} `, PASSWORD);
    expect(res.statusCode).toBe(200);
    expect(res.json().id).toBe(created.json().id);
    expect((await me(sessionOf(res))).statusCode).toBe(200);
  });

  it('gives the same answer for a wrong password and an unknown email', async () => {
    const email = newEmail();
    await signup({ email });

    const wrongPassword = await login(email, 'outra-senha-123');
    const unknownEmail = await login(newEmail(), PASSWORD);
    expect(wrongPassword.statusCode).toBe(401);
    expect(unknownEmail.statusCode).toBe(401);
    expect(wrongPassword.json().message).toBe('E-mail ou senha incorretos.');
    expect(unknownEmail.json().message).toBe(wrongPassword.json().message);
  });

  it('blocks logins after too many wrong passwords', async () => {
    const email = newEmail();
    await signup({ email });
    for (let i = 0; i < 10; i++) await login(email, 'errada-errada');

    const res = await login(email, PASSWORD);
    expect(res.statusCode).toBe(429);
    expect(res.json().message).toContain('Muitas tentativas');
  });

  it('refuses a second account with the same email', async () => {
    const email = newEmail();
    await signup({ email });
    const res = await signup({ email });
    expect(res.statusCode).toBe(409);
    expect(res.json().message).toContain('Já existe uma conta');
  });

  it('validates the sign-up fields with pt-BR messages', async () => {
    const res = await signup({
      name: 'M',
      email: 'maria@',
      whatsapp: '3333-1234',
      password: 'curta',
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().message).toEqual(
      expect.arrayContaining([
        'Informe seu nome',
        'Confira o e-mail: parece que falta alguma coisa',
        'Confira o WhatsApp: use o DDD e o número do celular',
        'A senha precisa ter pelo menos 8 caracteres',
      ]),
    );
  });

  it('resets a forgotten password with an emailed code', async () => {
    const email = newEmail();
    const created = await signup({ email });
    const oldSession = sessionOf(created);

    expect((await requestReset(email)).statusCode).toBe(204);
    const code = lastCodeSentTo(email);
    expect(code).toMatch(/^\d{6}$/);

    const wrong = await confirmReset(email, wrongCode(code), 'nova-senha-456');
    expect(wrong.json().message).toContain('Código incorreto');

    const reset = await confirmReset(email, code, 'nova-senha-456');
    expect(reset.statusCode).toBe(200);
    expect((await me(sessionOf(reset))).statusCode).toBe(200);
    // Other devices are signed out.
    expect((await me(oldSession)).statusCode).toBe(401);

    expect((await login(email, PASSWORD)).statusCode).toBe(401);
    expect((await login(email, 'nova-senha-456')).statusCode).toBe(200);
    // The code works once.
    expect(
      (await confirmReset(email, code, 'outra-senha-789')).statusCode,
    ).toBe(400);
  });

  it('does not reveal whether an email has an account', async () => {
    const before = outbox.length;
    expect((await requestReset(newEmail())).statusCode).toBe(204);
    expect(outbox.length).toBe(before);
  });

  it('stops accepting reset codes after too many wrong guesses', async () => {
    const email = newEmail();
    await signup({ email });
    await requestReset(email);
    const code = lastCodeSentTo(email);
    for (let i = 0; i < 5; i++) {
      await confirmReset(email, wrongCode(code), 'nova-senha-456');
    }
    const res = await confirmReset(email, code, 'nova-senha-456');
    expect(res.statusCode).toBe(400);
    expect(res.json().message).toContain('Muitas tentativas');
  });

  it('limits how many reset codes one account can request', async () => {
    const email = newEmail();
    await signup({ email });
    for (let i = 0; i < 5; i++) {
      expect((await requestReset(email)).statusCode).toBe(204);
    }
    expect((await requestReset(email)).statusCode).toBe(429);
  });

  it('protects routes by default', async () => {
    const res = await me();
    expect(res.statusCode).toBe(401);
    expect(res.json().message).toBe('Entre na sua conta para continuar.');
    expect((await me('not-a-real-session')).statusCode).toBe(401);
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
