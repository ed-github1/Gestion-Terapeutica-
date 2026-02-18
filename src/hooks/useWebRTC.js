/**
 * React Hook for WebRTC Video Calls
 * Provides easy integration of WebRTC functionality in React components
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import WebRTCManager from '../services/webrtc/WebRTCManager';
import { useAuth } from '../features/auth';

export const useWebRTC = () => {
  const { user, token } = useAuth();
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isInRoom, setIsInRoom] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const [remoteStreamsVersion, setRemoteStreamsVersion] = useState(0);
  const [participants, setParticipants] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [error, setError] = useState(null);
  const [connectionState, setConnectionState] = useState('disconnected');
  
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  
  const webrtcManagerRef = useRef(null);
  const currentRoomIdRef = useRef(null);

  /**
   * Initialize WebRTC Manager
   */
  const initialize = useCallback(async () => {
    console.log('useWebRTC initialize called - isInitialized:', isInitialized, 'user:', user, 'token:', token);
    if (isInitialized || !user || !token) {
      console.log('useWebRTC initialize skipped - isInitialized:', isInitialized, 'hasUser:', !!user, 'hasToken:', !!token);
      return;
    }

    try {
      console.log('useWebRTC initializing...');
      // Use production backend if in production environment
      const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
      const API_URL = import.meta.env.VITE_API_URL || (isProduction ? 'https://totalmentegestionterapeutica.onrender.com/api' : 'http://localhost:3000/api');
      const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (isProduction ? 'https://totalmentegestionterapeutica.onrender.com' : 'http://localhost:3000');

      const userId = user.id || user._id;
      const userName = user.name || user.nombre || 'Usuario';
      const userRole = user.role || user.rol || 'patient';

      console.log('WebRTC config:', { API_URL, SOCKET_URL, userId, userName, userRole });

      const manager = new WebRTCManager({
        apiUrl: API_URL,
        socketUrl: SOCKET_URL,
        userToken: token,
        userId: userId,
        userName: userName,
        userRole: userRole
      });

      // Setup event callbacks
      manager.onRemoteStreamAdded = ({ userId, stream }) => {
        console.log('Remote stream added:', userId);
        setRemoteStreams(prev => {
          // Skip if the same stream is already set for this user
          if (prev.get(userId) === stream) return prev;
          const newMap = new Map(prev);
          newMap.set(userId, stream);
          return newMap;
        });
        setRemoteStreamsVersion(v => v + 1);
      };

      manager.onRemoteStreamRemoved = ({ userId }) => {
        console.log('Remote stream removed:', userId);
        setRemoteStreams(prev => {
          if (!prev.has(userId)) return prev;
          const newMap = new Map(prev);
          newMap.delete(userId);
          return newMap;
        });
        setRemoteStreamsVersion(v => v + 1);
      };

      manager.onUserJoined = ({ userId, userName, role }) => {
        console.log('User joined:', userName);
        setParticipants(prev => [...prev, { userId, userName, role }]);
      };

      manager.onUserLeft = ({ userId, userName }) => {
        console.log('User left:', userName);
        setParticipants(prev => prev.filter(p => p.userId !== userId));
      };

      manager.onChatMessage = ({ userId, userName, message, timestamp }) => {
        const currentUserId = user.id || user._id;
        setChatMessages(prev => [...prev, {
          userId,
          userName,
          message,
          timestamp,
          isOwn: userId === currentUserId
        }]);
      };

      manager.onMediaStateChanged = ({ userId, userName, audio, video }) => {
        setParticipants(prev => prev.map(p =>
          p.userId === userId
            ? { ...p, audioEnabled: audio, videoEnabled: video }
            : p
        ));
      };

      manager.onRoomEnded = ({ message }) => {
        console.log('Room ended:', message);
        setIsInRoom(false);
        setError({ type: 'info', message });
      };

      manager.onError = (err) => {
        console.error('WebRTC Error:', err);
        setError({ type: 'error', message: err.message || 'Error en la videollamada' });
      };

      manager.onConnectionStateChange = ({ userId, state }) => {
        console.log(`Connection state for ${userId}:`, state);
        setConnectionState(state);
      };

      await manager.initialize();
      
      webrtcManagerRef.current = manager;
      setIsInitialized(true);
      
      console.log('WebRTC Manager initialized');
    } catch (err) {
      console.error('Failed to initialize WebRTC:', err);
      setError({ type: 'error', message: 'Error al inicializar videollamada' });
      throw err;
    }
  }, [user, token, isInitialized]);

  /**
   * Join a video room
   */
  const joinRoom = useCallback(async (appointmentId) => {
    if (!webrtcManagerRef.current) {
      throw new Error('WebRTC Manager not initialized');
    }

    try {
      setIsConnecting(true);
      setError(null);
      
      const room = await webrtcManagerRef.current.joinRoom(appointmentId);
      
      // Get local stream
      const stream = webrtcManagerRef.current.localStream;
      setLocalStream(stream);
      
      currentRoomIdRef.current = room.roomId;
      setIsInRoom(true);
      setIsConnecting(false);
      
      return room;
    } catch (err) {
      setIsConnecting(false);
      setError({ type: 'error', message: err.message });
      throw err;
    }
  }, []);

  /**
   * Leave the current room
   */
  const leaveRoom = useCallback(() => {
    if (!webrtcManagerRef.current) return;

    webrtcManagerRef.current.leaveRoom();
    
    setIsInRoom(false);
    setLocalStream(null);
    setRemoteStreams(new Map());
    setRemoteStreamsVersion(0);
    setParticipants([]);
    setChatMessages([]);
    currentRoomIdRef.current = null;
  }, []);

  /**
   * End room (Professional only)
   */
  const endRoom = useCallback(async (appointmentId) => {
    if (!webrtcManagerRef.current) return;

    try {
      await webrtcManagerRef.current.endRoom(appointmentId);
      leaveRoom();
    } catch (err) {
      setError({ type: 'error', message: err.message });
      throw err;
    }
  }, [leaveRoom]);

  /**
   * Toggle audio (mute/unmute)
   */
  const toggleAudio = useCallback(() => {
    if (!webrtcManagerRef.current) return;

    const enabled = webrtcManagerRef.current.toggleAudio();
    setIsAudioEnabled(enabled);
    return enabled;
  }, []);

  /**
   * Toggle video (camera on/off)
   */
  const toggleVideo = useCallback(() => {
    if (!webrtcManagerRef.current) return;

    const enabled = webrtcManagerRef.current.toggleVideo();
    setIsVideoEnabled(enabled);
    return enabled;
  }, []);

  /**
   * Send chat message
   */
  const sendMessage = useCallback((message) => {
    if (!webrtcManagerRef.current) return;

    webrtcManagerRef.current.sendChatMessage(message);
    
    // Add to own messages
    const userId = user.id || user._id;
    setChatMessages(prev => [...prev, {
      userId: userId,
      userName: 'Tú',
      message,
      timestamp: new Date().toISOString(),
      isOwn: true
    }]);
  }, [user]);

  /**
   * Get room status
   */
  const getRoomStatus = useCallback(async (appointmentId) => {
    if (!webrtcManagerRef.current) return null;

    try {
      return await webrtcManagerRef.current.getRoomStatus(appointmentId);
    } catch (err) {
      setError({ type: 'error', message: err.message });
      throw err;
    }
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (webrtcManagerRef.current) {
        webrtcManagerRef.current.disconnect();
      }
    };
  }, []);

  /**
   * Auto-initialize when user and token are available
   */
  useEffect(() => {
    if (user && token && !isInitialized) {
      initialize();
    }
  }, [user, token, isInitialized, initialize]);

  // Memoize the remote streams array so it only changes when streams actually change
  const remoteStreamsArray = useMemo(() => {
    return Array.from(remoteStreams.entries()).map(([userId, stream]) => ({
      userId,
      stream
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remoteStreamsVersion]);

  return {
    // State
    isInitialized,
    isConnecting,
    isInRoom,
    localStream,
    remoteStreams: remoteStreamsArray,
    participants,
    chatMessages,
    error,
    connectionState,
    isAudioEnabled,
    isVideoEnabled,
    
    // Methods
    initialize,
    joinRoom,
    leaveRoom,
    endRoom,
    toggleAudio,
    toggleVideo,
    sendMessage,
    getRoomStatus,
    
    // Manager reference (for advanced usage)
    manager: webrtcManagerRef.current
  };
};

export default useWebRTC;
