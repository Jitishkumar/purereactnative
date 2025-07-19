/**
 * RNEncryptedStorageModule.js
 * 
 * This module provides a direct implementation of RNEncryptedStorage
 * that can be accessed globally in the JavaScript context.
 * 
 * It ensures that the RNEncryptedStorage module is available for
 * packages like @zegocloud/zego-uikit-prebuilt-call-rn that depend on it.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, Platform } from 'react-native';

// Create a mock implementation of RNEncryptedStorage
const RNEncryptedStorageMock = {
  setItem: async (key, value) => {
    console.log('[RNEncryptedStorage Polyfill] setItem:', key);
    try {
      await AsyncStorage.setItem(key, value);
      return Promise.resolve();
    } catch (error) {
      console.error('[RNEncryptedStorage Polyfill] setItem error:', error);
      return Promise.reject(error);
    }
  },
  
  getItem: async (key) => {
    console.log('[RNEncryptedStorage Polyfill] getItem:', key);
    try {
      const value = await AsyncStorage.getItem(key);
      return Promise.resolve(value);
    } catch (error) {
      console.error('[RNEncryptedStorage Polyfill] getItem error:', error);
      return Promise.reject(error);
    }
  },
  
  removeItem: async (key) => {
    console.log('[RNEncryptedStorage Polyfill] removeItem:', key);
    try {
      await AsyncStorage.removeItem(key);
      return Promise.resolve();
    } catch (error) {
      console.error('[RNEncryptedStorage Polyfill] removeItem error:', error);
      return Promise.reject(error);
    }
  },
  
  clear: async () => {
    console.log('[RNEncryptedStorage Polyfill] clear');
    try {
      await AsyncStorage.clear();
      return Promise.resolve();
    } catch (error) {
      console.error('[RNEncryptedStorage Polyfill] clear error:', error);
      return Promise.reject(error);
    }
  }
};

// Check if the native module exists, otherwise use our mock
let RNEncryptedStorage;

try {
  // First check if it's already defined globally
  if (global.RNEncryptedStorage) {
    console.log('[RNEncryptedStorage] Using existing global instance');
    RNEncryptedStorage = global.RNEncryptedStorage;
  } 
  // Then check if the native module is available
  else if (NativeModules.RNEncryptedStorage) {
    console.log('[RNEncryptedStorage] Using native module');
    RNEncryptedStorage = NativeModules.RNEncryptedStorage;
  } 
  // Otherwise use our mock implementation
  else {
    console.log('[RNEncryptedStorage] Using AsyncStorage fallback - data will not be encrypted');
    RNEncryptedStorage = RNEncryptedStorageMock;
  }
} catch (error) {
  console.error('[RNEncryptedStorage] Error initializing:', error);
  console.log('[RNEncryptedStorage] Using AsyncStorage fallback due to error');
  RNEncryptedStorage = RNEncryptedStorageMock;
}

// Expose the module globally
global.RNEncryptedStorage = RNEncryptedStorage;

export default RNEncryptedStorage;