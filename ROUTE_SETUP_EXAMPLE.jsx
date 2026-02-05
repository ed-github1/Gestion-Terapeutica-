/**
 * Example: How to add WebRTC Video Call Routes
 * 
 * Add this to your App.jsx or router configuration
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Import WebRTC components
import PatientVideoCallWebRTC from './features/patient/PatientVideoCallWebRTC';
import ProfessionalVideoCallWebRTC from './features/professional/VideoCallWebRTC';

// Optional: For gradual migration, keep old Twilio components
// import PatientVideoCall from './features/patient/PatientVideoCall';
// import VideoCall from './features/professional/VideoCall';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ... your existing routes ... */}

        {/* Patient Video Call Routes */}
        <Route 
          path="/patient/video-call/:appointmentId" 
          element={<PatientVideoCallWebRTC />} 
        />

        {/* Professional Video Call Routes */}
        <Route 
          path="/professional/video-call/:appointmentId" 
          element={<ProfessionalVideoCallWebRTC />} 
        />

        {/* ... rest of your routes ... */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;

/**
 * Usage in your components:
 * 
 * // For Patients - Join a video call
 * navigate(`/patient/video-call/${appointmentId}`);
 * 
 * // For Professionals - Start a video call
 * navigate(`/professional/video-call/${appointmentId}`);
 */

/**
 * Optional: Conditional rendering based on video system
 */
const VIDEO_SYSTEM = import.meta.env.VITE_VIDEO_SYSTEM || 'webrtc';

function ConditionalVideoRoute() {
  const PatientComponent = VIDEO_SYSTEM === 'webrtc' 
    ? PatientVideoCallWebRTC 
    : PatientVideoCall;

  const ProfessionalComponent = VIDEO_SYSTEM === 'webrtc'
    ? ProfessionalVideoCallWebRTC
    : VideoCall;

  return (
    <>
      <Route 
        path="/patient/video-call/:appointmentId" 
        element={<PatientComponent />} 
      />
      <Route 
        path="/professional/video-call/:appointmentId" 
        element={<ProfessionalComponent />} 
      />
    </>
  );
}
