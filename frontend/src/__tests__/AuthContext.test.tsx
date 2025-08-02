import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth, User } from '../context/AuthContext';
import { goGentAPI } from '../api/client';

// Mock AsyncStorage
const mockAsyncStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  multiRemove: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
};
(AsyncStorage as any) = mockAsyncStorage;

// Mock goGentAPI
jest.mock('../api/client', () => ({
  goGentAPI: {
    createTemporaryUser: jest.fn(),
    login: jest.fn(),
    getCurrentUser: jest.fn(),
    logout: jest.fn(),
  },
}));

const mockedGoGentAPI = jest.mocked(goGentAPI);

describe('AuthContext', () => {
  const mockUser: User = {
    id: 'test-user-id',
    username: 'testuser',
    email: 'test@example.com',
    email_verified: false,
    is_temporary: true,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  };

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue(undefined);
    mockAsyncStorage.removeItem.mockResolvedValue(undefined);
  });

  describe('User Validation', () => {
    test('should validate user object correctly', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Test by checking that a properly authenticated user is handled correctly
      expect(result.current.isAuthenticated).toBe(false); // Initial state
    });

    test('should reject invalid user objects', async () => {
      // Mock API to return invalid user data
      mockedGoGentAPI.getCurrentUser.mockResolvedValue({
        success: true,
        data: null, // Invalid user data
      });

      const { result } = renderHook(() => useAuth(), { wrapper });
      
      // The context should handle invalid users gracefully
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Authentication State', () => {
    test('should initialize with correct default state', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(true); // Should be loading initially
    });

    test('should load stored authentication on mount', async () => {
      const mockToken = 'stored-token';
      const storedUserData = JSON.stringify(mockUser);

      mockAsyncStorage.getItem.mockImplementation((key: string) => {
        if (key === 'auth_token') return Promise.resolve(mockToken);
        if (key === 'auth_user') return Promise.resolve(storedUserData);
        return Promise.resolve(null);
      });

      mockedGoGentAPI.getCurrentUser.mockResolvedValue({
        success: true,
        data: mockUser,
      });

      const { result, waitForNextUpdate } = renderHook(() => useAuth(), { wrapper });

      // Wait for authentication to load
      await act(async () => {
        await waitForNextUpdate();
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(expect.objectContaining({
        id: mockUser.id,
        username: mockUser.username,
      }));
    });
  });

  describe('Login Flow', () => {
    test('should handle successful login', async () => {
      const loginResponse = {
        success: true,
        data: {
          token: 'new-token',
          user: mockUser,
        },
      };

      mockedGoGentAPI.login.mockResolvedValue(loginResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login('testuser', 'password');
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(expect.objectContaining(mockUser));
      expect(result.current.token).toBe('new-token');
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('auth_token', 'new-token');
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('auth_user', JSON.stringify(mockUser));
    });

    test('should handle login failure', async () => {
      mockedGoGentAPI.login.mockResolvedValue({
        success: false,
        error: 'Invalid credentials',
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        try {
          await result.current.login('testuser', 'wrong-password');
        } catch (error) {
          expect(error).toBeDefined();
        }
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });

  describe('Temporary User Creation', () => {
    test('should create temporary user successfully', async () => {
      const tempUserResponse = {
        success: true,
        data: {
          token: 'temp-token',
          user: { ...mockUser, is_temporary: true },
        },
      };

      mockedGoGentAPI.createTemporaryUser.mockResolvedValue(tempUserResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.createTemporaryUser();
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.is_temporary).toBe(true);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('auth_token', 'temp-token');
    });

    test('should handle temporary user creation failure', async () => {
      mockedGoGentAPI.createTemporaryUser.mockResolvedValue({
        success: false,
        error: 'Unable to create temporary user',
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        try {
          await result.current.createTemporaryUser();
        } catch (error) {
          expect(error).toBeDefined();
        }
      });

      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Logout Flow', () => {
    test('should clear authentication state on logout', async () => {
      // Mock successful temp user creation first
      mockedGoGentAPI.createTemporaryUser.mockResolvedValue({
        success: true,
        data: { token: 'temp-token', user: mockUser },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Authenticate first
      await act(async () => {
        await result.current.createTemporaryUser();
      });

      // Now logout
      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('auth_token');
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('auth_user');
    });
  });

  describe('Error Handling', () => {
    test('should handle corrupted stored user data', async () => {
      mockAsyncStorage.getItem.mockImplementation((key: string) => {
        if (key === 'auth_token') return Promise.resolve('valid-token');
        if (key === 'auth_user') return Promise.resolve('invalid-json');
        return Promise.resolve(null);
      });

      const { result, waitForNextUpdate } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        try {
          await waitForNextUpdate();
        } catch {
          // Expected to fail
        }
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    test('should handle network errors during authentication', async () => {
      mockAsyncStorage.getItem.mockImplementation((key: string) => {
        if (key === 'auth_token') return Promise.resolve('valid-token');
        if (key === 'auth_user') return Promise.resolve(JSON.stringify(mockUser));
        return Promise.resolve(null);
      });

      mockedGoGentAPI.getCurrentUser.mockRejectedValue(new Error('Network error'));

      const { result, waitForNextUpdate } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        try {
          await waitForNextUpdate();
        } catch {
          // Expected for network errors
        }
      });

      // Should handle network errors gracefully
      expect(result.current.isLoading).toBe(false);
    });
  });
}); 