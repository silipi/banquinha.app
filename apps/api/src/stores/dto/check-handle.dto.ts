import { IsString, MaxLength } from 'class-validator';

export class CheckHandleQueryDto {
  /** Desired address as free text. The API normalizes it before validating. */
  @IsString()
  @MaxLength(100)
  handle: string;
}

export class CheckHandleResponseDto {
  /** Normalized handle, as it would appear in the subdomain. */
  handle: string;
  available: boolean;
  /** User-facing reason (pt-BR) when the handle is not available. */
  message?: string;
}
