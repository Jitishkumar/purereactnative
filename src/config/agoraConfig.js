// Agora SDK Configuration

// Replace with your actual Agora App ID from the Agora Console
// You'll need to sign up at https://www.agora.io/ and create a project
export const AGORA_APP_ID = '4793f6d88da346fb91a1efb6981c95dd';

/**
 * Generates a random channel name for Agora video calls
 * @returns {string} A unique channel name
 */
export const generateChannelName = () => {
  return 'channel-' + Math.floor(Math.random() * 10000000);
};

/**
 * Generates a random UID for the local user
 * @returns {number} A random UID
 */
export const generateUid = () => {
  return Math.floor(Math.random() * 100000);
};

/**
 * Video call states
 */
export const CALL_STATES = {
  IDLE: 'idle',
  SEARCHING: 'searching',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ERROR: 'error',
};

/**
 * Default video call settings
 */
export const DEFAULT_SETTINGS = {
  enableAudio: true,
  enableVideo: true,
  enableBeauty: false,
  beautyOptions: {
    lighteningContrastLevel: 1,
    lighteningLevel: 0.7,
    smoothnessLevel: 0.5,
    rednessLevel: 0.1,
  },
  videoEncoderConfig: {
    width: 640,
    height: 360,
    frameRate: 15,
    bitrate: 600,
  },
};
