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
};
(AsyncStorage as any) = mockAsyncStorage;

// Mock the API client with all required methods
jest.mock('../api/client', () => ({
  goGentAPI: {
    getCurrentUser: jest.fn(),
    login: jest.fn(),
    register: jest.fn(),
    createTemporaryUser: jest.fn(),
    saveTemporaryAccount: jest.fn(),
    connectTemporaryToEmail: jest.fn(),
    changePassword: jest.fn(),
  },
}));

const mockGoGentAPI = jest.mocked(goGentAPI);

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
    mockAsyncStorage.clear();
  });

  describe('User Validation', () => {
    test('should validate user object correctly', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      // Test valid user validation indirectly through createTemporaryUser
      mockGoGentAPI.createTemporaryUser.mockResolvedValueOnce({
        success: true,
        data: { token: 'new-token', user: mockUser }
      });

      await act(async () => {
        await result.current.createTemporaryUser();
      });

      expect(result.current.user).toEqual(expect.objectContaining(mockUser));
      expect(result.current.isAuthenticated).toBe(true);
    });

    test('should reject invalid user objects', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      // Test invalid user rejection by mocking an invalid response
      mockGoGentAPI.createTemporaryUser.mockResolvedValueOnce({
        success: false,
        error: 'Invalid user data'
      });

      await act(async () => {
        await expect(result.current.createTemporaryUser()).rejects.toThrow();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Authentication State', () => {
    test('should initialize with correct default state', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(true); // Should be loading initially
    });

    test('should load stored authentication on mount', async () => {
      // Setup stored auth data
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'auth_token') return Promise.resolve('stored-token');
        if (key === 'auth_user') return Promise.resolve(JSON.stringify(mockUser));
        return Promise.resolve(null);
      });

      mockGoGentAPI.getCurrentUser.mockResolvedValueOnce({
        success: true,
        data: mockUser
      });

      const { result, waitForNextUpdate } = renderHook(() => useAuth(), { wrapper });

      // Wait for the authentication to load
      await act(async () => {
        await waitForNextUpdate();
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.user).toEqual(expect.objectContaining(mockUser));
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('Login Flow', () => {
    test('should handle successful login', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      mockGoGentAPI.login.mockResolvedValueOnce({
        success: true,
        data: { token: 'new-token', user: mockUser }
      });

      await act(async () => {
        const response = await result.current.login('testuser', 'password');
        expect(response.token).toBe('new-token');
        expect(response.user).toEqual(expect.objectContaining(mockUser));
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(expect.objectContaining(mockUser));
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('auth_token', 'new-token');
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('auth_user', JSON.stringify(mockUser));
    });

    test('should handle login failure', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      mockGoGentAPI.login.mockResolvedValueOnce({
        success: false,
        error: 'Invalid credentials'
      });

      await act(async () => {
        await expect(result.current.login('testuser', 'wrongpassword')).rejects.toThrow('Invalid credentials');
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });

  describe('Temporary User Creation', () => {
    test('should create temporary user successfully', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      mockGoGentAPI.createTemporaryUser.mockResolvedValueOnce({
        success: true,
        data: { token: 'temp-token', user: mockUser }
      });

      await act(async () => {
        const response = await result.current.createTemporaryUser();
        expect(response.token).toBe('temp-token');
        expect(response.user).toEqual(expect.objectContaining(mockUser));
      });

      expect(result.current.user).toEqual(expect.objectContaining(mockUser));
      expect(result.current.isAuthenticated).toBe(true);
    });

    test('should handle temporary user creation failure', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      mockGoGentAPI.createTemporaryUser.mockResolvedValueOnce({
        success: false,
        error: 'Unable to create temporary user'
      });

      await act(async () => {
        await expect(result.current.createTemporaryUser()).rejects.toThrow('Unable to create temporary user');
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Logout Flow', () => {
    test('should clear authentication state on logout', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      // First login
      mockGoGentAPI.login.mockResolvedValueOnce({
        success: true,
        data: { token: 'login-token', user: mockUser }
      });

      await act(async () => {
        await result.current.login('testuser', 'password');
      });

      // Then logout
      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('auth_token');
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('auth_user');
    });
  });

  describe('Error Handling', () => {
    test('should handle corrupted stored user data', async () => {
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'auth_token') return Promise.resolve('stored-token');
        if (key === 'auth_user') return Promise.resolve('invalid-json-data');
        return Promise.resolve(null);
      });

      const { result, waitForNextUpdate } = renderHook(() => useAuth(), { wrapper });

      // Wait for the error handling to complete
      await act(async () => {
        try {
          await waitForNextUpdate();
        } catch {
          // Expected for error handling
        }
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    test('should handle network errors during authentication', async () => {
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'auth_token') return Promise.resolve('stored-token');
        if (key === 'auth_user') return Promise.resolve(JSON.stringify(mockUser));
        return Promise.resolve(null);
      });

      mockGoGentAPI.getCurrentUser.mockRejectedValueOnce(new Error('Network error'));

      const { result, waitForNextUpdate } = renderHook(() => useAuth(), { wrapper });

      // Wait for the error handling to complete
      await act(async () => {
        try {
          await waitForNextUpdate();
        } catch {
          // Expected for network errors
        }
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });
}); 