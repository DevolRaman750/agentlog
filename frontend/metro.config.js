const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add resolver for Platform utility issue in React Native 0.76.x
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Fix for React Native web bundling issues
config.resolver.alias = {
  ...config.resolver.alias,
  '../Utilities/Platform': require.resolve('react-native-web/dist/exports/Platform'),
};

module.exports = config; 