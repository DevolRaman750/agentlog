const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add resolver for Platform utility issue in React Native 0.76.x
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Web-specific configuration for Expo 52
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs'];

module.exports = config;
