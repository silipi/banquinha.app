import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { loadEnv } from '../env.js';
import { AuthController, MeController } from './auth.controller.js';
import { AuthGuard } from './auth.guard.js';
import { AuthService } from './auth.service.js';
import {
  EmailSender,
  LogEmailSender,
  ResendEmailSender,
} from './email-sender.js';
import { SessionsService } from './sessions.service.js';

@Module({
  controllers: [AuthController, MeController],
  providers: [
    AuthService,
    SessionsService,
    { provide: APP_GUARD, useClass: AuthGuard },
    {
      provide: EmailSender,
      useFactory: () => {
        const env = loadEnv();
        return env.RESEND_API_KEY
          ? new ResendEmailSender(env.RESEND_API_KEY, env.EMAIL_FROM)
          : new LogEmailSender();
      },
    },
  ],
})
export class AuthModule {}
