import { Global, Injectable, Module } from '@nestjs/common';
import { v7 as uuidv7, validate, version } from 'uuid';

const UUID_V7 = 7;

export const isUuid = (value: string): boolean => validate(value);

export const isUuidV7 = (value: string): boolean =>
  validate(value) && version(value) === UUID_V7;

@Injectable()
export class Ids {
  next(): string {
    return uuidv7();
  }
}

@Global()
@Module({
  providers: [Ids],
  exports: [Ids],
})
export class IdsModule {}
