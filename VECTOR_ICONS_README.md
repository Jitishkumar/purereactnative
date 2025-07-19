# Vector Icons Setup Guide

## Issue
If you're experiencing issues with vector icons showing as default shapes instead of the proper icons in your React Native project, this guide will help you fix the problem.

## What's Different from Expo?
In Expo, vector icons are automatically configured and work out of the box. In a bare React Native project, you need to manually link the font files to your native projects.

## Changes Made

The following changes have been made to fix the vector icons issue:

### iOS
1. Added all icon font files to `Info.plist` in the `UIAppFonts` array
2. Added `RNVectorIcons` pod to the `Podfile`

### Android
1. Updated `android/app/build.gradle` to include all icon font files
2. Applied the vector icons gradle script

## How to Apply the Changes

Run the provided script to rebuild your project with the updated vector icons configuration:

```bash
./rebuild_vector_icons.sh
```

This script will:
1. Clean the iOS build
2. Reinstall iOS pods
3. Clean the Android build

After running the script, you can run your app with:

```bash
npx react-native run-ios
# or
npx react-native run-android
```

## Manual Steps (if needed)

If the script doesn't work, you can manually perform these steps:

### iOS
1. Clean the iOS build: `cd ios && rm -rf build Pods Podfile.lock`
2. Reinstall pods: `pod install`

### Android
1. Clean the Android build: `cd android && ./gradlew clean`

## Troubleshooting

If you still experience issues:

1. Make sure you're importing icons correctly: `import Ionicons from 'react-native-vector-icons/Ionicons';`
2. Check that you're using the correct icon names (case-sensitive)
3. Try using a different icon family (e.g., MaterialIcons, FontAwesome)
4. Verify that the font files are being copied to your build by checking the build logs

## Additional Resources

- [React Native Vector Icons Documentation](https://github.com/oblador/react-native-vector-icons)
- [Available Icon Sets](https://oblador.github.io/react-native-vector-icons/)