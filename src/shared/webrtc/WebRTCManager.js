/**
 * WebRTC Video Call Manager
 * Handles WebRTC peer connections, Socket.IO signaling, and media management
 */

import { io } from 'socket.io-client';

class WebRTCManager {
  constructor(config = {}) {
    this.apiUrl = config.apiUrl || 'http://localhost:3000/api';
    this.socketUrl = config.socketUrl || 'http://localhost:3000';
    this.userToken = config.userToken || '';
    this.userId = config.userId || '';
    this.userName = config.userName || '';
    this.userRole = config.userRole || '';
    
    // State
    this.socket = null;
    this.currentRoomId = null;
    this.localStream = null;
    this.iceServers = [];
    this.peerConnections = new Map(); // userId -> RTCPeerConnection
    this.remoteStreams = new Map(); // userId -> MediaStream
    
    // Event callbacks
    this.onRemoteStreamAdded = null;
    this.onRemoteStreamRemoved = null;
    this.onUserJoined = null;
    this.onUserLeft = null;
    this.onChatMessage = null;
    this.onMediaStateChanged = null;
    this.onRoomEnded = null;
    this.onError = null;
    this.onConnectionStateChange = null;
    
    // Track state
    this.isAudioEnabled = true;
    this.isVideoEnabled = true;
  }

  /**
   * Initialize connection and fetch ICE servers
   */
  async initialize() {
    try {
      // Fetch ICE servers
      await this.fetchIceServers();
      
      // Connect to Socket.IO
      await this.connectSocket();
      
      return { success: true };
    } catch (error) {
      console.error('Failed to initialize WebRTC:', error);
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Fetch STUN/TURN servers configuration
   */
  async fetchIceServers() {
    try {
      const response = await fetch(`${this.apiUrl}/rtc/ice-servers`);
      const data = await response.json();
      
      if (data.success) {
        this.iceServers = data.iceServers;
        console.log('ICE servers loaded:', this.iceServers);
      }
    } catch (error) {
      console.error('Failed to fetch ICE servers, using fallback:', error);
      // Fallback to Google's STUN server
      this.iceServers = [{ urls: 'stun:stun.l.google.com:19302' }];
    }
  }

  /**
   * Connect to Socket.IO signaling server
   */
  connectSocket() {
    return new Promise((resolve, reject) => {
      // Connect to the /webrtc namespace
      const socketUrl = `${this.socketUrl}/webrtc`;
      
      this.socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        withCredentials: true,
        auth: {
          token: this.userToken
        }
      });

      this.socket.on('connect', () => {
        console.log('Connected to signaling server');
        
        // Register user
        this.socket.emit('register', {
          userId: this.userId,
          userName: this.userName,
          role: this.userRole
        });
      });

      this.socket.on('registered', (data) => {
        console.log('User registered:', data);
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        reject(error);
      });

      // Setup event listeners
      this.setupSocketListeners();
    });
  }

  /**
   * Setup all Socket.IO event listeners
   */
  setupSocketListeners() {
    // Room joined
    this.socket.on('room-joined', async ({ roomId, users }) => {
      console.log('Joined room:', roomId, 'Users:', users);
      
      // Don't create offers to existing users - wait for them to send offers
      // This prevents "glare" condition where both peers send offers simultaneously
      // Existing users will receive 'user-joined' event and create offers
    });

    // New user joined
    this.socket.on('user-joined', async ({ userId, userName, role }) => {
      console.log(`${userName} joined the room`);
      
      if (this.onUserJoined) {
        this.onUserJoined({ userId, userName, role });
      }
      
      // Existing users create offer to new user
      await this.createOffer(userId);
    });

    // User left
    this.socket.on('user-left', ({ userId, userName }) => {
      console.log(`${userName} left the room`);
      
      if (this.onUserLeft) {
        this.onUserLeft({ userId, userName });
      }
      
      this.cleanupPeerConnection(userId);
    });

    // Receive offer
    this.socket.on('offer', async ({ offer, fromUserId, fromUserName }) => {
      console.log('Received offer from:', fromUserName);
      await this.handleOffer(offer, fromUserId);
    });

    // Receive answer
    this.socket.on('answer', async ({ answer, fromUserId, fromUserName }) => {
      console.log('Received answer from:', fromUserName);
      await this.handleAnswer(answer, fromUserId);
    });

    // Receive ICE candidate
    this.socket.on('ice-candidate', async ({ candidate, fromUserId }) => {
      await this.handleIceCandidate(candidate, fromUserId);
    });

    // User media state changed
    this.socket.on('user-media-state-changed', ({ userId, userName, audio, video }) => {
      console.log(`${userName} - Audio: ${audio}, Video: ${video}`);
      
      if (this.onMediaStateChanged) {
        this.onMediaStateChanged({ userId, userName, audio, video });
      }
    });

    // Chat message
    this.socket.on('chat-message', ({ userId, userName, message, timestamp }) => {
      if (this.onChatMessage) {
        this.onChatMessage({ userId, userName, message, timestamp });
      }
    });

    // Room ended
    this.socket.on('room-ended', ({ roomId, message }) => {
      console.log('Room ended:', message);
      
      if (this.onRoomEnded) {
        this.onRoomEnded({ roomId, message });
      }
      
      this.cleanup();
    });

    // Error
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.handleError(error);
    });

    // Disconnect
    this.socket.on('disconnect', () => {
      console.log('Disconnected from signaling server');
    });
  }

  /**
   * Get local media stream (camera/microphone)
   */
  async getLocalStream(constraints = {
    video: {
      width: { ideal: 1280, max: 1920 },
      height: { ideal: 720, max: 1080 },
      aspectRatio: { ideal: 16/9 },
      frameRate: { ideal: 30, max: 60 },
      facingMode: 'user'
    },
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 48000
    }
  }) {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Local stream acquired');
      return this.localStream;
    } catch (error) {
      console.error('Failed to get local stream:', error);
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Join a video call room
   */
  async joinRoom(appointmentId) {
    try {
      // 1. Join via REST API (authorization check)
      const response = await fetch(`${this.apiUrl}/rtc/rooms/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.userToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ appointmentId })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to join room');
      }

      this.currentRoomId = data.room.roomId;

      // 2. Get local media
      await this.getLocalStream();

      // 3. Join room via Socket.IO
      this.socket.emit('join-room', {
        roomId: this.currentRoomId,
        userId: this.userId,
        userName: this.userName,
        role: this.userRole
      });

      console.log('Joined room:', this.currentRoomId);
      return data.room;
    } catch (error) {
      console.error('Failed to join room:', error);
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Create RTCPeerConnection for a target user
   */
  createPeerConnection(targetUserId) {
    const pc = new RTCPeerConnection({
      iceServers: this.iceServers
    });

    // Add local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream);
      });
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit('ice-candidate', {
          roomId: this.currentRoomId,
          candidate: event.candidate,
          targetUserId: targetUserId
        });
      }
    };

    // Handle remote stream — ontrack fires once per track (audio + video),
    // so we deduplicate by checking if the stream is already stored.
    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      if (!remoteStream) return;
      
      // Only notify once per unique stream
      const existing = this.remoteStreams.get(targetUserId);
      if (existing?.id === remoteStream.id) return;
      
      console.log('Received remote track from:', targetUserId);
      this.remoteStreams.set(targetUserId, remoteStream);
      
      if (this.onRemoteStreamAdded) {
        this.onRemoteStreamAdded({ userId: targetUserId, stream: remoteStream });
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log(`Connection state with ${targetUserId}:`, pc.connectionState);
      
      if (this.onConnectionStateChange) {
        this.onConnectionStateChange({ 
          userId: targetUserId, 
          state: pc.connectionState 
        });
      }
      
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        this.cleanupPeerConnection(targetUserId);
      }
    };

    // Handle ICE connection state
    pc.oniceconnectionstatechange = () => {
      console.log(`ICE connection state with ${targetUserId}:`, pc.iceConnectionState);
    };

    this.peerConnections.set(targetUserId, pc);
    return pc;
  }

  /**
   * Create and send offer to target user
   */
  async createOffer(targetUserId) {
    try {
      const pc = this.createPeerConnection(targetUserId);

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });

      await pc.setLocalDescription(offer);

      this.socket.emit('offer', {
        roomId: this.currentRoomId,
        offer: offer,
        targetUserId: targetUserId
      });

      console.log('Sent offer to:', targetUserId);
    } catch (error) {
      console.error('Failed to create offer:', error);
      this.handleError(error);
    }
  }

  /**
   * Handle incoming offer
   */
  async handleOffer(offer, fromUserId) {
    try {
      const pc = this.createPeerConnection(fromUserId);

      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      this.socket.emit('answer', {
        roomId: this.currentRoomId,
        answer: answer,
        targetUserId: fromUserId
      });

      console.log('Sent answer to:', fromUserId);
    } catch (error) {
      console.error('Failed to handle offer:', error);
      this.handleError(error);
    }
  }

  /**
   * Handle incoming answer
   */
  async handleAnswer(answer, fromUserId) {
    try {
      const pc = this.peerConnections.get(fromUserId);

      if (!pc) {
        console.error('No peer connection found for:', fromUserId);
        return;
      }

      // Check if we're in the right state to accept an answer
      // Ignore answer if we're already stable (prevents "wrong state" error)
      if (pc.signalingState === 'stable') {
        console.log('Ignoring answer - already in stable state for:', fromUserId);
        return;
      }

      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      console.log('Set remote description for:', fromUserId);
    } catch (error) {
      console.error('Failed to handle answer:', error);
      this.handleError(error);
    }
  }

  /**
   * Handle ICE candidate
   */
  async handleIceCandidate(candidate, fromUserId) {
    try {
      const pc = this.peerConnections.get(fromUserId);

      if (!pc) {
        console.error('No peer connection found for:', fromUserId);
        return;
      }

      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Failed to handle ICE candidate:', error);
      this.handleError(error);
    }
  }

  /**
   * Toggle audio (mute/unmute)
   */
  toggleAudio() {
    if (!this.localStream) return false;

    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      this.isAudioEnabled = audioTrack.enabled;

      // Notify others
      this.socket.emit('media-state-change', {
        roomId: this.currentRoomId,
        audio: this.isAudioEnabled,
        video: this.isVideoEnabled
      });

      return this.isAudioEnabled;
    }
    
    return false;
  }

  /**
   * Toggle video (camera on/off)
   */
  toggleVideo() {
    if (!this.localStream) return false;

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      this.isVideoEnabled = videoTrack.enabled;

      // Notify others
      this.socket.emit('media-state-change', {
        roomId: this.currentRoomId,
        audio: this.isAudioEnabled,
        video: this.isVideoEnabled
      });

      return this.isVideoEnabled;
    }
    
    return false;
  }

  /**
   * Send chat message
   */
  sendChatMessage(message) {
    if (!this.currentRoomId || !message.trim()) return;

    this.socket.emit('chat-message', {
      roomId: this.currentRoomId,
      message: message.trim()
    });
  }

  /**
   * Leave the current room
   */
  leaveRoom() {
    if (!this.currentRoomId) return;

    // Notify server
    this.socket.emit('leave-room', {
      roomId: this.currentRoomId
    });

    this.cleanup();
  }

  /**
   * End room (Professional only)
   */
  async endRoom(appointmentId) {
    try {
      const response = await fetch(`${this.apiUrl}/rtc/rooms/${appointmentId}/end`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.userToken}`
        }
      });

      const data = await response.json();

      if (data.success) {
        console.log('Room ended successfully');
      }

      return data;
    } catch (error) {
      console.error('Failed to end room:', error);
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Get room status
   */
  async getRoomStatus(appointmentId) {
    try {
      const response = await fetch(`${this.apiUrl}/rtc/rooms/${appointmentId}`, {
        headers: {
          'Authorization': `Bearer ${this.userToken}`
        }
      });

      return await response.json();
    } catch (error) {
      console.error('Failed to get room status:', error);
      throw error;
    }
  }

  /**
   * Clean up specific peer connection
   */
  cleanupPeerConnection(userId) {
    // Close peer connection
    const pc = this.peerConnections.get(userId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(userId);
    }

    // Remove remote stream
    if (this.remoteStreams.has(userId)) {
      this.remoteStreams.delete(userId);
      
      if (this.onRemoteStreamRemoved) {
        this.onRemoteStreamRemoved({ userId });
      }
    }
  }

  /**
   * Clean up all resources
   */
  cleanup() {
    // Close all peer connections
    this.peerConnections.forEach(pc => pc.close());
    this.peerConnections.clear();

    // Clear remote streams
    this.remoteStreams.clear();

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    this.currentRoomId = null;
    
    console.log('Cleanup completed');
  }

  /**
   * Disconnect socket and cleanup
   */
  disconnect() {
    this.cleanup();
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Handle errors
   */
  handleError(error) {
    if (this.onError) {
      this.onError(error);
    }
  }

  /**
   * Get local stream info
   */
  getLocalStreamInfo() {
    if (!this.localStream) return null;
    
    return {
      audioEnabled: this.isAudioEnabled,
      videoEnabled: this.isVideoEnabled,
      audioTracks: this.localStream.getAudioTracks().length,
      videoTracks: this.localStream.getVideoTracks().length
    };
  }

  /**
   * Get all remote streams
   */
  getRemoteStreams() {
    return Array.from(this.remoteStreams.entries()).map(([userId, stream]) => ({
      userId,
      stream
    }));
  }
}

export default WebRTCManager;
