import { Logger, ServiceUnavailableException } from '@nestjs/common';

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

/** Sends transactional email. Injected by class; AuthModule picks the implementation from env. */
export abstract class EmailSender {
  abstract send(message: EmailMessage): Promise<void>;
}

/** Sends through Resend's HTTP API (https://resend.com/docs/api-reference/emails/send-email). */
export class ResendEmailSender extends EmailSender {
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
  ) {
    super();
  }

  async send(message: EmailMessage): Promise<void> {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: this.from, ...message }),
    });
    if (!response.ok) {
      Logger.error(
        `Resend failed with ${response.status}: ${await response.text()}`,
        'ResendEmailSender',
      );
      throw new ServiceUnavailableException(
        'Não conseguimos enviar o e-mail agora. Tente de novo em instantes.',
      );
    }
  }
}

/**
 * Without an email provider: logs messages in development and keeps them in `outbox`
 * for tests. Refuses to send in production, where nobody would read the log.
 */
export class LogEmailSender extends EmailSender {
  readonly outbox: EmailMessage[] = [];

  async send(message: EmailMessage): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new ServiceUnavailableException(
        'Entrar por e-mail está indisponível no momento.',
      );
    }
    this.outbox.push(message);
    Logger.log(`To ${message.to}: ${message.subject}`, 'LogEmailSender');
  }
}
