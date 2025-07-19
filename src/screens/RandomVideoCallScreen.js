import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  ZegoUIKitPrebuiltCall,
  ONE_ON_ONE_VIDEO_CALL_CONFIG,
  GROUP_VIDEO_CALL_CONFIG
} from '@zegocloud/zego-uikit-prebuilt-call-rn';

const RandomVideoCallScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [callId, setCallId] = useState('');
  const [isInCall, setIsInCall] = useState(false);

  const handleJoinCall = () => {
    if (name.trim() === '' || callId.trim() === '') {
      alert('Please enter your name and call ID');
      return;
    }
    setIsInCall(true);
  };

  const handleBackPress = () => {
    if (isInCall) {
      setIsInCall(false);
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a0a2a', '#1a1a3a']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={[styles.header, { paddingTop: insets.top }]}
      >
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isInCall ? 'Video Call' : 'Join Call'}</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      {!isInCall ? (
        <LinearGradient
          colors={['#1a1a3a', '#0d0d2a']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.content}
        >
          <View style={styles.formContainer}>
            <Text style={styles.label}>Enter Your Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Your name"
              placeholderTextColor="#666"
              value={name}
              onChangeText={setName}
            />
            
            <Text style={styles.label}>Enter Call ID</Text>
            <TextInput
              style={styles.input}
              placeholder="Call ID or room number"
              placeholderTextColor="#666"
              value={callId}
              onChangeText={setCallId}
            />
            
            <TouchableOpacity onPress={handleJoinCall}>
              <LinearGradient
                colors={['#ff00ff', '#9900ff']}
                style={styles.joinButton}
              >
                <Text style={styles.joinButtonText}>Join Call</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      ) : (
        <View style={styles.callContainer}>
          <ZegoUIKitPrebuiltCall
            appID={91100572}
            appSign={'700161538563620670267242f2c4c72f623bb13a09f02a36828f9545678d2340'}
            userID={name}
            userName={name}
            callID={callId}
            config={{
              ...GROUP_VIDEO_CALL_CONFIG,
              onCallEnd: () => {
                setIsInCall(false);
              },
            }}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a2a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    marginBottom: 20,
  },
  joinButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  callContainer: {
    flex: 1,
  },
});

export default RandomVideoCallScreen;