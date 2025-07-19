#!/bin/bash

# Script to rebuild the project with updated vector icons configuration

echo "Cleaning and rebuilding the project with updated vector icons configuration..."

# Clean the project
echo "Cleaning iOS build..."
cd ios
rm -rf build
rm -rf Pods
rm -rf Podfile.lock

# Reinstall pods
echo "Reinstalling iOS pods..."
pod install
cd ..

# Clean Android build
echo "Cleaning Android build..."
cd android
./gradlew clean
cd ..

echo "Rebuild completed. Now run the app with:"
echo "npx react-native run-ios"
echo "or"
echo "npx react-native run-android"