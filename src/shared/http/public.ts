import {
  Global,
  Injectable,
  Module,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';

const IS_PUBLIC = 'kit:isPublic';

export const Public = (): MethodDecorator & ClassDecorator =>
  SetMetadata(IS_PUBLIC, true);

// Sessions do not exist yet, so every endpoint without @Public() is refused.
@Injectable()
export class AccessGuard implements CanActivate {
  constructor(private readonly _reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this._reflector.getAllAndOverride<boolean | undefined>(
      IS_PUBLIC,
      [context.getHandler(), context.getClass()],
    );
    if (isPublic === true) {
      return true;
    }
    throw new UnauthorizedException();
  }
}

@Global()
@Module({
  providers: [{ provide: APP_GUARD, useClass: AccessGuard }],
})
export class AccessModule {}
