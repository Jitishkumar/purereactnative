import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../config/supabase';

const MessagesScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);

  const fetchConversations = useCallback(async (userId) => {
    try {
      setLoading(true);

      // Get all messages where the user is either sender or receiver
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (messagesError) {throw messagesError;}

      // Group messages by conversation
      const conversationsMap = {};

      for (const message of messagesData) {
        // Determine the other user in the conversation
        const otherUserId = message.sender_id === userId ? message.receiver_id : message.sender_id;

        // Create a unique conversation ID
        const conversationId = [userId, otherUserId].sort().join('_');

        if (!conversationsMap[conversationId] ||
            new Date(message.created_at) > new Date(conversationsMap[conversationId].created_at)) {
          conversationsMap[conversationId] = {
            id: conversationId,
            otherUserId,
            lastMessage: message.content,
            created_at: message.created_at,
            unread: message.read === false && message.receiver_id === userId ? 1 : 0,
          };
        } else if (message.read === false && message.receiver_id === userId) {
          // Count unread messages
          conversationsMap[conversationId].unread += 1;
        }
      }

      // Get user profiles for all conversations
      const otherUserIds = Object.values(conversationsMap).map(conv => conv.otherUserId);

      if (otherUserIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .in('id', otherUserIds);

        if (profilesError) {throw profilesError;}

        // Add user profile info to conversations
        const conversationsWithProfiles = Object.values(conversationsMap).map(conv => {
          const profile = profiles.find(p => p.id === conv.otherUserId);

          // Process avatar URL
          let avatarUrl = null;
          if (profile && profile.avatar_url) {
            let avatarPath = profile.avatar_url;
            if (avatarPath.includes('media/media/')) {
              const parts = avatarPath.split('media/');
              avatarPath = parts[parts.length - 1];
            } else if (avatarPath.includes('media/')) {
              avatarPath = avatarPath.split('media/').pop();
            }
            avatarUrl = `https://lckhaysswueoyinhfzyz.supabase.co/storage/v1/object/public/media/${avatarPath}`;
          }

          return {
            ...conv,
            name: profile ? (profile.full_name || profile.username || 'User') : 'User',
            username: profile ? profile.username : null,
            avatar: avatarUrl || 'https://via.placeholder.com/50',
            // Calculate time display
            time: formatTimeAgo(new Date(conv.created_at)),
            online: false, // You could implement online status with presence channel
          };
        });

        // Sort by most recent message
        const sortedConversations = conversationsWithProfiles.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );

        setConversations(sortedConversations);
      } else {
        setConversations([]);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Get current user and fetch conversations
    const fetchUserAndConversations = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error('User not authenticated');
          navigation.navigate('Login');
          return;
        }

        setCurrentUserId(user.id);
        await fetchConversations(user.id);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    fetchUserAndConversations();
  }, [fetchConversations, navigation]);

  // Set up real-time subscription for new messages
  useEffect(() => {
    if (!currentUserId) {return;}

    const subscription = supabase
      .channel('messages_changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `sender_id=eq.${currentUserId}`, // Messages sent by current user
      }, () => {
        fetchConversations(currentUserId);
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${currentUserId}`, // Messages received by current user
      }, () => {
        fetchConversations(currentUserId);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [currentUserId, fetchConversations]);

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d`;
    } else {
      // Format as MM/DD/YY
      return `${date.getMonth() + 1}/${date.getDate()}/${String(date.getFullYear()).slice(2)}`;
    }
  };

  const navigateToChat = (conversation) => {
    navigation.navigate('MessageScreen', {
      recipientId: conversation.otherUserId,
      recipientName: conversation.name,
      recipientAvatar: conversation.avatar,
    });
  };

  const filteredConversations = searchQuery
    ? conversations.filter(conv =>
        conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (conv.username && conv.username.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : conversations;

  return (
    <View style={styles.container}>
      <View style={[styles.header, styles.headerPadding, insets.top > 0 && { paddingTop: insets.top }]}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff00ff" />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      ) : (
        <FlatList
          style={styles.messagesList}
          contentContainerStyle={{ paddingBottom: insets.bottom }}
          data={filteredConversations}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No conversations yet</Text>
              <Text style={styles.emptySubtext}>Start chatting with someone!</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              key={item.id}
              style={styles.messageItem}
              onPress={() => navigateToChat(item)}
            >
              <View style={styles.avatarContainer}>
                <Image source={{ uri: item.avatar }} style={styles.avatar} />
                {item.online && <View style={styles.onlineIndicator} />}
              </View>
              <View style={styles.messageContent}>
                <View style={styles.messageHeader}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.time}>{item.time}</Text>
                </View>
                <View style={styles.messageFooter}>
                  <Text style={styles.messageText} numberOfLines={1}>
                    {item.lastMessage}
                  </Text>
                  {item.unread > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{item.unread}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
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
    padding: 15,
  },
  headerPadding: {
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 15,
  },
  searchContainer: {
    margin: 15,
    position: 'relative',
  },
  searchInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 25,
    padding: 12,
    paddingLeft: 40,
    color: 'white',
  },
  searchIcon: {
    position: 'absolute',
    left: 15,
    top: 12,
  },
  messagesList: {
    flex: 1,
  },
  messageItem: {
    flexDirection: 'row',
    padding: 15,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#333',
  },
  onlineIndicator: {
    width: 12,
    height: 12,
    backgroundColor: '#4CAF50',
    borderRadius: 6,
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: '#000033',
  },
  messageContent: {
    flex: 1,
    marginLeft: 15,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  time: {
    color: '#666',
    fontSize: 12,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  messageText: {
    color: '#999',
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: '#ff00ff',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  unreadText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    marginTop: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptySubtext: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    marginTop: 8,
  },
});

export default MessagesScreen;
