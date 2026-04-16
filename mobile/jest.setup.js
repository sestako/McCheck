jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  withScope: (callback) =>
    callback({
      setExtra: jest.fn(),
      setExtras: jest.fn(),
      setTag: jest.fn(),
    }),
  wrap: (Component) => Component,
}));
