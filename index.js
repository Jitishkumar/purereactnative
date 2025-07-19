/**
 * @format
 */

// IMPORTANT: Import RNEncryptedStorageModule first before any other imports
// This ensures the global.RNEncryptedStorage is available for all modules
import './src/utils/RNEncryptedStorageModule';

// Verify that RNEncryptedStorage is properly defined globally
console.log('[App Initialization] RNEncryptedStorage is defined:', !!global.RNEncryptedStorage);

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);
