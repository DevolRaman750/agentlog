import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { goGentAPI } from '../api/client';

// Utility function to validate user objects
const isValidUser = (user: any): user is User => {
  if (!user || typeof user !== 'object') {
    console.log('❌ User validation failed: not an object', user);
    return false;
  }
  
  // Required fields
  if (typeof user.id !== 'string' || user.id.length === 0) {
    console.log('❌ User validation failed: invalid id', user.id);
    return false;
  }
  
  if (typeof user.username !== 'string' || user.username.length === 0) {
    console.log('❌ User validation failed: invalid username', user.username);
    return false;
  }
  
  // Optional fields with defaults
  if (user.email_verified !== undefined && typeof user.email_verified !== 'boolean') {
    console.log('❌ User validation failed: invalid email_verified', user.email_verified);
    return false;
  }
  
  if (user.is_temporary !== undefined && typeof user.is_temporary !== 'boolean') {
    console.log('❌ User validation failed: invalid is_temporary', user.is_temporary);
    return false;
  }
  
  console.log('✅ User validation passed for:', user.username);
  return true;
};

// Types
export interface User {
  id: string;
  username: string;
  email?: string;
  email_verified: boolean;
  is_temporary: boolean;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isManualAuthAttempt: boolean; // Flag to prevent auto-temp-user creation during login attempts
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  isLoading: boolean; // Alias for backward compatibility
  login: (username: string, password: string) => Promise<{ token: string; user: User }>;
  register: (username: string, email: string, password: string) => Promise<{ token: string; user: User }>;
  logout: () => Promise<void>;
  createTemporaryUser: () => Promise<{ token: string; user: User }>;
  saveTemporaryAccount: (username: string, email: string, password: string) => Promise<{ token: string; user: User }>;
  getCurrentUser: () => Promise<User | null>;
  connectTemporaryToEmail: (email: string, newPassword: string) => Promise<{ token: string; user: User }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ message: string }>;
  clearAllData: () => Promise<void>;
}

// Action types
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User }
  | { type: 'SET_TOKEN'; payload: string }
  | { type: 'SET_AUTHENTICATED'; payload: boolean }
  | { type: 'SET_MANUAL_AUTH_ATTEMPT'; payload: boolean }
  | { type: 'CLEAR_AUTH' }
  | { type: 'UPDATE_USER'; payload: Partial<User> };

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  isManualAuthAttempt: false,
};

// Reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload, isAuthenticated: true };
    case 'SET_TOKEN':
      return { ...state, token: action.payload };
    case 'SET_AUTHENTICATED':
      return { ...state, isAuthenticated: action.payload };
    case 'SET_MANUAL_AUTH_ATTEMPT':
      return { ...state, isManualAuthAttempt: action.payload };
    case 'CLEAR_AUTH':
      return { ...initialState, isLoading: false };
    case 'UPDATE_USER':
      return { 
        ...state, 
        user: state.user ? { ...state.user, ...action.payload } : null 
      };
    default:
      return state;
  }
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load stored auth data on app start
  useEffect(() => {
    loadStoredAuth();
  }, []);

  // Remove auto-creation of temporary users - let users choose explicitly

  const loadStoredAuth = async () => {
    try {
      const [token, userData] = await Promise.all([
        AsyncStorage.getItem('auth_token'),
        AsyncStorage.getItem('auth_user'),
      ]);

      if (token && userData) {
        let user;
        try {
          user = JSON.parse(userData);
        } catch (parseError) {
          console.warn('🔒 Malformed user data in storage, clearing auth');
          throw new Error('Malformed stored user data');
        }
        
        // Validate that stored user data is complete
        if (!isValidUser(user)) {
          console.warn('🔒 Corrupted user data in storage:', user);
          throw new Error('Corrupted stored user data');
        }
        
        // Validate the stored token with the server - but only if not already authenticated
        try {
          dispatch({ type: 'SET_TOKEN', payload: token });
          
          const response = await goGentAPI.getCurrentUser();
          
          if (response.success && response.data && isValidUser(response.data)) {
            // Token is valid and user data is complete
            // Preserve important properties from stored user if missing from API response
            const currentUser = response.data;
            const mergedUser = {
              ...currentUser,
              // Preserve is_temporary from stored data if not in API response
              is_temporary: currentUser.is_temporary ?? user.is_temporary ?? true,
              email_verified: currentUser.email_verified ?? user.email_verified ?? false,
              created_at: currentUser.created_at || user.created_at || new Date().toISOString(),
              updated_at: currentUser.updated_at || user.updated_at || new Date().toISOString(),
            };
            dispatch({ type: 'SET_USER', payload: mergedUser });
            console.log('✅ Restored valid auth session for:', mergedUser.username, 
                       mergedUser.is_temporary ? '(temporary)' : '(permanent)');
          } else if (response.isAuthError) {
            // Only clear auth on actual authentication errors (401, 403)
            console.warn('🔒 Authentication failed (401/403), clearing auth data');
            throw new Error('Authentication failed - token invalid');
          } else {
            // For other errors (500, network issues), keep the auth but log the issue
            console.warn('⚠️ Server error during auth validation, keeping stored auth:', response.error);
            // Use the stored user data since server validation failed due to non-auth issues
            dispatch({ type: 'SET_USER', payload: user });
            console.log('✅ Using stored auth session for:', user.username, 
                       '(server validation failed, but auth preserved)');
          }
        } catch (validationError) {
          console.warn('🔒 Stored token validation failed, clearing auth data');
          await clearStoredAuth();
          // Don't auto-create temp user - let user choose on welcome screen
        }
      } else {
        // No stored auth -> show welcome screen, let user choose
        console.log('ℹ️ No stored auth found, user will see welcome screen');
      }
    } catch (error) {
      console.error('❌ Error loading stored auth:', error);
      
      // Clear any corrupted data but don't auto-create temp user
      try {
        await clearStoredAuth();
        console.log('✅ Cleared corrupted auth data, user will see welcome screen');
      } catch (err) {
        console.error('❌ Failed to clear corrupted auth data:', err);
      }
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const storeAuth = async (token: string, user: User) => {
    try {
      await Promise.all([
        AsyncStorage.setItem('auth_token', token),
        AsyncStorage.setItem('auth_user', JSON.stringify(user)),
      ]);
    } catch (error) {
      console.error('Error storing auth:', error);
    }
  };

  const clearStoredAuth = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem('auth_token'),
        AsyncStorage.removeItem('auth_user'),
      ]);
    } catch (error) {
      console.error('Error clearing stored auth:', error);
    }
  };

  const clearAllData = async () => {
    try {
      console.log('🧹 Clearing all stored auth and temp data...');
      await Promise.all([
        AsyncStorage.removeItem('auth_token'),
        AsyncStorage.removeItem('auth_user'),
        AsyncStorage.removeItem('temp_password'),
      ]);
      
      // Reset auth state
      dispatch({ type: 'CLEAR_AUTH' });
      dispatch({ type: 'SET_MANUAL_AUTH_ATTEMPT', payload: false });
      
      console.log('✅ All auth data cleared, starting fresh');
    } catch (error) {
      console.error('Error clearing all data:', error);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_MANUAL_AUTH_ATTEMPT', payload: true });
      
      const response = await goGentAPI.login(username, password);
      
      if (response.success && response.data) {
        const { token, user } = response.data;
        
        // Validate user data before storing
        if (!isValidUser(user)) {
          console.warn('🔒 Invalid user data received from login:', user);
          throw new Error('Invalid user data received from server');
        }
        
        // Normalize user object
        const normalizedUser = {
          ...user,
          email_verified: user.email_verified ?? false,
          is_temporary: user.is_temporary ?? false, // Login users are typically permanent
          created_at: user.created_at || new Date().toISOString(),
          updated_at: user.updated_at || new Date().toISOString(),
        };
        
        await AsyncStorage.setItem('auth_token', token);
        await AsyncStorage.setItem('auth_user', JSON.stringify(normalizedUser));
        dispatch({ type: 'SET_USER', payload: normalizedUser });
        dispatch({ type: 'SET_AUTHENTICATED', payload: true });
        dispatch({ type: 'SET_MANUAL_AUTH_ATTEMPT', payload: false }); // Reset flag on success
        return { token, user: normalizedUser };
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      // Reset manual auth attempt flag after a delay to allow error display
      setTimeout(() => {
        dispatch({ type: 'SET_MANUAL_AUTH_ATTEMPT', payload: false });
      }, 1000);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_MANUAL_AUTH_ATTEMPT', payload: true });
      
      const response = await goGentAPI.register(username, email, password);
      
      if (response.success && response.data) {
        const { token, user } = response.data;
        
        // Validate user data before storing
        if (!isValidUser(user)) {
          console.warn('🔒 Invalid user data received from register:', user);
          throw new Error('Invalid user data received from server');
        }
        
        await AsyncStorage.setItem('auth_token', token);
        await AsyncStorage.setItem('auth_user', JSON.stringify(user));
        dispatch({ type: 'SET_USER', payload: user });
        dispatch({ type: 'SET_AUTHENTICATED', payload: true });
        dispatch({ type: 'SET_MANUAL_AUTH_ATTEMPT', payload: false }); // Reset flag on success
        return response.data;
      } else {
        throw new Error(response.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const createTemporaryUser = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await goGentAPI.createTemporaryUser();
      
      if (response.success && response.data) {
        const { token, user } = response.data;
        
        // Validate user data before storing
        if (!isValidUser(user)) {
          console.warn('🔒 Invalid user data received from createTemporaryUser:', user);
          throw new Error('Invalid user data received from server');
        }
        
        // Normalize user object - ensure temporary flag is set
        const normalizedUser = {
          ...user,
          email_verified: user.email_verified ?? false,
          is_temporary: user.is_temporary ?? true, // Temporary users should be marked as such
          created_at: user.created_at || new Date().toISOString(),
          updated_at: user.updated_at || new Date().toISOString(),
        };
        
        console.log('✅ Created and normalized temporary user:', normalizedUser);
        
        await AsyncStorage.setItem('auth_token', token);
        await AsyncStorage.setItem('auth_user', JSON.stringify(normalizedUser));
        dispatch({ type: 'SET_USER', payload: normalizedUser });
        dispatch({ type: 'SET_AUTHENTICATED', payload: true });
        return { token, user: normalizedUser };
      } else {
        throw new Error(response.error || 'Failed to create temporary user');
      }
    } catch (error) {
      console.error('Create temporary user error:', error);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const saveTemporaryAccount = async (username: string, email: string, password: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      // API only accepts email and password, ignoring username for now
      const response = await goGentAPI.saveTemporaryAccount(email, password);
      
      if (response.success && response.data) {
        // Create a mock token since saveTemporaryAccount only returns { user } 
        const token = `saved-temp-${Date.now()}`;
        const user = response.data.user;
        
        // Validate user data before storing
        if (!isValidUser(user)) {
          console.warn('🔒 Invalid user data received from saveTemporaryAccount:', user);
          throw new Error('Invalid user data received from server');
        }
        
        await AsyncStorage.setItem('auth_token', token);
        await AsyncStorage.setItem('auth_user', JSON.stringify(user));
        dispatch({ type: 'SET_USER', payload: user });
        dispatch({ type: 'SET_AUTHENTICATED', payload: true });
        return { token, user };
      } else {
        throw new Error(response.error || 'Failed to save temporary account');
      }
    } catch (error) {
      console.error('Save temporary account error:', error);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const getCurrentUser = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      
      if (!token) {
        return null;
      }
      
      // Validate token with the server by making an API call
      const response = await goGentAPI.getCurrentUser();
      
      if (response.success && response.data) {
        // Handle both direct user object and nested user object from server
        let user = response.data;
        
        // If server returns {user: {...}}, extract the user object
        if (user && typeof user === 'object' && (user as any).user && !user.id) {
          console.log('📦 Extracting nested user object from server response');
          user = (user as any).user;
        }
        
        console.log('🔍 Validating user data structure:', {
          hasId: !!user?.id,
          hasUsername: !!user?.username,
          hasEmailVerified: typeof user?.email_verified,
          hasIsTemporary: typeof user?.is_temporary,
          actualUser: user
        });
        
        // Validate that user data is complete
        if (!isValidUser(user)) {
          console.warn('🔒 Incomplete user data received from server:', user);
          return null;
        }
        
        // Normalize user object with default values for missing fields
        const normalizedUser = {
          ...user,
          email_verified: user.email_verified ?? false,
          is_temporary: user.is_temporary ?? true, // Default to temporary if not specified
          created_at: user.created_at || new Date().toISOString(),
          updated_at: user.updated_at || new Date().toISOString(),
        };
        
        console.log('✅ Normalized user data:', normalizedUser);
        
        // Update stored user data
        await AsyncStorage.setItem('auth_user', JSON.stringify(normalizedUser));
        dispatch({ type: 'SET_USER', payload: normalizedUser });
        dispatch({ type: 'SET_AUTHENTICATED', payload: true });
        return normalizedUser;
      } else if (response.isAuthError) {
        // Only consider it a token failure on actual auth errors (401, 403)
        console.warn('🔒 Server rejected auth token (401/403)');
        return null;
      } else {
        // For other errors (500, network issues), don't clear the token
        console.warn('⚠️ Server error during user validation (keeping token):', response.error);
        throw new Error(`Server error: ${response.error}`);
      }
    } catch (error) {
      console.error('Get current user error:', error);
      // Re-throw to let caller decide how to handle the error
      throw error;
    }
  };

  const logout = async () => {
    await clearStoredAuth();
    dispatch({ type: 'CLEAR_AUTH' });
  };

  const clearAuth = () => {
    dispatch({ type: 'CLEAR_AUTH' });
  };

  const connectTemporaryToEmail = async (email: string, newPassword: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await goGentAPI.connectTemporaryToEmail(email, newPassword);
      
      if (response.success && response.data) {
        const { token, user } = response.data;
        
        // Validate user data before storing
        if (!isValidUser(user)) {
          console.warn('🔒 Invalid user data received from connectTemporaryToEmail:', user);
          throw new Error('Invalid user data received from server');
        }
        
        await AsyncStorage.setItem('auth_token', token);
        await AsyncStorage.setItem('auth_user', JSON.stringify(user));
        dispatch({ type: 'SET_USER', payload: user });
        dispatch({ type: 'SET_AUTHENTICATED', payload: true });
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to connect account');
      }
    } catch (error) {
      console.error('Connect account error:', error);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await goGentAPI.changePassword(currentPassword, newPassword);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const value: AuthContextType = {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    loading: state.isLoading,
    isLoading: state.isLoading, // Alias for backward compatibility
    login,
    register,
    logout,
    createTemporaryUser,
    saveTemporaryAccount,
    getCurrentUser,
    connectTemporaryToEmail,
    changePassword,
    clearAllData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 