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

jest.mock('expo-camera', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    CameraView: (props) => React.createElement(View, props),
    useCameraPermissions: () => [{ granted: true, canAskAgain: true }, jest.fn(), jest.fn()],
  };
});

// `@expo/vector-icons` pulls in `expo-font` which in turn pulls `expo-asset`.
// Neither is available to Jest; a plain View stub is enough for render tests.
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  const makeIcon = (displayName) => {
    const Icon = (props) => React.createElement(View, { ...props, accessibilityLabel: props.accessibilityLabel ?? displayName });
    Icon.displayName = displayName;
    return Icon;
  };
  return {
    Ionicons: makeIcon('Ionicons'),
    MaterialIcons: makeIcon('MaterialIcons'),
    MaterialCommunityIcons: makeIcon('MaterialCommunityIcons'),
    FontAwesome: makeIcon('FontAwesome'),
    FontAwesome5: makeIcon('FontAwesome5'),
    Feather: makeIcon('Feather'),
    AntDesign: makeIcon('AntDesign'),
  };
});

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
