import { redact } from '../../../src/shared/logging/redact.ts';

const nest = (
  depth: number,
  leaf: Record<string, unknown>,
): Record<string, unknown> =>
  depth === 1 ? leaf : { level: nest(depth - 1, leaf) };

describe('redact', () => {
  it('masks fields with secret names and keeps the rest', () => {
    expect(
      redact({
        password: 'p',
        clientSecret: 's',
        salt: 'x',
        api_key: 'k',
        Authorization: 'a',
        cookieHeader: 'c',
        refreshToken: 't',
        invoiceId: 'id-1',
        tokenCount: 3,
      }),
    ).toEqual({
      password: '[redacted]',
      clientSecret: '[redacted]',
      salt: '[redacted]',
      api_key: '[redacted]',
      Authorization: '[redacted]',
      cookieHeader: '[redacted]',
      refreshToken: '[redacted]',
      invoiceId: 'id-1',
      tokenCount: 3,
    });
  });

  it('masks inside nested objects and arrays down to the eighth level', () => {
    const input = nest(8, { password: 'deep', id: 'kept' });
    expect(redact(input)).toEqual(
      nest(8, { password: '[redacted]', id: 'kept' }),
    );
    expect(redact({ items: [{ secret: 's' }] })).toEqual({
      items: [{ secret: '[redacted]' }],
    });
  });

  it('does not change the input', () => {
    const input = { nested: { password: 'p' } };
    redact(input);
    expect(input).toEqual({ nested: { password: 'p' } });
  });
});
