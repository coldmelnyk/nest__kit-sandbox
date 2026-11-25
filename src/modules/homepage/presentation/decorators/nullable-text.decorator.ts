import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, ValidateIf } from 'class-validator';

// The field must be sent; null means "no content yet".
export const NullableText = (maxLength: number): PropertyDecorator =>
  applyDecorators(
    ApiProperty({ type: String, nullable: true, maxLength, example: null }),
    ValidateIf((_object: object, value: unknown) => value !== null),
    IsString(),
    MaxLength(maxLength),
  );
