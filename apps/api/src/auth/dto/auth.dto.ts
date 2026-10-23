import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { toWhatsappNumber } from '../../common/whatsapp-number.js';
import type { PlanId } from '../../plans/plans.js';
import { StoreSummaryDto } from '../../stores/dto/store.dto.js';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '../password.js';

const normalizeEmail = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

class EmailDto {
  @Transform(normalizeEmail)
  @IsEmail({}, { message: 'Confira o e-mail: parece que falta alguma coisa' })
  @MaxLength(254)
  email: string;
}

class NewPasswordDto extends EmailDto {
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH, {
    message: `A senha precisa ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres`,
  })
  @MaxLength(PASSWORD_MAX_LENGTH, { message: 'Senha muito longa' })
  password: string;
}

export class SignupDto extends NewPasswordDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(2, { message: 'Informe seu nome' })
  @MaxLength(80, { message: 'Nome muito longo' })
  name: string;

  /** Any common format; stored as digits with the country code (5541999999999). */
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? (toWhatsappNumber(value) ?? value) : value,
  )
  @IsString()
  @Matches(/^55\d{11}$/, {
    message: 'Confira o WhatsApp: use o DDD e o número do celular',
  })
  whatsapp: string;
}

export class LoginDto extends EmailDto {
  @IsString()
  @MinLength(1, { message: 'Digite sua senha' })
  @MaxLength(PASSWORD_MAX_LENGTH)
  password: string;
}

export class RequestPasswordResetDto extends EmailDto {}

export class ResetPasswordDto extends NewPasswordDto {
  /** The 6 digits from the email. */
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.replace(/\D/g, '') : value,
  )
  @Matches(/^\d{6}$/, { message: 'O código tem 6 números' })
  code: string;
}

export class GoogleSignInDto {
  /** ID token returned by Google Identity Services. */
  @IsString()
  @MaxLength(4096)
  credential: string;
}

export class MeDto {
  id: string;
  email: string;
  name: string | null;
  /** Null when the account came from Google and has not given it yet. */
  whatsapp: string | null;
  plan: PlanDto;
  /** False until the first store is created; the panel shows the onboarding until then. */
  onboardingCompleted: boolean;
  /** Stores this account owns (one on the free plan). */
  stores: StoreSummaryDto[];
}

export class PlanDto {
  id: PlanId;
  name: string;
  maxStores: number;
  /** Products per store. */
  maxProducts: number;
}

export class AuthConfigDto {
  /** Present when "Sign in with Google" is enabled. */
  googleClientId: string | null;
}
