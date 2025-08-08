# AgentLog Deployment Guide

## Overview

This guide walks you through deploying AgentLog to the iOS App Store and Google Play Store using Expo Application Services (EAS).

## Prerequisites

### 1. Development Environment
- Node.js 18+ installed
- Yarn package manager
- EAS CLI installed globally: `npm install -g @expo/eas-cli`
- Expo account created

### 2. Developer Accounts
- **iOS**: Apple Developer Program membership ($99/year)
- **Android**: Google Play Console account ($25 one-time fee)

### 3. App Store Preparation
- Bundle identifiers reserved:
  - iOS: `com.agentlog.app`
  - Android: `com.agentlog.app`

## Step-by-Step Deployment

### Phase 1: Initial Setup

#### 1. Install Dependencies
```bash
cd frontend
yarn install
```

#### 2. Configure EAS Project
```bash
# Login to Expo
eas login

# Initialize EAS project
eas init
```

#### 3. Set Up Configuration Files (Automated)
```bash
# Run the automated setup script
./setup-deployment.sh
```

This script will:
- Copy all example files to actual configuration files
- Prompt you for essential information (app name, bundle IDs, etc.)
- Automatically update configuration files with your values
- Set up proper gitignored configuration

#### 4. Manual Configuration (if needed)
If you prefer manual setup or need to customize further:
- Copy `*.example` files to remove the `.example` extension
- Fill in actual values in the configuration files
- Update placeholders with your specific information

### Phase 2: iOS Deployment

#### 1. Apple Developer Setup
- Create App ID in Apple Developer Portal
- Generate iOS Distribution Certificate
- Create App Store Connect API Key
- Set up provisioning profiles

#### 2. Configure iOS Secrets
```bash
# Upload iOS certificate to EAS
eas secret:create --scope project --name IOS_DIST_P12 --type file --value ./secrets/ios/certificates/ios-distribution.p12

# Upload certificate password
eas secret:create --scope project --name IOS_DIST_P12_PASSWORD --value "your-certificate-password"
```

#### 3. Build iOS App
```bash
# Development build for testing
eas build --platform ios --profile development

# Production build for App Store
eas build --platform ios --profile production
```

#### 4. Submit to App Store
```bash
# Automatic submission (requires API key setup)
eas submit --platform ios

# Manual submission: Download .ipa and upload via Xcode or App Store Connect
```

### Phase 3: Android Deployment

#### 1. Google Play Console Setup
- Create app in Google Play Console
- Set up service account for automated publishing
- Generate upload keystore

#### 2. Configure Android Secrets
```bash
# Upload Android keystore
eas secret:create --scope project --name ANDROID_KEYSTORE --type file --value ./secrets/android/upload-key.keystore

# Upload keystore credentials
eas secret:create --scope project --name ANDROID_KEYSTORE_PASSWORD --value "your-keystore-password"
eas secret:create --scope project --name ANDROID_KEY_ALIAS --value "your-key-alias"
eas secret:create --scope project --name ANDROID_KEY_PASSWORD --value "your-key-password"

# Upload service account JSON
eas secret:create --scope project --name GOOGLE_SERVICE_ACCOUNT --type file --value ./secrets/android/google-service-account.json
```

#### 3. Build Android App
```bash
# Development build for testing
eas build --platform android --profile development

# Production build for Play Store
eas build --platform android --profile production
```

#### 4. Submit to Play Store
```bash
# Automatic submission
eas submit --platform android

# Manual submission: Download .aab and upload via Play Console
```

### Phase 4: Store Listing Setup

#### iOS App Store Connect
1. **App Information**
   - Name: AgentLog
   - Bundle ID: com.agentlog.app
   - SKU: agentlog-ios

2. **App Store Listing**
   - Use content from `store-assets/descriptions/app-store-listing.md`
   - Upload screenshots from `store-assets/screenshots/`
   - Set app category: Productivity (Primary), Business (Secondary)

3. **Pricing and Availability**
   - Free app (recommended for initial release)
   - Available in all territories

4. **App Review Information**
   - Follow guidelines in `app-store-review-guidelines.md`
   - Provide demo account if needed
   - Include review notes explaining AI functionality

#### Google Play Console
1. **Store Listing**
   - Use content from `store-assets/descriptions/app-store-listing.md`
   - Upload screenshots and graphics
   - Set content rating: Everyone

2. **Release Management**
   - Start with Internal Testing
   - Progress to Closed Testing (Alpha/Beta)
   - Finally submit for Production

3. **Data Safety**
   - Complete data safety form based on privacy policy
   - Declare data collection and sharing practices

## Build Profiles Explained

### Development Profile
- **Purpose**: Internal testing and development
- **Distribution**: Internal only
- **Features**: Debug symbols, faster builds
- **Usage**: `eas build --profile development`

### Preview Profile  
- **Purpose**: External testing (TestFlight, Internal App Sharing)
- **Distribution**: Internal distribution
- **Features**: Release configuration, optimized
- **Usage**: `eas build --profile preview`

### Production Profile
- **Purpose**: App Store/Play Store submission
- **Distribution**: Public stores
- **Features**: Fully optimized, production-ready
- **Usage**: `eas build --profile production`

## Environment Variables and Secrets

### Required Placeholders to Fill:
- `YOUR_EAS_PROJECT_ID_HERE` in app.json and eas.json
- `YOUR_APPLE_ID_HERE` in eas.json
- `YOUR_ASC_APP_ID_HERE` in eas.json  
- `YOUR_APPLE_TEAM_ID_HERE` in eas.json
- Support email and URLs in privacy policy
- Actual API endpoints in env.example

### Security Best Practices:
- Never commit secrets to version control
- Use EAS Secrets for sensitive data
- Rotate API keys and certificates regularly
- Monitor for unauthorized access

## Testing Strategy

### Pre-Submission Testing
1. **Device Testing**
   - Test on multiple iOS and Android devices
   - Verify functionality across different screen sizes
   - Test network connectivity edge cases

2. **Feature Testing**
   - AI agent creation and configuration
   - API key management and encryption
   - Execution monitoring and logs
   - Error handling and recovery

3. **Performance Testing**
   - App startup time
   - Memory usage monitoring
   - Network request optimization
   - Battery usage assessment

### Post-Submission Testing
1. **App Store Builds**
   - Download and test production builds
   - Verify all features work in production environment
   - Monitor crash reports and user feedback

## Troubleshooting

### Common Build Issues
- **Certificate Problems**: Verify certificates are valid and properly uploaded
- **Provisioning Issues**: Ensure provisioning profiles match bundle identifiers
- **Dependency Conflicts**: Clear node_modules and reinstall if needed

### Common Submission Issues
- **App Review Rejections**: Address feedback and resubmit promptly
- **Metadata Issues**: Ensure descriptions comply with store guidelines
- **Technical Issues**: Monitor build logs and address any warnings

### Getting Help
- EAS Build Documentation: https://docs.expo.dev/build/introduction/
- Expo Discord Community: https://chat.expo.dev/
- Apple Developer Support: https://developer.apple.com/support/
- Google Play Console Help: https://support.google.com/googleplay/android-developer/

## Post-Launch Checklist

### Immediate Post-Launch (First 24 hours)
- [ ] Monitor app store approval status
- [ ] Check for crash reports or critical issues
- [ ] Respond to initial user reviews
- [ ] Verify analytics are tracking properly

### First Week
- [ ] Analyze user acquisition metrics
- [ ] Monitor app performance and stability
- [ ] Gather user feedback and feature requests
- [ ] Plan first update based on feedback

### Ongoing Maintenance
- [ ] Regular app updates with new features
- [ ] Monitor app store guidelines changes
- [ ] Update dependencies and security patches
- [ ] Maintain app store optimization (ASO)

---

**Note**: This guide provides a comprehensive deployment strategy. Customize based on your specific requirements and keep it updated as processes evolve.