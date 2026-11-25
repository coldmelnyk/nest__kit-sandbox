import { withUtcSession } from '../../../src/shared/db/session-options.ts';

const BASE = 'postgresql://user:e2e-secret-not-a-real-key@localhost:5432/db';

const optionsOf = (url: string): string | null =>
  new URL(url).searchParams.get('options');

describe('withUtcSession', () => {
  it('adds the UTC timezone when the address has no options', () => {
    expect(optionsOf(withUtcSession(BASE))).toBe('-c timezone=UTC');
  });

  it('keeps own options and puts the timezone last', () => {
    const url = `${BASE}?options=${encodeURIComponent('-c timezone=Europe/Kyiv -c statement_timeout=100')}&sslmode=disable`;
    const result = new URL(withUtcSession(url));
    expect(result.searchParams.get('options')).toBe(
      '-c timezone=Europe/Kyiv -c statement_timeout=100 -c timezone=UTC',
    );
    expect(result.searchParams.get('sslmode')).toBe('disable');
  });
});
