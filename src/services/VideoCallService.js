import { supabase } from '../config/supabase';
import { generateChannelName, generateUid } from '../config/agoraConfig';

/**
 * Service for handling random video calls
 */
class VideoCallService {
  /**
   * Find a random user to call
   * @returns {Promise<Object>} Object containing matched user and channel info
   */
  async findRandomUser() {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {throw new Error('User not authenticated');}

      // Set current user as available for matching
      await this.setUserAvailability(user.id, 'available');

      // Look for another available user
      // In a real implementation, you might want to add filters (age, gender, location, etc.)
      const { data: availableUsers, error } = await supabase
        .from('video_call_sessions')
        .select('user_id, profiles:user_id(username, avatar_url)')
        .eq('status', 'available')
        .neq('user_id', user.id)
        .limit(1);

      if (error) {throw error;}

      // If no available users, return null
      if (!availableUsers || availableUsers.length === 0) {
        return null;
      }

      // Found a match
      const matchedUser = availableUsers[0];
      const channelName = generateChannelName();

      // Update both users' statuses to 'busy' and set channel name
      await this.matchUsers(user.id, matchedUser.user_id, channelName);

      return {
        matchedUser: matchedUser.profiles,
        channelName,
        localUid: generateUid(),
      };
    } catch (error) {
      console.error('Error finding random user:', error);
      throw error;
    }
  }

  /**
   * Set user availability status for video calls
   * @param {string} userId - User ID
   * @param {string} status - Status ('available', 'busy', 'offline')
   */
  async setUserAvailability(userId, status) {
    try {
      // Check if user already has a session
      const { data: existingSession } = await supabase
        .from('video_call_sessions')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (existingSession) {
        // Update existing session
        await supabase
          .from('video_call_sessions')
          .update({
            status,
            channel_name: null,
            matched_with: null,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);
      } else {
        // Create new session
        await supabase
          .from('video_call_sessions')
          .insert({
            user_id: userId,
            status,
            channel_name: null,
            matched_with: null,
          });
      }
    } catch (error) {
      console.error('Error setting user availability:', error);
      throw error;
    }
  }

  /**
   * Match two users for a video call
   * @param {string} userId1 - First user ID
   * @param {string} userId2 - Second user ID
   * @param {string} channelName - Agora channel name
   */
  async matchUsers(userId1, userId2, channelName) {
    try {
      // Update first user
      await supabase
        .from('video_call_sessions')
        .update({
          status: 'busy',
          channel_name: channelName,
          matched_with: userId2,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId1);

      // Update second user
      await supabase
        .from('video_call_sessions')
        .update({
          status: 'busy',
          channel_name: channelName,
          matched_with: userId1,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId2);
    } catch (error) {
      console.error('Error matching users:', error);
      throw error;
    }
  }

  /**
   * End a video call
   * @param {string} userId - User ID
   */
  async endCall(userId) {
    try {
      // Get the current session to find the matched user
      const { data: currentSession } = await supabase
        .from('video_call_sessions')
        .select('matched_with')
        .eq('user_id', userId)
        .single();

      // Delete current user session
      await supabase
        .from('video_call_sessions')
        .delete()
        .eq('user_id', userId);

      // If there was a matched user, delete their session too
      if (currentSession?.matched_with) {
        await supabase
          .from('video_call_sessions')
          .delete()
          .eq('user_id', currentSession.matched_with);
      }
    } catch (error) {
      console.error('Error ending call:', error);
      throw error;
    }
  }

  /**
   * Generate a token for Agora channel
   * Note: In a production app, token generation should happen on the server
   * @param {string} channelName - Channel name
   * @param {number} uid - User ID
   * @returns {Promise<string>} Agora token
   */
  async generateToken(channelName, uid) {
    // In a real implementation, this would call your backend API
    // to generate a token using Agora's token server
    // For now, we'll return a placeholder
    return 'placeholder-token';
  }
}

export default new VideoCallService();
