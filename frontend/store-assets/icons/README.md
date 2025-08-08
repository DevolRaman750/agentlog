# App Store Icons Requirements

## iOS App Store Icons

### Required Sizes:
- **App Store**: 1024x1024px (PNG, no transparency)
- **iPhone**: 180x180px, 120x120px, 87x87px
- **iPad**: 167x167px, 152x152px, 76x76px
- **Spotlight**: 120x120px, 80x80px
- **Settings**: 87x87px, 58x58px, 29x29px

### Design Guidelines:
- No transparency
- No rounded corners (iOS adds them automatically)
- High contrast and clear visibility at small sizes
- Follow Apple's Human Interface Guidelines

## Android Play Store Icons

### Required Sizes:
- **Play Store**: 512x512px (PNG, 32-bit with alpha)
- **Adaptive Icon**: 108x108px foreground + 108x108px background
- **Legacy Icon**: 192x192px, 144x144px, 96x96px, 72x72px, 48x48px, 36x36px

### Design Guidelines:
- Use adaptive icon format for Android 8.0+
- Ensure important content stays within safe zone (66dp diameter)
- Test with different mask shapes (circle, squircle, rounded square)

## Current Assets Status:
- [ ] 1024x1024 App Store icon
- [ ] iPhone icons (180x180, 120x120, 87x87)
- [ ] iPad icons (167x167, 152x152, 76x76)
- [ ] Android Play Store icon (512x512)
- [ ] Android adaptive icons (foreground + background)

## Notes:
Replace the placeholder icons in `/assets/` with properly designed AgentLog branded icons following the requirements above.