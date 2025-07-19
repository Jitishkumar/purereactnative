import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { StatusBar, Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { VideoProvider } from './src/context/VideoContext';
import { AccountProvider } from './src/context/AccountContext';
import { ZegoUIKitPrebuiltCallService } from '@zegocloud/zego-uikit-prebuilt-call-rn';

// Zego credentials
const appID = 91100572;
const appSign = '700161538563620670267242f2c4c72f623bb13a09f02a36828f9545678d2340';

// Initialize ZegoUIKitPrebuiltCallService with error handling
try {
  console.log('[Zego] Initializing ZegoUIKitPrebuiltCallService...');
  
  // Check if RNEncryptedStorage is available
  if (!global.RNEncryptedStorage) {
    console.warn('[Zego] RNEncryptedStorage is not defined. Using fallback.');
  }
  
  // Initialize the service
  ZegoUIKitPrebuiltCallService.init(
    appID,
    appSign,
    {}, // Additional config if needed
  ).then(() => {
    console.log('[Zego] ZegoUIKitPrebuiltCallService initialized successfully');
  }).catch(error => {
    console.error('[Zego] Failed to initialize ZegoUIKitPrebuiltCallService:', error);
  });
} catch (error) {
  console.error('[Zego] Error during ZegoUIKitPrebuiltCallService initialization:', error);
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AccountProvider>
        <VideoProvider>
          <NavigationContainer>
            <AppNavigator />
            <StatusBar barStyle="light-content" />
          </NavigationContainer>
        </VideoProvider>
      </AccountProvider>
    </SafeAreaProvider>
  );
}
