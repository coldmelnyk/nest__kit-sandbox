import {
  ConfigError,
  parseConfig,
} from '../../../src/shared/configs/config.schema.ts';

const VALID = {
  NODE_ENV: 'e2e',
  PORT: '3000',
  DATABASE_URL: 'postgresql://user:e2e-secret-not-a-real-key@localhost:5432/db',
  LOG_LEVEL: 'warn',
};

const failedVariables = (env: Record<string, string | undefined>): string[] => {
  try {
    parseConfig(env);
  } catch (error) {
    if (error instanceof ConfigError) {
      return error.variables;
    }
    throw error;
  }
  return [];
};

describe('parseConfig', () => {
  it('returns typed values', () => {
    expect(parseConfig(VALID)).toEqual({ ...VALID, PORT: 3000 });
  });

  it('defaults NODE_ENV to dev and LOG_LEVEL to info when unset or empty', () => {
    const config = parseConfig({
      ...VALID,
      NODE_ENV: '',
      LOG_LEVEL: undefined,
    });
    expect(config.NODE_ENV).toBe('dev');
    expect(config.LOG_LEVEL).toBe('info');
  });

  it('treats an empty PORT as missing instead of 0', () => {
    expect(failedVariables({ ...VALID, PORT: '' })).toEqual(['PORT']);
  });

  it('rejects a missing database address and a non-postgres one', () => {
    expect(failedVariables({ ...VALID, DATABASE_URL: undefined })).toEqual([
      'DATABASE_URL',
    ]);
    expect(
      failedVariables({ ...VALID, DATABASE_URL: 'mysql://localhost/db' }),
    ).toEqual(['DATABASE_URL']);
  });

  it('rejects unknown NODE_ENV and LOG_LEVEL', () => {
    expect(
      failedVariables({ ...VALID, NODE_ENV: 'staging', LOG_LEVEL: 'loud' }),
    ).toEqual(['NODE_ENV', 'LOG_LEVEL']);
  });

  it('does not put values into the error message', () => {
    expect(() =>
      parseConfig({ ...VALID, PORT: 'e2e-secret-not-a-real-key' }),
    ).toThrow('Invalid configuration: PORT');
  });
});
