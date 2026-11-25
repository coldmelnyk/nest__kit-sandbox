import {
  Body,
  Controller,
  Get,
  HttpException,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { IsInt, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Public } from '../../../src/shared/http/public.ts';

export const PROBE_ERROR_STATUSES = { PROBE_REJECTED: 409 };

class ProbeError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ProbeError';
  }
}

class ProbeOwner {
  @IsString()
  email: string;
}

class ProbeRequest {
  @IsString()
  title: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @ValidateNested()
  @Type(() => ProbeOwner)
  owner: ProbeOwner;
}

@Public()
@Controller('probe')
export class ProbeController {
  @Get('items/:itemId')
  read(@Param('itemId') itemId: string): { itemId: string } {
    return { itemId };
  }

  @Get('rejected')
  rejected(): never {
    throw new ProbeError('PROBE_REJECTED', 'Probe rejected', {
      itemId: 'item-1',
    });
  }

  @Get('fault')
  fault(): never {
    throw new ProbeError(
      'PROBE_FAULT',
      'fault with e2e-secret-not-a-real-key inside',
    );
  }

  @Get('crash')
  crash(): never {
    throw new TypeError('crash with e2e-secret-not-a-real-key inside');
  }

  @Get('coded-http')
  codedHttp(): never {
    throw new HttpException(
      {
        code: 'PROBE_RATE_LIMITED',
        message: 'Too many probes',
        details: { retryAfterSeconds: 30 },
      },
      429,
    );
  }

  @Get('plain-http')
  plainHttp(): never {
    throw new NotFoundException();
  }

  @Post('items')
  create(@Body() body: ProbeRequest): { title: string } {
    return { title: body.title };
  }
}

@Controller('closed')
export class ClosedController {
  @Get()
  read(): { ok: boolean } {
    return { ok: true };
  }
}
