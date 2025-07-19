import { Text, View, StyleSheet, Button, Alert, TouchableOpacity, SafeAreaView } from 'react-native';
import React, { useState } from 'react';
import { TextInput } from 'react-native-paper';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function HomePage({navigation}) {
  const [name, setName] = useState('');
  const [callId, setCallId] = useState('');
  const insets = useSafeAreaInsets();

  const handleGoBack = () => {
    navigation.goBack();
  };

  const headerStyle = {
    ...styles.header,
    paddingTop: insets.top > 0 ? insets.top : 16,
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={headerStyle}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Join Video Call</Text>
        <View style={styles.headerRight} />
      </View>
      <View style={styles.container}>
        <TextInput style={styles.input}
          placeholder="Enter Your name" onChangeText={e => setName(e)}
          placeholderTextColor="#888"
        />
        <TextInput style={styles.input}
          placeholder="Enter Your number" onChangeText={e => setCallId(e)}
          placeholderTextColor="#888"
        />
        <Button
          title="Join Call" onPress={() => {
            if (!name.trim() || !callId.trim()) {
              Alert.alert('Error', 'Please enter both your name and call ID');
              return;
            }
            navigation.navigate('CallPage', {data: name, id: callId});
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  safeArea: {
    flex: 1,
    backgroundColor: '#0a0a2a',
    paddingTop: 0,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a2a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#0a0a2a',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 0, 255, 0.2)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerRight: {
    width: 40, // To balance the header layout
  },
  input: {
    height: 40,
    margin: 10,
    width: '90%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 10,
    color: '#fff',
  },
});

export default HomePage;
