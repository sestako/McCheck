jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn().mockResolvedValue(true),
    signIn: jest.fn().mockResolvedValue({ type: 'success', data: {} }),
    getTokens: jest.fn().mockResolvedValue({ accessToken: 'test-access', idToken: 'test-id' }),
    signOut: jest.fn().mockResolvedValue(null),
    revokeAccess: jest.fn().mockResolvedValue(null),
  },
  statusCodes: {
    SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
    IN_PROGRESS: 'IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
    SIGN_IN_REQUIRED: 'SIGN_IN_REQUIRED',
    NULL_PRESENTER: 'NULL_PRESENTER',
  },
}));

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
