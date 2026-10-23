import type { EmailMessage } from './email-sender.js';

/** The code goes in the subject so it shows in the notification without opening the email. */
export function passwordResetEmail(to: string, code: string): EmailMessage {
  return {
    to,
    subject: `${code} é o seu código para criar uma nova senha`,
    text: [
      `Seu código para criar uma nova senha na banquinha.app: ${code}`,
      '',
      'Ele vale por 15 minutos. Se não foi você que pediu, pode ignorar este e-mail: sua senha continua a mesma.',
    ].join('\n'),
    html: `<div style="font-family:system-ui,sans-serif;font-size:16px;color:#1a1a1a">
<p>Seu código para criar uma nova senha na banquinha.app:</p>
<p style="font-size:32px;font-weight:700;letter-spacing:6px;margin:16px 0">${code}</p>
<p style="color:#666">Ele vale por 15 minutos. Se não foi você que pediu, pode ignorar este e-mail: sua senha continua a mesma.</p>
</div>`,
  };
}
