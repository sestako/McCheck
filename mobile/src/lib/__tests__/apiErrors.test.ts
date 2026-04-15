import { ApiError } from '../../api/types';
import { liveApiTroubleshootingHint, userFriendlyApiMessage } from '../apiErrors';

describe('liveApiTroubleshootingHint', () => {
  it('returns non-empty guidance', () => {
    expect(liveApiTroubleshootingHint().length).toBeGreaterThan(10);
  });
});

describe('userFriendlyApiMessage', () => {
  it('maps 401 with empty message to session hint', () => {
    expect(userFriendlyApiMessage(new ApiError('', 401))).toContain('sign in');
  });

  it('maps 401 with message to that message (e.g. login failure)', () => {
    expect(userFriendlyApiMessage(new ApiError('Invalid email or password.', 401))).toBe(
      'Invalid email or password.'
    );
  });

  it('maps 403', () => {
    expect(userFriendlyApiMessage(new ApiError('x', 403))).toContain("don't have permission");
  });

  it('maps 404', () => {
    expect(userFriendlyApiMessage(new ApiError('x', 404))).toContain('Not found');
  });

  it('maps network failure', () => {
    expect(userFriendlyApiMessage(new Error('Network request failed'))).toContain('reach the server');
  });
});
