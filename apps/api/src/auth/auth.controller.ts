import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { AuthService } from './auth.service.js';
import { CurrentUser, type AuthUser } from './current-user.decorator.js';
import {
  AuthConfigDto,
  GoogleSignInDto,
  MeDto,
  RequestLoginCodeDto,
  VerifyLoginCodeDto,
} from './dto/auth.dto.js';
import { Public } from './public.decorator.js';
import { SESSION_COOKIE, sessionCookieOptions } from './session-cookie.js';
import { SessionsService } from './sessions.service.js';

const toMe = (user: AuthUser): MeDto => ({
  id: user.id,
  email: user.email,
  name: user.name,
});

@Public()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly sessions: SessionsService,
  ) {}

  /** Which sign-in methods are available. */
  @Get('config')
  config(): AuthConfigDto {
    return { googleClientId: this.auth.googleClientIdOrNull };
  }

  /** Emails a 6-digit code. Signing in and signing up are the same flow. A 429 means too many codes were requested. */
  @Post('email-code')
  @HttpCode(204)
  async requestCode(@Body() body: RequestLoginCodeDto): Promise<void> {
    await this.auth.requestCode(body.email);
  }

  /** Checks the code and starts a session (cookie). Creates the account on first sign-in. */
  @Post('email-code/verify')
  @HttpCode(200)
  async verifyCode(
    @Body() body: VerifyLoginCodeDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<MeDto> {
    const user = await this.auth.verifyCode(body.email, body.code);
    await this.startSession(reply, user.id);
    return toMe(user);
  }

  /** Signs in with the credential from "Sign in with Google" and starts a session (cookie). */
  @Post('google')
  @HttpCode(200)
  async google(
    @Body() body: GoogleSignInDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<MeDto> {
    const user = await this.auth.signInWithGoogle(body.credential);
    await this.startSession(reply, user.id);
    return toMe(user);
  }

  /** Ends the current session. */
  @Post('logout')
  @HttpCode(204)
  async logout(
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<void> {
    const token = request.cookies[SESSION_COOKIE];
    if (token) await this.sessions.delete(token);
    reply.clearCookie(SESSION_COOKIE, { path: '/' });
  }

  private async startSession(reply: FastifyReply, userId: string) {
    const token = await this.sessions.create(userId);
    reply.setCookie(SESSION_COOKIE, token, sessionCookieOptions());
  }
}

@Controller('me')
export class MeController {
  /** The signed-in merchant. 401 without a session. */
  @Get()
  get(@CurrentUser() user: AuthUser): MeDto {
    return toMe(user);
  }
}
