import AsyncStorage from '@react-native-async-storage/async-storage';
import { secureStorage } from './secureStorage';

export const debugAuthState = async () => {
  console.log('🔍 === AUTH DEBUG STATE ===');
  
  try {
    // Check auth token
    const authToken = await AsyncStorage.getItem('auth_token');
    console.log('🔐 Auth token:', authToken ? '✅ Present' : '❌ Missing');
    if (authToken) {
      console.log('🔐 Auth token length:', authToken.length);
      console.log('🔐 Auth token preview:', authToken.substring(0, 50) + '...');
    }

    // Check user data
    const userData = await AsyncStorage.getItem('user_data');
    console.log('👤 User data:', userData ? '✅ Present' : '❌ Missing');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        console.log('👤 User ID:', user.id);
        console.log('👤 User type:', user.is_temporary ? 'Temporary' : 'Permanent');
        console.log('👤 Username:', user.username);
      } catch (e) {
        console.error('👤 User data parse error:', e);
      }
    }

    // Check app config
    const appConfig = await AsyncStorage.getItem('appConfig');
    console.log('⚙️ App config:', appConfig ? '✅ Present' : '❌ Missing');

    // Check API keys
    const apiKeys = await secureStorage.loadApiKeys();
    console.log('🔑 API keys loaded:', {
      gemini: apiKeys.geminiApiKey ? '✅ Present' : '❌ Missing',
      openWeather: apiKeys.openWeatherApiKey ? '✅ Present' : '❌ Missing',
      neo4j: apiKeys.neo4jUrl ? '✅ Present' : '❌ Missing',
    });

    // Check configurations
    const configurations = await AsyncStorage.getItem('configurations');
    console.log('📋 Configurations:', configurations ? '✅ Present' : '❌ Missing');
    if (configurations) {
      try {
        const configs = JSON.parse(configurations);
        console.log('📋 Number of configurations:', Array.isArray(configs) ? configs.length : 'Invalid format');
      } catch (e) {
        console.error('📋 Configurations parse error:', e);
      }
    }

    console.log('🔍 === END AUTH DEBUG ===');
  } catch (error) {
    console.error('🔍 Debug auth state error:', error);
  }
};

export const clearAllAuthData = async () => {
  console.log('🧹 === CLEARING ALL AUTH DATA ===');
  
  try {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('user_data');
    await AsyncStorage.removeItem('configurations');
    await AsyncStorage.removeItem('appConfig');
    await AsyncStorage.removeItem('config_version');
    await secureStorage.clearAllApiKeys();
    
    console.log('🧹 All auth data cleared successfully');
  } catch (error) {
    console.error('🧹 Error clearing auth data:', error);
  }
};

export const createTestUser = async () => {
  console.log('🧪 === CREATING TEST USER ===');
  
  try {
    const response = await fetch('http://localhost:8080/api/auth/temp-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('🧪 Test user created:', {
      userId: data.user.id,
      username: data.user.username,
      isTemporary: data.user.is_temporary,
    });

    // Store auth data
    await AsyncStorage.setItem('auth_token', data.token);
    await AsyncStorage.setItem('user_data', JSON.stringify(data.user));
    
    console.log('🧪 Auth data stored successfully');
    return data;
  } catch (error) {
    console.error('🧪 Error creating test user:', error);
    return null;
  }
}; 