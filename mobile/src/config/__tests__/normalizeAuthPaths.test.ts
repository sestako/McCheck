import { normalizeAuthPath } from '../normalizeAuthPaths';

describe('normalizeAuthPath', () => {
  it('uses default when unset or blank', () => {
    expect(normalizeAuthPath(undefined, '/api/auth/login', ['/api/login'])).toBe('/api/auth/login');
    expect(normalizeAuthPath('', '/api/auth/login', ['/api/login'])).toBe('/api/auth/login');
    expect(normalizeAuthPath('   ', '/api/auth/login', ['/api/login'])).toBe('/api/auth/login');
  });

  it('rewrites legacy wrong MoveConcept login path', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(normalizeAuthPath('/api/login', '/api/auth/login', ['/api/login'])).toBe('/api/auth/login');
    warn.mockRestore();
  });

  it('adds leading slash when missing', () => {
    expect(normalizeAuthPath('api/auth/login', '/api/auth/login', ['/api/login'])).toBe('/api/auth/login');
  });

  it('passes through valid custom paths', () => {
    expect(normalizeAuthPath('/v2/auth/login', '/api/auth/login', ['/api/login'])).toBe('/v2/auth/login');
  });
});
