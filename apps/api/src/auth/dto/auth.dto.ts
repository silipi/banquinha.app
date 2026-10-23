import { Transform } from 'class-transformer';
import { IsEmail, IsString, Matches, MaxLength } from 'class-validator';

const normalizeEmail = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class RequestLoginCodeDto {
  @Transform(normalizeEmail)
  @IsEmail({}, { message: 'Confira o e-mail: parece que falta alguma coisa' })
  @MaxLength(254)
  email: string;
}

export class VerifyLoginCodeDto extends RequestLoginCodeDto {
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
}

export class AuthConfigDto {
  /** Present when "Sign in with Google" is enabled. */
  googleClientId: string | null;
}
