import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'ErrorResponse' })
export class ErrorResponse {
  @ApiProperty({ example: 'VALIDATION_FAILED' })
  code: string;

  @ApiProperty({ example: 'Request validation failed' })
  message: string;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    example: { fields: [{ path: 'title', rules: ['isString'] }] },
  })
  details?: Record<string, unknown>;

  @ApiProperty({ example: '0193a4b2-5c6d-7e8f-9a0b-1c2d3e4f5a6b' })
  requestId: string;
}
