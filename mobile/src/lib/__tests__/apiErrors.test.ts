import { ApiError } from '../../api/types';
import { liveApiTroubleshootingHint, userFriendlyApiMessage } from '../apiErrors';

describe('liveApiTroubleshootingHint', () => {
  it('returns non-empty guidance', () => {
    expect(liveApiTroubleshootingHint().length).toBeGreaterThan(10);
  });
});

describe('userFriendlyApiMessage', () => {
  it('maps 401', () => {
    expect(userFriendlyApiMessage(new ApiError('x', 401))).toContain('sign in');
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
