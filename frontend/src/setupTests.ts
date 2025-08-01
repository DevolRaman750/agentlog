// Jest setup file
import 'jest';

// Mock react-native modules that Jest doesn't understand
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  
  return {
    ...RN,
    Dimensions: {
      get: jest.fn(() => ({ width: 375, height: 667 })),
      addEventListener: jest.fn(),
    },
    Platform: {
      OS: 'web',
      select: jest.fn((options) => options.web || options.default),
    },
  };
});

// Mock expo modules
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('expo', () => ({
  Constants: {
    expoConfig: {
      extra: {},
    },
  },
}));

// Mock react-navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
  useRoute: () => ({
    name: 'Test',
    params: {},
  }),
  useFocusEffect: jest.fn(),
}));

// Mock secure storage
jest.mock('./utils/secureStorage', () => ({
  secureStorage: {
    loadApiKeys: jest.fn(() => Promise.resolve({})),
    saveApiKey: jest.fn(() => Promise.resolve()),
    clearApiKeys: jest.fn(() => Promise.resolve()),
  },
}));

// Increase timeout for async operations
jest.setTimeout(30000); 