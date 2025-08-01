export default ({ config }) => {
  // Determine the environment
  const environment = process.env.NODE_ENV || 'development';
  const isProduction = environment === 'production';
  
  // Set backend URL based on environment - prioritize EXPO_PUBLIC_ env vars
  let backendUrl;
  
  if (process.env.EXPO_PUBLIC_BACKEND_URL) {
    // Use explicitly set environment variable
    backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
  } else if (isProduction) {
    // Production default
    backendUrl = 'https://agentlog.scalebase.io';
  } else {
    // Development default
    backendUrl = 'http://localhost:8080';
  }

  console.log(`📱 Expo Build Environment: ${environment}`);
  console.log(`🔗 Backend URL: ${backendUrl}`);
  console.log(`🌍 EXPO_PUBLIC_BACKEND_URL: ${process.env.EXPO_PUBLIC_BACKEND_URL || 'not set'}`);

  return {
    ...config,
    expo: {
      name: "gogent-mobile",
      slug: "gogent-mobile", 
      version: "1.0.0",
      orientation: "portrait",
      icon: "./assets/icon.png",
      userInterfaceStyle: "light",
      newArchEnabled: true,
      splash: {
        image: "./assets/splash-icon.png",
        resizeMode: "contain",
        backgroundColor: "#ffffff"
      },
      ios: {
        supportsTablet: true
      },
      android: {
        adaptiveIcon: {
          foregroundImage: "./assets/adaptive-icon.png",
          backgroundColor: "#ffffff"
        },
        edgeToEdgeEnabled: true
      },
      web: {
        favicon: "./assets/favicon.png"
      },
      extra: {
        // Environment variables that will be available in the app
        environment,
        backendUrl,
        isProduction,
        // Add EAS build info if available
        eas: {
          projectId: process.env.EAS_PROJECT_ID || null
        }
      }
    }
  };
}; 