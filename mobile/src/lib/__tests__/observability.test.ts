import * as Sentry from '@sentry/react-native';
import { initObservability, reportError } from '../observability';

describe('initObservability', () => {
  it('does not throw', () => {
    expect(() => initObservability()).not.toThrow();
    expect(() => initObservability()).not.toThrow();
    expect(Sentry.init).not.toHaveBeenCalled();
  });
});

describe('reportError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not throw', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => reportError('x', new Error('e'), { k: 1 })).not.toThrow();
    spy.mockRestore();
  });

  it('does not capture when Sentry was not initialized', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    reportError('handled', new Error('e'));
    expect(Sentry.captureException).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
