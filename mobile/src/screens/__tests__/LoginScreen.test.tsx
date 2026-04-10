import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { LoginScreen } from '../LoginScreen';

jest.mock('../../config/env', () => ({
  API_BASE_URL: 'https://test.invalid',
  AUTH_LOGIN_PATH: '/api/login',
  USE_MOCK_API: true,
}));

const mockSignInWithEmail = jest.fn();
const mockSignInWithGoogle = jest.fn();

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    signInWithEmail: mockSignInWithEmail,
    signInWithGoogle: mockSignInWithGoogle,
  }),
}));

const navProps = { navigation: {} as never, route: {} as never };

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSignInWithEmail.mockResolvedValue(undefined);
  });

  it('renders title and primary actions', () => {
    render(<LoginScreen {...navProps} />);
    expect(screen.getByText('McCheck')).toBeTruthy();
    expect(screen.getByLabelText('Continue with email')).toBeTruthy();
    expect(screen.getByLabelText('Continue with Google')).toBeTruthy();
  });

  it('invokes email sign-in when Continue with email is pressed', async () => {
    render(<LoginScreen {...navProps} />);
    fireEvent.press(screen.getByLabelText('Continue with email'));
    await waitFor(() => {
      expect(mockSignInWithEmail).toHaveBeenCalled();
    });
    expect(mockSignInWithEmail.mock.calls[0][0]).toBe('demo@example.com');
  });
});
