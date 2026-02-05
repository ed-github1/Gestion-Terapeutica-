# 🚀 Quick Start Guide - WebRTC Video Calls

## ⚡ 3-Minute Setup

### Step 1: Add Routes to App.jsx

Open `src/App.jsx` and add these imports at the top:

```jsx
// Add these imports with your other imports
import PatientVideoCallWebRTC from './features/patient/PatientVideoCallWebRTC'
import ProfessionalVideoCallWebRTC from './features/professional/VideoCallWebRTC'
```

Then add these routes in your `<Routes>` section:

```jsx
{/* WebRTC Video Call Routes - Add these */}
<Route 
  path="/patient/video-call/:appointmentId" 
  element={
    <ProtectedRoute allowedRoles={[ROLES.PATIENT, ROLES.PACIENT]}>
      <PatientVideoCallWebRTC />
    </ProtectedRoute>
  } 
/>

<Route 
  path="/professional/video-call/:appointmentId" 
  element={
    <ProtectedRoute allowedRoles={[ROLES.HEALTH_PROFESSIONAL, ROLES.PROFESSIONAL]}>
      <ProfessionalVideoCallWebRTC />
    </ProtectedRoute>
  } 
/>
```

### Step 2: Update .env

Add to your `.env` file:

```env
VITE_SOCKET_URL=http://localhost:3000
VITE_VIDEO_SYSTEM=webrtc
```

### Step 3: Start Your Backend

Make sure your backend with WebRTC endpoints is running:

```bash
cd ../GestionTerapeutica-Backend
npm run dev
```

### Step 4: Test It!

Navigate to a video call:
- **Patient:** `/patient/video-call/[appointmentId]`
- **Professional:** `/professional/video-call/[appointmentId]`

---

## 🎯 Usage in Your Components

### From Appointment List (Professional)

```jsx
import { useNavigate } from 'react-router-dom';

function AppointmentItem({ appointment }) {
  const navigate = useNavigate();

  const handleStartVideoCall = () => {
    navigate(`/professional/video-call/${appointment.id}`);
  };

  return (
    <button onClick={handleStartVideoCall}>
      📹 Iniciar Videollamada
    </button>
  );
}
```

### From Patient Dashboard

```jsx
function PatientAppointments({ appointments }) {
  const navigate = useNavigate();

  const handleJoinCall = (appointmentId) => {
    navigate(`/patient/video-call/${appointmentId}`);
  };

  return (
    <button onClick={() => handleJoinCall(appointment.id)}>
      📹 Unirse a Sesión
    </button>
  );
}
```

---

## 🎨 Features You Get

### For Everyone:
- ✅ HD Video & Audio
- ✅ Mute/Unmute controls
- ✅ Camera on/off
- ✅ Real-time chat
- ✅ Fullscreen mode
- ✅ Draggable local video
- ✅ Call duration timer

### For Professionals:
- ✅ End session button
- ✅ Session notes
- ✅ Participant monitoring

---

## 🐛 Quick Troubleshooting

### No video/audio?
1. Allow browser permissions for camera/mic
2. Check if devices are connected
3. Try a different browser

### Can't connect?
1. Ensure backend is running
2. Check `.env` has correct `VITE_SOCKET_URL`
3. Verify firewall isn't blocking connections

### Socket disconnects?
1. Check network stability
2. Look at browser console for errors
3. Verify backend Socket.IO is running

---

## 📊 What Happens Behind the Scenes

```
1. User clicks "Join Call"
   ↓
2. useWebRTC hook initializes WebRTCManager
   ↓
3. Fetches ICE servers from backend
   ↓
4. Connects to Socket.IO signaling server
   ↓
5. Joins room via REST API (auth check)
   ↓
6. Gets local camera/microphone
   ↓
7. Joins room via Socket.IO
   ↓
8. Creates peer connections with other participants
   ↓
9. Exchanges offers/answers/ICE candidates
   ↓
10. Video streams start flowing! 🎉
```

---

## 🔧 Advanced Usage

### Access WebRTC Manager Directly

```jsx
import { useWebRTC } from '../../hooks/useWebRTC';

function MyComponent() {
  const { manager } = useWebRTC();

  // Access low-level APIs
  const info = manager?.getLocalStreamInfo();
  const streams = manager?.getRemoteStreams();
}
```

### Custom Event Handling

```jsx
const { manager } = useWebRTC();

useEffect(() => {
  if (manager) {
    // Add custom callback
    manager.onConnectionStateChange = ({ userId, state }) => {
      console.log(`User ${userId} connection: ${state}`);
      // Show notification, update UI, etc.
    };
  }
}, [manager]);
```

---

## 📚 API Summary

### useWebRTC Hook

```jsx
const {
  // State
  isInitialized,      // WebRTC ready?
  isConnecting,       // Joining room?
  isInRoom,           // In active call?
  localStream,        // Your video/audio
  remoteStreams,      // Others' video/audio
  participants,       // List of users
  chatMessages,       // Chat history
  error,              // Error object
  isAudioEnabled,     // Mic on/off
  isVideoEnabled,     // Camera on/off
  
  // Actions
  joinRoom(id),       // Join a call
  leaveRoom(),        // Leave call
  endRoom(id),        // End for everyone (pro)
  toggleAudio(),      // Mute/unmute
  toggleVideo(),      // Camera on/off
  sendMessage(msg),   // Send chat
  getRoomStatus(id),  // Check room
  
  // Advanced
  manager             // Direct access
} = useWebRTC();
```

---

## 🎉 You're Ready!

Everything is set up and ready to use. Just add the routes to `App.jsx` and start making video calls!

**Questions?** Check [WEBRTC_INTEGRATION.md](./WEBRTC_INTEGRATION.md) for detailed documentation.
