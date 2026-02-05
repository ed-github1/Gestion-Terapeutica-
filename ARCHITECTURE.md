# 🏗️ WebRTC System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐      ┌───────────────────┐            │
│  │  Patient Video   │      │ Professional Video│            │
│  │   Call Page      │      │    Call Page      │            │
│  └────────┬─────────┘      └─────────┬─────────┘            │
│           │                          │                       │
│           └──────────┬───────────────┘                       │
│                      │                                       │
│              ┌───────▼────────┐                              │
│              │  useWebRTC     │  (React Hook)                │
│              │     Hook       │                              │
│              └───────┬────────┘                              │
│                      │                                       │
│              ┌───────▼────────┐                              │
│              │  WebRTCManager │  (Core Service)              │
│              │    Service     │                              │
│              └───────┬────────┘                              │
│                      │                                       │
│         ┌────────────┼────────────┐                          │
│         │            │            │                          │
│    ┌────▼────┐  ┌───▼───┐  ┌────▼─────┐                    │
│    │WebRTC   │  │Socket │  │   REST   │                    │
│    │ Peer    │  │  IO   │  │   API    │                    │
│    │Connect  │  │Client │  │  Client  │                    │
│    └────┬────┘  └───┬───┘  └────┬─────┘                    │
└─────────┼──────────┼───────────┼──────────────────────────┘
          │          │           │
          │          │           │ HTTPS
          │          │ WebSocket │
          │          │           │
┌─────────▼──────────▼───────────▼──────────────────────────┐
│                    Backend Server                           │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐      ┌─────────────────┐                  │
│  │   REST API   │      │   Socket.IO     │                  │
│  │  /api/rtc/*  │      │  Signaling      │                  │
│  └──────┬───────┘      └────────┬────────┘                  │
│         │                       │                            │
│         └──────────┬────────────┘                            │
│                    │                                         │
│           ┌────────▼─────────┐                               │
│           │  Room Manager    │                               │
│           └────────┬─────────┘                               │
│                    │                                         │
│           ┌────────▼─────────┐                               │
│           │    Database      │                               │
│           │  (Appointments)  │                               │
│           └──────────────────┘                               │
└─────────────────────────────────────────────────────────────┘
          │
          │ STUN/TURN
          │
┌─────────▼─────────┐
│  ICE Servers      │
│  (Google STUN)    │
│  (TURN - Optional)│
└───────────────────┘
```

---

## Data Flow

### 1. Initialization Flow

```
User Opens Page
       │
       ▼
useWebRTC Hook Loads
       │
       ▼
WebRTCManager Created
       │
       ├──► Fetch ICE Servers (REST API)
       │
       └──► Connect Socket.IO
              │
              ▼
         Register User (Socket Event)
              │
              ▼
         User Ready ✅
```

### 2. Join Room Flow

```
Click "Join Call"
       │
       ▼
POST /api/rtc/rooms/join (Auth)
       │
       ▼
Get Local Media (getUserMedia)
       │
       ▼
Socket.emit('join-room')
       │
       ▼
Receive 'room-joined' event
       │
       ├──► List of users in room
       │
       └──► Create Offer for each user
              │
              ▼
         WebRTC Negotiation Begins
```

### 3. WebRTC Negotiation Flow

```
User A (Existing)                    User B (New)
       │                                    │
       │◄─────── 'user-joined' ─────────────│
       │                                    │
       ├─ Create Offer                     │
       │                                    │
       ├───────── offer ──────────────────►│
       │                                    │
       │                              Set Remote Desc
       │                              Create Answer
       │                                    │
       │◄──────── answer ───────────────────┤
       │                                    │
  Set Remote Desc                           │
       │                                    │
       ├─── ICE Candidate ────────────────►│
       │                                    │
       │◄─── ICE Candidate ─────────────────┤
       │                                    │
       │         Connection Established     │
       │◄──────────────────────────────────►│
       │                                    │
    Stream Audio/Video              Stream Audio/Video
```

### 4. Media Control Flow

```
User Clicks "Mute"
       │
       ▼
toggleAudio() in Hook
       │
       ▼
manager.toggleAudio()
       │
       ├──► Disable Audio Track
       │
       └──► Socket.emit('media-state-change')
              │
              ▼
         Other Users Receive Event
              │
              ▼
         Update UI (Show Muted Icon)
```

### 5. Leave Room Flow

```
User Clicks "Leave"
       │
       ▼
leaveRoom() Hook
       │
       ▼
Socket.emit('leave-room')
       │
       ▼
Close All Peer Connections
       │
       ▼
Stop Local Media Tracks
       │
       ▼
Cleanup State
       │
       ▼
Navigate Away
```

---

## Component Hierarchy

```
App
 │
 ├─ AuthProvider
 │   │
 │   ├─ PatientVideoCallWebRTC
 │   │   │
 │   │   └─ useWebRTC Hook
 │   │       │
 │   │       └─ WebRTCManager
 │   │           │
 │   │           ├─ Socket.IO Connection
 │   │           ├─ Multiple RTCPeerConnections
 │   │           └─ MediaStreams
 │   │
 │   └─ ProfessionalVideoCallWebRTC
 │       │
 │       └─ useWebRTC Hook
 │           │
 │           └─ (Same as above)
 │
 └─ Other Routes...
```

---

## File Structure

```
src/
├── services/
│   ├── api.js                    (Existing)
│   ├── videoCall.js              (Updated with RTC endpoints)
│   └── webrtc/
│       ├── WebRTCManager.js      (NEW - Core WebRTC logic)
│       └── index.js              (NEW - Exports)
│
├── hooks/
│   ├── useWebRTC.js              (NEW - React hook wrapper)
│   └── useVideoCallNotifications.js (Existing)
│
├── features/
│   ├── patient/
│   │   ├── PatientVideoCall.jsx       (Existing Twilio)
│   │   └── PatientVideoCallWebRTC.jsx (NEW - WebRTC version)
│   │
│   └── professional/
│       ├── VideoCall.jsx              (Existing Twilio)
│       └── VideoCallWebRTC.jsx        (NEW - WebRTC version)
│
└── App.jsx (Need to add routes)
```

---

## Technology Stack

### Frontend
- **React 19** - UI Framework
- **Socket.IO Client** - Real-time signaling
- **WebRTC APIs** - P2P video/audio
- **Framer Motion** - Animations
- **Tailwind CSS** - Styling
- **React Router** - Navigation

### Backend (Expected)
- **Node.js + Express** - API Server
- **Socket.IO** - Signaling server
- **PostgreSQL** - Database
- **JWT** - Authentication

### Protocols
- **HTTPS** - Secure HTTP (required for WebRTC)
- **WebSocket** - Socket.IO transport
- **WebRTC** - P2P media streaming
- **STUN/TURN** - NAT traversal

---

## Key Features by Component

### WebRTCManager.js
- Socket.IO connection management
- Peer connection lifecycle
- ICE candidate handling
- Offer/answer negotiation
- Media stream management
- Event broadcasting

### useWebRTC.js
- React state integration
- Automatic initialization
- Callback management
- Participant tracking
- Chat message handling
- Error management

### PatientVideoCallWebRTC.jsx
- Video display
- Media controls UI
- Chat interface
- Draggable local video
- Fullscreen mode

### ProfessionalVideoCallWebRTC.jsx
- All patient features +
- Session ending capability
- Session notes
- Participant monitoring

---

## Network Ports & Protocols

```
Frontend ─────► Backend
   :5173        :3000

Protocols:
- HTTPS (443/3000)
- WebSocket (443/3000)
- WebRTC/UDP (Random high ports)
- STUN (3478/19302)
- TURN (3478) [Optional]
```

---

## State Management

```
WebRTCManager (Service Layer)
├── socket: Socket.IO connection
├── currentRoomId: string
├── localStream: MediaStream
├── peerConnections: Map<userId, RTCPeerConnection>
├── remoteStreams: Map<userId, MediaStream>
├── iceServers: Array<RTCIceServer>
└── isAudioEnabled/isVideoEnabled: boolean

useWebRTC Hook (Component Layer)
├── isInitialized: boolean
├── isConnecting: boolean
├── isInRoom: boolean
├── localStream: MediaStream
├── remoteStreams: Array<{userId, stream}>
├── participants: Array<{userId, userName, role}>
├── chatMessages: Array<Message>
├── error: Error | null
└── connectionState: string
```

---

## Security Flow

```
1. User Authentication
   └─ JWT Token Generated

2. API Request
   └─ Bearer Token in Header
      └─ Backend Validates
         └─ User Access Granted

3. Socket.IO Connection
   └─ User Registration
      └─ Socket associated with User ID

4. Room Join Authorization
   └─ Backend checks appointment ownership
      └─ Creates/Joins room only if authorized

5. WebRTC Signaling
   └─ All events validated on backend
      └─ Only authorized room members receive events
```

---

This architecture provides a scalable, secure, and efficient WebRTC video calling system!
