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
  LoginDto,
  MeDto,
  RequestPasswordResetDto,
  ResetPasswordDto,
  SignupDto,
} from './dto/auth.dto.js';
import { Public } from './public.decorator.js';
import { SESSION_COOKIE, sessionCookieOptions } from './session-cookie.js';
import { SessionsService } from './sessions.service.js';

const toMe = (user: AuthUser): MeDto => ({
  id: user.id,
  email: user.email,
  name: user.name,
  whatsapp: user.whatsapp,
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

  /** Creates the account and starts a session (cookie). A 409 means the email already has an account. */
  @Post('signup')
  @HttpCode(201)
  async signup(
    @Body() body: SignupDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<MeDto> {
    const user = await this.auth.signup(body);
    await this.startSession(reply, user.id);
    return toMe(user);
  }

  /** Signs in with email and password. 401 on wrong credentials, 429 after too many. */
  @Post('login')
  @HttpCode(200)
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<MeDto> {
    const user = await this.auth.login(body.email, body.password);
    await this.startSession(reply, user.id);
    return toMe(user);
  }

  /** Emails a code to set a new password. Always 204, whether or not the email has an account. */
  @Post('password-reset')
  @HttpCode(204)
  async requestPasswordReset(
    @Body() body: RequestPasswordResetDto,
  ): Promise<void> {
    await this.auth.requestPasswordReset(body.email);
  }

  /** Sets a new password with the emailed code, signs out other devices and starts a session. */
  @Post('password-reset/confirm')
  @HttpCode(200)
  async resetPassword(
    @Body() body: ResetPasswordDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<MeDto> {
    const user = await this.auth.resetPassword(
      body.email,
      body.code,
      body.password,
    );
    await this.startSession(reply, user.id);
    return toMe(user);
  }

  /** Signs in or up with the credential from "Sign in with Google" and starts a session (cookie). */
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
