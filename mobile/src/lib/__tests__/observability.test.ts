import { initObservability } from '../observability';

describe('initObservability', () => {
  it('does not throw', () => {
    expect(() => initObservability()).not.toThrow();
  });
});
