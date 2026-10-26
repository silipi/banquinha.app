import { OmitType, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { trim, trimOrNull } from '../../stores/dto/store.dto.js';
import {
  FIELD_TYPES,
  MAX_LABEL_LENGTH,
  MAX_OPTION_LENGTH,
  MAX_OPTIONS,
  MAX_UNIT_LENGTH,
  type FieldType,
} from '../field-values.js';

export class CreateStoreFieldDto {
  /** What the field is called on the storefront ("Ano", "Km"). Unique within the store. */
  @Transform(trim)
  @IsString()
  @MinLength(1, { message: 'Dê um nome ao campo' })
  @MaxLength(MAX_LABEL_LENGTH, { message: 'Nome do campo muito longo' })
  label: string;

  /** Can't be changed later. */
  @IsIn(FIELD_TYPES, { message: 'Escolha o tipo do campo' })
  type: FieldType;

  /** Number fields only ("km", "m²"); ignored for the others. */
  @IsOptional()
  @Transform(trimOrNull)
  @IsString()
  @MaxLength(MAX_UNIT_LENGTH, { message: 'Unidade muito longa' })
  unit?: string | null;

  /** Choice fields only, at least two; ignored for the others. */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_OPTIONS, { message: `Até ${MAX_OPTIONS} opções` })
  @IsString({ each: true })
  @MaxLength(MAX_OPTION_LENGTH, { each: true, message: 'Opção muito longa' })
  options?: string[] | null;

  /** Show the value on the storefront card. False by default. */
  @IsOptional()
  @IsBoolean()
  showOnCard?: boolean;
}

/** Only the fields sent change. The type stays as created. */
export class UpdateStoreFieldDto extends PartialType(
  OmitType(CreateStoreFieldDto, ['type'] as const),
) {}

export class ReorderStoreFieldsDto {
  /** Every field of the store, in the new order. */
  @IsArray()
  @ArrayMaxSize(100)
  @IsUUID('all', { each: true })
  fieldIds: string[];
}

export class StoreFieldDto {
  id: string;
  label: string;
  type: FieldType;
  unit: string | null;
  options: string[] | null;
  showOnCard: boolean;
  /** Past the plan's limit (after a downgrade): kept, but not on items or the storefront. */
  hidden: boolean;
}

export class StoreFieldListDto {
  /** In display order. */
  fields: StoreFieldDto[];
  /** Limit of the owner's plan. */
  maxFields: number;
}
