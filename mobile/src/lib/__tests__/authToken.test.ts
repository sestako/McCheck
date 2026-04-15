import { extractAuthTokenFromBody, parseApiErrorBody } from '../authToken';

describe('extractAuthTokenFromBody', () => {
  it('reads token at root', () => {
    expect(extractAuthTokenFromBody({ token: 'abc' })).toBe('abc');
  });

  it('reads access_token', () => {
    expect(extractAuthTokenFromBody({ access_token: 'def' })).toBe('def');
  });

  it('reads data.token', () => {
    expect(extractAuthTokenFromBody({ data: { token: 'ghi' } })).toBe('ghi');
  });

  it('reads plainTextToken', () => {
    expect(extractAuthTokenFromBody({ plainTextToken: 'jkl' })).toBe('jkl');
  });

  it('returns null when missing', () => {
    expect(extractAuthTokenFromBody({})).toBeNull();
  });
});

describe('parseApiErrorBody', () => {
  it('uses message', () => {
    expect(parseApiErrorBody({ message: 'Nope' }, 'fallback')).toBe('Nope');
  });

  it('uses first validation error', () => {
    expect(parseApiErrorBody({ errors: { email: ['Invalid'] } }, 'fallback')).toBe('Invalid');
  });

  it('uses data.errors (MoveConcept INVALID_CONTENT)', () => {
    expect(
      parseApiErrorBody(
        {
          code: 'INVALID_CONTENT',
          data: { errors: { deviceName: ['Device name is required.'] } },
        },
        'fallback'
      )
    ).toBe('Device name is required.');
  });

  it('maps INVALID_CREDENTIALS code', () => {
    expect(parseApiErrorBody({ code: 'INVALID_CREDENTIALS' }, 'fallback')).toBe(
      'Invalid email or password.'
    );
  });

  it('uses fallback', () => {
    expect(parseApiErrorBody({}, 'fallback')).toBe('fallback');
  });
});
