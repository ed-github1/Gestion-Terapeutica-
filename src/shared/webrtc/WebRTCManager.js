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
    this.onReconnecting = null;
    this.onReconnectFailed = null;
    this.onRecordingStateChanged = null;
    this.onRecordingAuthorized = null;
    
    // Track state
    this.isAudioEnabled = true;
    this.isVideoEnabled = true;
    this.isRecording = false;
    this._reconnectAttempts = 0;
    this._maxReconnectAttempts = 3;
    this._disconnectTimers = new Map(); // userId -> timeout for grace period
    this._peerReconnectAttempts = new Map(); // userId -> count
    this._maxPeerReconnectAttempts = 3;
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
      const response = await fetch(`${this.apiUrl}/rtc/ice-servers`, {
        headers: {
          'Authorization': `Bearer ${this.userToken}`
        }
      });
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
      
      // Timeout: resolve anyway after 8s so the UI doesn't hang forever
      const timeout = setTimeout(() => {
        console.warn('Socket registration timed out — proceeding without signaling');
        resolve();
      }, 8000);

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

        // If we were in a room, re-join after reconnect
        if (this._reconnectAttempts > 0 && this.currentRoomId) {
          console.log(`Reconnected — re-joining room ${this.currentRoomId} (attempt ${this._reconnectAttempts})`);
          this.socket.emit('join-room', {
            roomId: this.currentRoomId,
            userId: this.userId,
            userName: this.userName,
            role: this.userRole,
          });
          this._reconnectAttempts = 0;
          if (this.onReconnecting) this.onReconnecting({ reconnecting: false });
        }
      });

      this.socket.on('registered', (data) => {
        console.log('User registered:', data);
        clearTimeout(timeout);
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        if (this.currentRoomId) {
          this._reconnectAttempts++;
          console.warn(`Reconnect attempt ${this._reconnectAttempts}/${this._maxReconnectAttempts}`);
          if (this.onReconnecting) this.onReconnecting({ reconnecting: true, attempt: this._reconnectAttempts });
          if (this._reconnectAttempts >= this._maxReconnectAttempts) {
            console.error('Max reconnect attempts reached — giving up');
            if (this.onReconnectFailed) this.onReconnectFailed();
            this.cleanup();
          }
        }
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

    // Recording state events from server
    this.socket.on('recording-started', ({ roomId }) => {
      console.log('Recording started for room:', roomId);
      this.isRecording = true;
      if (this.onRecordingStateChanged) {
        this.onRecordingStateChanged({ isRecording: true });
      }
    });

    this.socket.on('recording-stopped', ({ roomId }) => {
      console.log('Recording stopped for room:', roomId);
      this.isRecording = false;
      if (this.onRecordingStateChanged) {
        this.onRecordingStateChanged({ isRecording: false });
      }
    });

    this.socket.on('recording-authorized', ({ roomId }) => {
      console.log('Recording authorized for room:', roomId);
      if (this.onRecordingAuthorized) {
        this.onRecordingAuthorized({ roomId });
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
    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from signaling server:', reason);
      // If the server kicked us or transport closed while in a room, start tracking reconnects
      if (this.currentRoomId && reason !== 'io client disconnect') {
        this._reconnectAttempts = 0;
        if (this.onReconnecting) this.onReconnecting({ reconnecting: true, attempt: 0 });
      }
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
   * Join a video call room via /rtc/rooms/join.
   */
  async joinRoom(appointmentId, { recordingConsent = false } = {}) {
    try {
      const response = await fetch(`${this.apiUrl}/rtc/rooms/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.userToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ appointmentId, recordingConsent })
      });

      if (!response.ok) {
        const text = await response.text();
        let errorMsg = `Error del servidor (${response.status})`;
        try {
          const parsed = JSON.parse(text);
          errorMsg = parsed.error || parsed.message || errorMsg;
          if (parsed.details) {
            console.error('Server error details:', parsed.details);
          }
        } catch { /* not JSON */ }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'No se pudo unir a la sala');
      }

      this.currentRoomId = data.room.roomId;

      // Get local media — non-fatal so the room join still completes
      try {
        await this.getLocalStream();
      } catch (mediaError) {
        console.warn('Could not access camera/microphone:', mediaError.message);
        // Continue without local media — user can grant permission later
      }

      // Join room via Socket.IO
      if (this.socket?.connected) {
        this.socket.emit('join-room', {
          roomId: this.currentRoomId,
          userId: this.userId,
          userName: this.userName,
          role: this.userRole,
          recordingConsent,
        });
      }

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
      if (event.candidate && this.socket) {
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

      // Monitor each remote track for ended/mute events
      remoteStream.getTracks().forEach(track => {
        track.onended = () => {
          console.warn(`Remote ${track.kind} track ended from ${targetUserId}`);
          // If all tracks in the stream are ended, trigger reconnection
          const allEnded = remoteStream.getTracks().every(t => t.readyState === 'ended');
          if (allEnded) {
            console.warn(`All remote tracks ended for ${targetUserId}, attempting reconnection`);
            this._attemptPeerReconnect(targetUserId);
          }
        };
        track.onmute = () => {
          console.log(`Remote ${track.kind} track muted from ${targetUserId}`);
        };
        track.onunmute = () => {
          console.log(`Remote ${track.kind} track unmuted from ${targetUserId}`);
        };
      });
      
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

      if (pc.connectionState === 'connected') {
        // Clear any pending disconnect timer — connection recovered
        this._clearDisconnectTimer(targetUserId);
        this._peerReconnectAttempts.delete(targetUserId);
      } else if (pc.connectionState === 'disconnected') {
        // Grace period: WebRTC often self-recovers from 'disconnected'
        this._startDisconnectTimer(targetUserId, 8000);
      } else if (pc.connectionState === 'failed') {
        // Failed is terminal — attempt reconnection immediately
        this._clearDisconnectTimer(targetUserId);
        this._attemptPeerReconnect(targetUserId);
      }
    };

    // Handle ICE connection state
    pc.oniceconnectionstatechange = () => {
      console.log(`ICE connection state with ${targetUserId}:`, pc.iceConnectionState);
      if (pc.iceConnectionState === 'failed') {
        // ICE failed — try ICE restart before full reconnection
        console.warn(`ICE failed for ${targetUserId}, attempting ICE restart`);
        pc.restartIce();
        // Re-create offer with iceRestart flag
        this._sendIceRestartOffer(targetUserId, pc);
      }
    };

    this.peerConnections.set(targetUserId, pc);
    return pc;
  }

  /**
   * Create and send offer to target user
   */
  async createOffer(targetUserId) {
    if (!this.socket) return;
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
    if (!this.socket) return;
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
  async endRoom(appointmentId, { sessionNotes } = {}) {
    try {
      const response = await fetch(`${this.apiUrl}/rtc/rooms/${appointmentId}/end`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.userToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sessionNotes: sessionNotes || '' })
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
   * Start recording (Professional only).
   * Emits socket event; backend starts the media server recorder.
   */
  async startRecording(appointmentId) {
    if (!this.currentRoomId) throw new Error('Not in a room');
    this.socket.emit('start-recording', {
      roomId: this.currentRoomId,
      appointmentId,
    });
  }

  /**
   * Stop recording.
   */
  async stopRecording(appointmentId) {
    if (!this.currentRoomId) throw new Error('Not in a room');
    this.socket.emit('stop-recording', {
      roomId: this.currentRoomId,
      appointmentId,
    });
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
   * Start a grace-period timer before cleaning up a disconnected peer.
   */
  _startDisconnectTimer(userId, delayMs) {
    // Don't stack timers
    this._clearDisconnectTimer(userId);
    const timer = setTimeout(() => {
      const pc = this.peerConnections.get(userId);
      // If still disconnected after the grace period, attempt reconnection
      if (pc && (pc.connectionState === 'disconnected' || pc.connectionState === 'failed')) {
        console.warn(`Peer ${userId} still disconnected after ${delayMs}ms grace period — reconnecting`);
        this._attemptPeerReconnect(userId);
      }
      this._disconnectTimers.delete(userId);
    }, delayMs);
    this._disconnectTimers.set(userId, timer);
  }

  /**
   * Clear a pending disconnect grace timer.
   */
  _clearDisconnectTimer(userId) {
    const timer = this._disconnectTimers.get(userId);
    if (timer) {
      clearTimeout(timer);
      this._disconnectTimers.delete(userId);
    }
  }

  /**
   * Attempt to reconnect a specific peer connection.
   */
  _attemptPeerReconnect(userId) {
    const attempts = (this._peerReconnectAttempts.get(userId) || 0) + 1;
    this._peerReconnectAttempts.set(userId, attempts);

    if (attempts > this._maxPeerReconnectAttempts) {
      console.error(`Max reconnect attempts (${this._maxPeerReconnectAttempts}) reached for peer ${userId}`);
      this.cleanupPeerConnection(userId);
      return;
    }

    console.log(`Reconnecting to peer ${userId} (attempt ${attempts}/${this._maxPeerReconnectAttempts})`);

    // Tear down old connection
    const oldPc = this.peerConnections.get(userId);
    if (oldPc) {
      oldPc.onconnectionstatechange = null;
      oldPc.oniceconnectionstatechange = null;
      oldPc.ontrack = null;
      oldPc.onicecandidate = null;
      oldPc.close();
      this.peerConnections.delete(userId);
    }

    // Notify UI that we're reconnecting
    if (this.onConnectionStateChange) {
      this.onConnectionStateChange({ userId, state: 'reconnecting' });
    }

    // Create a fresh offer to the peer
    this.createOffer(userId);
  }

  /**
   * Send a new offer with ICE restart flag after ICE failure.
   */
  async _sendIceRestartOffer(targetUserId, pc) {
    try {
      const offer = await pc.createOffer({ iceRestart: true });
      await pc.setLocalDescription(offer);
      if (!this.socket) return;
      this.socket.emit('offer', {
        roomId: this.currentRoomId,
        offer,
        targetUserId,
      });
      console.log('Sent ICE restart offer to:', targetUserId);
    } catch (err) {
      console.error('ICE restart offer failed:', err);
      // Fall back to full reconnection
      this._attemptPeerReconnect(targetUserId);
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
    // Clear all disconnect grace timers
    this._disconnectTimers.forEach(timer => clearTimeout(timer));
    this._disconnectTimers.clear();
    this._peerReconnectAttempts.clear();

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
