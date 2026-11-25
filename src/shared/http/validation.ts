import { BadRequestException, ValidationPipe } from '@nestjs/common';
import type { ValidationError } from 'class-validator';

type FieldViolation = { path: string; rules: string[] };

const collectViolations = (
  errors: ValidationError[],
  parentPath: string | null,
): FieldViolation[] =>
  errors.flatMap((error) => {
    const path =
      parentPath === null ? error.property : `${parentPath}.${error.property}`;
    const own =
      error.constraints === undefined
        ? []
        : [{ path, rules: Object.keys(error.constraints) }];
    return [...own, ...collectViolations(error.children ?? [], path)];
  });

export const createValidationPipe = (): ValidationPipe =>
  new ValidationPipe({
    whitelist: true,
    forbidUnknownValues: true,
    transform: true,
    exceptionFactory: (errors) =>
      new BadRequestException({
        code: 'VALIDATION_FAILED',
        message: 'Request validation failed',
        details: { fields: collectViolations(errors, null) },
      }),
  });
