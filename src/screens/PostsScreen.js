import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'react-native-image-picker';
import Video from 'react-native-video';
// Removing unused import
// import { useNavigation } from '@react-navigation/native';
import { PostsService } from '../services/PostsService';
import { supabase } from '../config/supabase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

// Define CreatePostModal outside of the main component to avoid React's warning about unstable nested components
const CreatePostModal = ({
  visible,
  onClose,
  onCreatePost,
  selectedMedia,
  caption,
  setCaption,
  insets,
  modalContentPadding,
  disabled,
}) => (
  <Modal
    visible={visible}
    animationType="slide"
    transparent={true}
  >
    <View style={styles.modalContainer}>
      <View style={[styles.modalContent, modalContentPadding]}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.createPostButton, (!selectedMedia && !caption.trim()) && styles.disabledButton]}
            onPress={onCreatePost}
            disabled={disabled}
          >
            <Text style={styles.postButtonText}>Post</Text>
          </TouchableOpacity>
        </View>

        {selectedMedia && (
          <View style={styles.mediaPreview}>
            {selectedMedia.type === 'video' ? (
              <Video
                source={{ uri: selectedMedia.uri }}
                style={styles.previewMedia}
                resizeMode="cover"
                shouldPlay={false}
              />
            ) : (
              <Image
                source={{ uri: selectedMedia.uri }}
                style={styles.previewMedia}
                resizeMode="cover"
              />
            )}
          </View>
        )}

        <TextInput
          style={styles.captionInput}
          placeholder="Write a caption..."
          placeholderTextColor="#666"
          multiline
          value={caption}
          onChangeText={setCaption}
        />
      </View>
    </View>
  </Modal>
);

// Define CommentsModal outside of the main component to avoid React's warning about unstable nested components
const CommentsModal = ({
  visible,
  onClose,
  comments,
  commentText,
  setCommentText,
  onComment,
  insets,
  commentsHeaderPadding,
  commentInputPadding,
}) => (
  <Modal
    visible={visible}
    animationType="slide"
    transparent={false}
  >
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.commentsContainer}
    >
      <View style={[styles.commentsHeader, commentsHeaderPadding]}>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.commentsTitle}>Comments</Text>
      </View>

      <FlatList
        data={comments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.commentItem}>
            <Image
              source={{ uri: item.profiles.avatar_url || 'https://via.placeholder.com/150' }}
              style={styles.commentAvatar}
            />
            <View style={styles.commentContent}>
              <Text style={styles.commentUsername}>{item.profiles.username}</Text>
              <Text style={styles.commentText}>{item.content}</Text>
            </View>
          </View>
        )}
      />

      <View style={[styles.commentInput, commentInputPadding]}>
        <TextInput
          style={styles.input}
          placeholder="Add a comment..."
          placeholderTextColor="#666"
          value={commentText}
          onChangeText={setCommentText}
        />
        <TouchableOpacity
          onPress={onComment}
          disabled={!commentText.trim()}
        >
          <Text style={[styles.postButton, !commentText.trim() && styles.postButtonDisabled]}>
            Post
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  </Modal>
);

const PostsScreen = () => {
  const insets = useSafeAreaInsets();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  // Removing unused navigation variable
  // const navigation = useNavigation();

  // Font loading removed as it's not properly set up in this React Native project

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const data = await PostsService.getAllPosts();
      setPosts(data);
    } catch (error) {
      console.error('Error loading posts:', error);
      Alert.alert('Error', 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const [showPostModal, setShowPostModal] = useState(false);
  const [caption, setCaption] = useState('');
  const [selectedMedia, setSelectedMedia] = useState(null);
  const handleAddPost = async () => {
    try {
      // Check user authentication first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please login to create a post');
        return;
      }

      const result = await ImagePicker.launchImageLibrary({
        mediaTypes: ['images', 'videos'],
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        const type = uri.endsWith('.mp4') ? 'video' : 'image';
        setSelectedMedia({ uri, type });
        setShowPostModal(true);
      }
    } catch (error) {
      console.error('Error selecting media:', error);
      Alert.alert('Error', 'Failed to select media');
    }
  };

  const handleCreatePost = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please login to create a post');
        return;
      }

      if (!selectedMedia && !caption.trim()) {
        Alert.alert('Error', 'Please add some text or media to your post');
        return;
      }

      setUploading(true);
      if (selectedMedia) {
        await PostsService.createPost(selectedMedia.uri, caption.trim(), selectedMedia.type);
      } else {
        await PostsService.createPost(null, caption.trim(), 'text');
      }
      await loadPosts();
      setShowPostModal(false);
      setSelectedMedia(null);
      setCaption('');
      Alert.alert('Success', 'Post created successfully');
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', error.message || 'Failed to create post');
    } finally {
      setUploading(false);
    }
  };



  const handleLike = async (postId) => {
    try {
      // Not using the return value since we're refreshing posts anyway
      await PostsService.toggleLike(postId);
      // Refresh posts to get accurate like count
      const updatedPosts = await PostsService.getAllPosts();
      setPosts(updatedPosts);
    } catch (error) {
      console.error('Error toggling like:', error);
      Alert.alert('Error', 'Failed to update like');
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) {return;}

    try {
      const newComment = await PostsService.addComment(selectedPost.id, commentText.trim());
      setComments([...comments, newComment]);
      setCommentText('');
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment');
    }
  };

  const loadComments = async (postId) => {
    try {
      const data = await PostsService.getComments(postId);
      setComments(data);
    } catch (error) {
      console.error('Error loading comments:', error);
      Alert.alert('Error', 'Failed to load comments');
    }
  };

  const handleShowComments = (post) => {
    setSelectedPost(post);
    loadComments(post.id);
    setShowComments(true);
  };

  const renderPostItem = ({ item }) => (
    <View style={styles.postContainer}>
      <View style={styles.postHeader}>
        <Image
          source={{ uri: item.profiles.avatar_url || 'https://via.placeholder.com/150' }}
          style={styles.avatar}
        />
        <Text style={styles.username}>{item.profiles.username}</Text>
      </View>

      {item.type === 'video' ? (
        <Video
          source={{ uri: item.media_url }}
          style={styles.postMedia}
          resizeMode="cover"
          shouldPlay={false}
        />
      ) : (
        <Image
          source={{ uri: item.media_url }}
          style={styles.postMedia}
          resizeMode="cover"
        />
      )}

      <View style={styles.postActions}>
        <TouchableOpacity onPress={() => handleLike(item.id)}>
          <Ionicons
            name={item.is_liked ? 'heart' : 'heart-outline'}
            size={24}
            color={item.is_liked ? '#ff00ff' : '#fff'}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleShowComments(item)}>
          <Ionicons name="chatbubble-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.postFooter}>
        <Text style={styles.likes}>{item.likes?.length || 0} likes</Text>
        {item.caption && (
          <Text style={styles.caption}>
            <Text style={styles.username}>{item.profiles.username}</Text> {item.caption}
          </Text>
        )}
        <TouchableOpacity onPress={() => handleShowComments(item)}>
          <Text style={styles.viewComments}>
            View all {item.comments[0].count} comments
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );



  return (
    <View style={styles.container}>
      <CreatePostModal
        visible={showPostModal}
        onClose={() => {
          setShowPostModal(false);
          setSelectedMedia(null);
          setCaption('');
        }}
        onCreatePost={handleCreatePost}
        selectedMedia={selectedMedia}
        caption={caption}
        setCaption={setCaption}
        insets={insets}
        modalContentPadding={styles.modalContentPadding}
        disabled={!selectedMedia && !caption.trim()}
      />

      <LinearGradient
        colors={['#0a0a2a', '#1a1a3a']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={[styles.header, styles.headerPadding]}
      >
        <Text style={styles.headerTitle}>Feed</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddPost}
          disabled={uploading}
        >
          <LinearGradient
            colors={['#ff00ff', '#9900ff']}
            style={styles.iconBackground}
          >
            <Ionicons name="add-circle" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>

      {loading ? (
        <ActivityIndicator size="large" color="#ff00ff" style={styles.activitySpinner} />
      ) : (
        <FlatList
          data={posts}
          renderItem={renderPostItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyStateText}>No posts available</Text>
          }
        />
      )}

      {uploading && (
        <View style={styles.uploadingOverlay}>
          <ActivityIndicator size="small" color="#ff00ff" />
          <Text style={styles.uploadingText}>Creating post...</Text>
        </View>
      )}

      <CommentsModal
        visible={showComments}
        onClose={() => setShowComments(false)}
        comments={comments}
        commentText={commentText}
        setCommentText={setCommentText}
        onComment={handleComment}
        insets={insets}
        commentsHeaderPadding={styles.commentsHeaderPadding}
        commentInputPadding={styles.commentInputPadding}
      />
    </View>
  );
};

// Define styles outside of the component to make them accessible to all components
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050520',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginTop: Platform.OS === 'ios' ? 0 : 30,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 0, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#ff00ff',
    letterSpacing: 1,
    textShadowColor: 'rgba(255, 0, 255, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  addButton: {
    padding: 6,
  },
  iconBackground: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  postContainer: {
    marginBottom: 20,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  username: {
    color: '#fff',
    fontWeight: 'bold',
  },
  postMedia: {
    width: '100%',
    height: 400,
  },
  postActions: {
    flexDirection: 'row',
    padding: 10,
    gap: 15,
  },
  postFooter: {
    padding: 10,
  },
  likes: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  caption: {
    color: '#fff',
    marginBottom: 5,
  },
  viewComments: {
    color: '#666',
  },
  commentsContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  commentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#222',
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 15,
  },
  commentItem: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  commentAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  commentContent: {
    flex: 1,
  },
  commentUsername: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  commentText: {
    color: '#fff',
  },
  commentInput: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#222',
    backgroundColor: '#111',
  },
  input: {
    flex: 1,
    color: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  postButton: {
    color: '#ff00ff',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  postButtonDisabled: {
    color: '#666',
  },
  // Modal styles
  modalContentPadding: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  commentsHeaderPadding: {
    paddingTop: 50,
  },
  commentInputPadding: {
    paddingBottom: 10,
  },
  headerPadding: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  // New styles for post creation modal
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(13, 13, 42, 0.95)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a3a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: '50%',
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 255, 0.2)',
    shadowColor: '#6600cc',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  createPostButton: {
    backgroundColor: '#ff00ff',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  disabledButton: {
    backgroundColor: '#666',
  },
  postButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  mediaPreview: {
    width: '100%',
    height: 300,
    marginBottom: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  previewMedia: {
    width: '100%',
    height: '100%',
  },
  captionInput: {
    color: '#fff',
    fontSize: 16,
    minHeight: 100,
  },
  buttonDisabled: {
    color: '#666',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -70 }, { translateY: -40 }],
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 20,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  uploadingText: {
    color: '#fff',
    marginLeft: 10,
  },
  emptyStateText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
  activitySpinner: {
    marginTop: 20,
  },
});

export default PostsScreen;
