/**
 * Polyfill for react-native-encrypted-storage
 * This provides a fallback implementation when the native module is not available
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

class EncryptedStoragePolyfill {
  async setItem(key, value) {
    try {
      console.warn('EncryptedStorage: Using AsyncStorage fallback - data will not be encrypted');
      await AsyncStorage.setItem(key, value);
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async getItem(key) {
    try {
      console.warn('EncryptedStorage: Using AsyncStorage fallback - data is not encrypted');
      const value = await AsyncStorage.getItem(key);
      return Promise.resolve(value);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async removeItem(key) {
    try {
      console.warn('EncryptedStorage: Using AsyncStorage fallback - data is not encrypted');
      await AsyncStorage.removeItem(key);
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async clear() {
    try {
      console.warn('EncryptedStorage: Using AsyncStorage fallback - data is not encrypted');
      await AsyncStorage.clear();
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  }
}

export default new EncryptedStoragePolyfill();
