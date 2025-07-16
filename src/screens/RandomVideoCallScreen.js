import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Image, Platform, PermissionsAndroid } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../config/supabase';
import VideoCallService from '../services/VideoCallService';
import { CALL_STATES, AGORA_APP_ID } from '../config/agoraConfig';

// Import Agora SDK
import {
  createAgoraRtcEngine,
  RtcSurfaceView,
  ChannelProfileType,
  ClientRoleType,
  VideoRenderMode,
  VideoMirrorMode,
} from 'react-native-agora';

const RandomVideoCallScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const [callState, setCallState] = useState(CALL_STATES.IDLE);
  const [remoteUser, setRemoteUser] = useState(null);
  const [channelName, setChannelName] = useState('');
  const [localUid, setLocalUid] = useState(null);
  const [joinSucceed, setJoinSucceed] = useState(false);
  const [remoteUid, setRemoteUid] = useState(null);
  const [micMuted, setMicMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);

  // This will be initialized after installing Agora SDK
  const rtcEngine = useRef(null);

  // Request permissions (Android)
  const requestPermissions = useCallback(async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.CAMERA,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);
        if (
          granted[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED &&
          granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED
        ) {
          console.log('Permissions granted');
          return true;
        } else {
          console.log('Permissions denied');
          Alert.alert('Permissions Required', 'Camera and microphone permissions are required for video calls.');
          return false;
        }
      } catch (err) {
        console.warn(err);
        return false;
      }
    } else {
      return true; // iOS handles permissions differently
    }
  }, []);

  // Initialize Agora engine
  const initializeAgoraEngine = useCallback(async () => {
    try {
      // Initialize the Agora engine with the App ID
      rtcEngine.current = createAgoraRtcEngine();
      rtcEngine.current.initialize({ appId: AGORA_APP_ID });

      // Register event handlers before joining a channel
      const eventHandler = {
        onJoinChannelSuccess: onJoinChannelSuccess,
        onUserJoined: onUserJoined,
        onUserOffline: onUserOffline,
        onError: onError,
      };

      rtcEngine.current.registerEventHandler(eventHandler);

      // Enable video and audio after initialization
      await rtcEngine.current.enableVideo();
      await rtcEngine.current.enableAudio();

      console.log('Agora engine initialized');
    } catch (error) {
      console.error('Failed to initialize Agora engine:', error);
      Alert.alert('Error', 'Failed to initialize video call. Please try again.');
    }
  }, [onJoinChannelSuccess, onUserJoined, onUserOffline, onError]);


  // Event handlers for Agora events
  const onJoinChannelSuccess = useCallback((connection, elapsed) => {
    console.log('Successfully joined channel:', connection.channelId, connection.localUid, elapsed);
    setJoinSucceed(true);
    // Start preview after joining channel successfully
    rtcEngine.current.startPreview();
  }, []);

  const onUserJoined = useCallback((connection, uid, elapsed) => {
    console.log('Remote user joined:', connection.channelId, uid, elapsed);
    setRemoteUid(uid);
  }, []);

  const onError = useCallback((err, msg) => {
    console.error('Agora error:', err, msg);
    Alert.alert('Error', `Video call error: ${msg}`);
    setCallState(CALL_STATES.ERROR);
  }, [setCallState]);


  // Join an Agora channel
  const joinChannel = useCallback(async () => {
    try {
      // Join the Agora channel
      await rtcEngine.current.joinChannel(null, channelName, localUid, {
        // Set channel profile to communication for video calls
        channelProfile: ChannelProfileType.ChannelProfileCommunication,
        // Set user role to broadcaster
        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
        // Publish audio collected by the microphone
        publishMicrophoneTrack: true,
        // Publish video collected by the camera
        publishCameraTrack: true,
        // Automatically subscribe to all audio streams
        autoSubscribeAudio: true,
        // Automatically subscribe to all video streams
        autoSubscribeVideo: true,
      });
      console.log('Joining channel:', channelName);
      setCallState(CALL_STATES.CONNECTING);
    } catch (error) {
      console.error('Error joining channel:', error);
      Alert.alert('Error', 'Failed to join video call. Please try again.');
      setCallState(CALL_STATES.ERROR);
    }
  }, [channelName, localUid, setCallState]);

  // Search for a random user to call
  const searchForRandomUser = useCallback(async () => {
    try {
      // Check permissions first
      const permissionsGranted = await requestPermissions();
      if (!permissionsGranted) {return;}

      setCallState(CALL_STATES.SEARCHING);

      // Use the VideoCallService to find a random user
      const result = await VideoCallService.findRandomUser();

      if (result) {
        // Found a match
        setRemoteUser(result.matchedUser);
        setChannelName(result.channelName);
        setLocalUid(result.localUid);
        setCallState(CALL_STATES.CONNECTING);

        // We need to wait for state updates before joining channel
        setTimeout(() => {
          joinChannel();
        }, 0);
      } else {
        // No users available, keep searching
        // Poll for available users every 3 seconds
        const searchInterval = setInterval(async () => {
          if (callState !== CALL_STATES.SEARCHING) {
            clearInterval(searchInterval);
            return;
          }

          const newResult = await VideoCallService.findRandomUser();
          if (newResult) {
            clearInterval(searchInterval);
            setRemoteUser(newResult.matchedUser);
            setChannelName(newResult.channelName);
            setLocalUid(newResult.localUid);
            setCallState(CALL_STATES.CONNECTING);

            // We need to wait for state updates before joining channel
            setTimeout(() => {
              joinChannel();
            }, 0);
          }
        }, 3000);

        // Stop searching after 30 seconds if no match is found
        setTimeout(() => {
          if (callState === CALL_STATES.SEARCHING) {
            clearInterval(searchInterval);
            Alert.alert('No users found', 'No users are available for video call right now. Please try again later.');
            setCallState(CALL_STATES.IDLE);
          }
        }, 30000);
      }
    } catch (error) {
      console.error('Error finding random user:', error);
      Alert.alert('Error', 'Failed to connect to a random user. Please try again.');
      setCallState(CALL_STATES.ERROR);
    }
  }, [callState, joinChannel, requestPermissions, setCallState, setChannelName, setLocalUid, setRemoteUser]);

  // End the current call
  const endCall = useCallback(async () => {
    try {
      // Leave the Agora channel
      if (rtcEngine.current) {
        // Stop preview before leaving channel
        rtcEngine.current.stopPreview();
        await rtcEngine.current.leaveChannel();
      }

      // Update user status in database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await VideoCallService.endCall(user.id);
      }

      // Reset state
      setCallState(CALL_STATES.IDLE);
      setRemoteUser(null);
      setChannelName('');
      setLocalUid(null);
      setJoinSucceed(false);
      setRemoteUid(null);

      // If we're leaving the screen, navigate back
      if (route.params?.goBackOnEnd) {
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error ending call:', error);
    }
  }, [navigation, route.params?.goBackOnEnd]);

  // Define onUserOffline after endCall to avoid circular dependency
  const onUserOffline = useCallback((uid, reason) => {
    console.log('Remote user left:', uid, reason);
    setRemoteUid(null);
    // End call if remote user leaves
    endCall();
  }, [endCall]);

  // Toggle microphone mute
  const toggleMute = useCallback(async () => {
    try {
      await rtcEngine.current.enableLocalAudio(!micMuted);
      setMicMuted(!micMuted);
    } catch (error) {
      console.error('Error toggling mute:', error);
    }
  }, [micMuted]);

  // Toggle camera
  const toggleCamera = useCallback(async () => {
    try {
      await rtcEngine.current.enableLocalVideo(!cameraOff);
      setCameraOff(!cameraOff);
    } catch (error) {
      console.error('Error toggling camera:', error);
    }
  }, [cameraOff]);

  // Switch camera between front and back
  const switchCamera = useCallback(async () => {
    try {
      await rtcEngine.current.switchCamera();
    } catch (error) {
      console.error('Error switching camera:', error);
    }
  }, []);

  // Initialize component
  useEffect(() => {
    const init = async () => {
      await initializeAgoraEngine();
    };

    init();

    // Cleanup function
    return () => {
      if (rtcEngine.current) {
        // Stop preview and leave channel before destroying
        rtcEngine.current.stopPreview();
        rtcEngine.current.leaveChannel();

        // Unregister event handler and release engine
        // No need to call removeAllListeners as we're using registerEventHandler
        rtcEngine.current.release();
      }

      // Make sure to end the call if the component unmounts
      if (callState === CALL_STATES.CONNECTED || callState === CALL_STATES.CONNECTING) {
        endCall();
      }
    };
  }, [callState, endCall, initializeAgoraEngine]);

  // Render loading state
  if (callState === CALL_STATES.IDLE && !joinSucceed && !remoteUid) {
    return (
      <LinearGradient
        colors={['#000033', '#000066']}
        style={[styles.container, { paddingTop: insets.top }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Random Video Call</Text>
        </View>

        {/* Start Call UI */}
        <View style={styles.searchContainer}>
          <LinearGradient
            colors={['#ff00ff', '#9900ff']}
            style={styles.searchButton}
          >
            <TouchableOpacity onPress={searchForRandomUser} style={styles.searchButtonInner}>
              <Ionicons name="videocam" size={28} color="#fff" />
              <Text style={styles.searchButtonText}>Start Random Video Call</Text>
            </TouchableOpacity>
          </LinearGradient>
          <Text style={styles.infoText}>Connect with random users from around the world!</Text>
          <Text style={styles.infoText}>Make sure your camera and microphone are working.</Text>
        </View>
      </LinearGradient>
    );
  }

  // Render searching state
  if (callState === CALL_STATES.SEARCHING) {
    return (
      <LinearGradient
        colors={['#000033', '#000066']}
        style={[styles.container, { paddingTop: insets.top }]}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => {
            setCallState(CALL_STATES.IDLE);
            navigation.goBack();
          }} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Random Video Call</Text>
        </View>

        <View style={styles.searchingContainer}>
          <ActivityIndicator size="large" color="#ff00ff" />
          <Text style={styles.searchingText}>Searching for a random user...</Text>
          <Text style={styles.searchingSubText}>This may take a moment</Text>

          <TouchableOpacity
            onPress={() => setCallState(CALL_STATES.IDLE)}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  // Render connecting state
  if (callState === CALL_STATES.CONNECTING && !joinSucceed) {
    return (
      <LinearGradient
        colors={['#000033', '#000066']}
        style={[styles.container, { paddingTop: insets.top }]}
      >
        <View style={styles.connectingContainer}>
          <ActivityIndicator size="large" color="#ff00ff" />
          <Text style={styles.connectingText}>Connecting to {remoteUser?.username || 'user'}...</Text>
        </View>
      </LinearGradient>
    );
  }

  // Render connected state (video call UI)
  return (
    <LinearGradient
      colors={['#000033', '#000066']}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      {/* Remote User Video */}
      <View style={styles.remoteVideo}>
        {remoteUid ? (
          // When connected, show the remote video
          <RtcSurfaceView
            canvas={{
              uid: remoteUid,
              renderMode: VideoRenderMode.Hidden,
              mirrorMode: VideoMirrorMode.Auto,
            }}
            style={styles.videoPlaceholder}
          />
        ) : (
          // When waiting for remote user, show placeholder
          <LinearGradient
            colors={['#333366', '#000033']}
            style={styles.videoPlaceholder}
          >
            <Text style={styles.waitingText}>Waiting for user to join...</Text>
          </LinearGradient>
        )}

        {/* Remote User Info */}
        {remoteUid && (
          <View style={styles.remoteUserInfo}>
            <Image
              source={{ uri: remoteUser?.avatar_url || 'https://via.placeholder.com/40' }}
              style={styles.remoteUserAvatar}
            />
            <Text style={styles.remoteUserName}>{remoteUser?.username || 'User'}</Text>
          </View>
        )}
      </View>

      {/* Local User Video */}
      <View style={styles.localVideo}>
        {joinSucceed ? (
          // When joined, show the local video
          <RtcSurfaceView
            canvas={{
              uid: 0,
              renderMode: VideoRenderMode.Hidden,
              mirrorMode: VideoMirrorMode.Enabled, // For front camera
            }}
            style={styles.videoPlaceholder}
            zOrderMediaOverlay={true}
          />
        ) : (
          // When not joined, show placeholder
          <LinearGradient
            colors={['#333366', '#000033']}
            style={styles.videoPlaceholder}
          >
            <Text style={styles.placeholderText}>You</Text>
            {cameraOff && (
              <Ionicons name="videocam-off" size={24} color="#ffffff80" />
            )}
          </LinearGradient>
        )}
      </View>

      {/* Call Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity onPress={toggleMute} style={styles.controlButton}>
          <LinearGradient
            colors={micMuted ? ['#ff0000', '#cc0000'] : ['#333366', '#000033']}
            style={styles.controlButtonInner}
          >
            <Ionicons name={micMuted ? 'mic-off' : 'mic'} size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={endCall} style={styles.endCallButton}>
          <LinearGradient
            colors={['#ff0000', '#cc0000']}
            style={styles.endCallButtonInner}
          >
            <Ionicons name="call" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={toggleCamera} style={styles.controlButton}>
          <LinearGradient
            colors={cameraOff ? ['#ff0000', '#cc0000'] : ['#333366', '#000033']}
            style={styles.controlButtonInner}
          >
            <Ionicons name={cameraOff ? 'videocam-off' : 'videocam'} size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={switchCamera} style={styles.controlButton}>
          <LinearGradient
            colors={['#333366', '#000033']}
            style={styles.controlButtonInner}
          >
            <Ionicons name="camera-reverse" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000033',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  searchButton: {
    borderRadius: 25,
    overflow: 'hidden',
    marginBottom: 20,
  },
  searchButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 25,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  infoText: {
    color: '#ffffff80',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
  searchingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  searchingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
  },
  searchingSubText: {
    color: '#ffffff80',
    fontSize: 14,
    marginTop: 10,
  },
  cancelButton: {
    marginTop: 30,
    padding: 10,
  },
  cancelButtonText: {
    color: '#ff00ff',
    fontSize: 16,
  },
  connectingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectingText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 20,
  },
  remoteVideo: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  localVideo: {
    width: 120,
    height: 180,
    position: 'absolute',
    top: 70,
    right: 20,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fff',
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#ffffff80',
    fontSize: 16,
  },
  connectedText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  waitingText: {
    color: '#ffffff80',
    fontSize: 16,
  },
  remoteUserInfo: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 20,
  },
  remoteUserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  remoteUserName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
  },
  controlButtonInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  endCallButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
  },
  endCallButtonInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default RandomVideoCallScreen;
