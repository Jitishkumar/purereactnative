import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { supabase } from '../config/supabase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

const SettingsScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [privateAccount, setPrivateAccount] = useState(false);
  const [autoplay, setAutoplay] = useState(true);
  // dataLoaded state removed as it was unused

  const createDefaultSettings = useCallback(async (userId) => {
    try {
      const { error } = await supabase
        .from('user_settings')
        .insert({
          user_id: userId,
          dark_mode: true,
          notifications: true,
          private_account: false,
          autoplay: true,
        });

      if (error) {throw error;}
    } catch (error) {
      console.error('Error creating default settings:', error);
    }
  }, []);

  const loadUserSettings = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {return;}

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading settings:', error);
        return;
      }

      if (data) {
        setDarkMode(data.dark_mode ?? true);
        setNotifications(data.notifications ?? true);
        setPrivateAccount(data.private_account ?? false);
        setAutoplay(data.autoplay ?? true);
      } else {
        // Create default settings if none exist
        createDefaultSettings(user.id);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }, [createDefaultSettings, setDarkMode, setNotifications, setPrivateAccount, setAutoplay]);

  useEffect(() => {
    loadUserSettings();
  }, [loadUserSettings]);

  const updateSetting = async (setting, value) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {return;}

      const { error } = await supabase
        .from('user_settings')
        .update({ [setting]: value })
        .eq('user_id', user.id);

      if (error) {throw error;}
    } catch (error) {
      console.error(`Error updating ${setting}:`, error);
      Alert.alert('Error', `Failed to update ${setting}. Please try again.`);
    }
  };

  const handleDarkModeToggle = (value) => {
    setDarkMode(value);
    updateSetting('dark_mode', value);
  };

  const handleNotificationsToggle = (value) => {
    setNotifications(value);
    updateSetting('notifications', value);
  };

  const handlePrivateAccountToggle = (value) => {
    setPrivateAccount(value);
    updateSetting('private_account', value);
  };

  const handleAutoplayToggle = (value) => {
    setAutoplay(value);
    updateSetting('autoplay', value);
  };

  const renderSettingItem = (icon, title, description, value, onToggle) => (
    <View style={styles.settingItem}>
      <View style={styles.settingIconContainer}>
        <Ionicons name={icon} size={24} color="#ff00ff" />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#767577', true: '#ff00ff50' }}
        thumbColor={value ? '#ff00ff' : '#f4f3f4'}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#330033', '#000000']}
        style={[styles.header, styles.headerPadding, insets.top > 0 && { paddingTop: insets.top }]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#ff00ff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, styles.contentPadding, insets.bottom > 0 && { paddingBottom: insets.bottom }]}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          {renderSettingItem(
            'moon',
            'Dark Mode',
            'Enable dark theme for the app',
            darkMode,
            handleDarkModeToggle
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          {renderSettingItem(
            'lock-closed',
            'Private Account',
            'Only approved followers can see your content',
            privateAccount,
            handlePrivateAccountToggle
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          {renderSettingItem(
            'notifications',
            'Push Notifications',
            'Receive notifications for likes, comments, and follows',
            notifications,
            handleNotificationsToggle
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Content</Text>
          {renderSettingItem(
            'play-circle',
            'Autoplay Videos',
            'Automatically play videos while scrolling',
            autoplay,
            handleAutoplayToggle
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity style={styles.linkItem}>
            <View style={styles.settingIconContainer}>
              <Ionicons name="shield" size={24} color="#ff00ff" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Privacy Policy</Text>
              <Text style={styles.settingDescription}>Read our privacy policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ff00ff" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkItem}>
            <View style={styles.settingIconContainer}>
              <Ionicons name="document-text" size={24} color="#ff00ff" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Terms of Service</Text>
              <Text style={styles.settingDescription}>Read our terms of service</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ff00ff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkItem}
            onPress={() => {
              Alert.alert(
                'Delete Account',
                'Are you sure you want to delete your account? This action cannot be undone.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                      Alert.alert('Feature Coming Soon', 'Account deletion will be available in a future update.');
                    },
                  },
                ]
              );
            }}
          >
            <View style={styles.settingIconContainer}>
              <Ionicons name="trash" size={24} color="#ff3b30" />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, styles.deleteText]}>Delete Account</Text>
              <Text style={styles.settingDescription}>Permanently delete your account and data</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ff3b30" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerPadding: {
    paddingTop: 50,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  contentPadding: {
    paddingBottom: 20,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#111',
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionTitle: {
    color: '#ff00ff',
    fontSize: 16,
    fontWeight: 'bold',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  deleteText: {
    color: '#ff3b30',
  },
  settingDescription: {
    color: '#999',
    fontSize: 14,
    marginTop: 4,
  },
});

export default SettingsScreen;
