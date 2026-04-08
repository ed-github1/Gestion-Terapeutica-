# Backend Prompt: WebRTC Session Recording + AssemblyAI Transcription

## Context

The frontend is a therapy platform with WebRTC video calls. The signaling server uses Socket.IO on the `/webrtc` namespace. Rooms are managed via these existing endpoints:

- `POST /rtc/rooms/join` — joins/creates a room (receives `{ appointmentId }`)
- `POST /rtc/rooms/:appointmentId/end` — ends the room
- `GET /rtc/rooms/:appointmentId` — room status
- `GET /rtc/rooms/:appointmentId/stats` — connection stats
- `GET /rtc/ice-servers` — TURN/STUN credentials


                            
The appointment model already has these fields that the frontend reads:

```
transcript: String           // full transcript text
transcriptStatus: String     // 'idle' | 'processing' | 'ready' | 'failed'
```

The frontend polls `GET /appointments/:id` and checks `transcriptStatus`. When `'ready'`, it displays the `transcript` field in an editable textarea. The professional can also update session notes via `PATCH /appointments/:id/session-notes`.

---

## Task

Implement server-side audio recording of WebRTC sessions and post-call transcription via AssemblyAI. The flow must be:

---

### 1. Server-Side Recording (Media Server)

When both participants are connected to a room, the backend must:

- Act as a **third invisible peer** in the WebRTC room (using a headless WebRTC client like **mediasoup**, **Janus**, **Pion**, or **node-webrtc**)
- Receive the audio tracks from both participants
- Mix both audio streams into a single audio file (WAV or FLAC preferred for transcription quality, fallback to Opus/WebM if needed)
- Store the recording temporarily (local filesystem or object storage like S3/R2)
- Only record when **both users have given consent** — add a `recordingConsent` boolean field to the room join payload. If either user has not consented, do not record.

**Alternative simpler approach:** If a headless WebRTC peer is too complex, use the **server-side SFU approach** — if you're already relaying media through the server (SFU mode), tap into the forwarded streams to record. If the current setup is pure peer-to-peer with the server only doing signaling, you'll need to add a media server component.

---

### 2. Post-Call Transcription

When `POST /rtc/rooms/:appointmentId/end` is called:

1. Finalize the recording file
2. Update the appointment: `transcriptStatus = 'processing'`
3. Upload the audio file to AssemblyAI (or provide a pre-signed URL):

```json
POST https://api.assemblyai.com/v2/transcript
{
  "audio_url": "<url_to_audio_file>",
  "language_code": "es",
  "speaker_labels": true,
  "speakers_expected": 2,
  "redact_pii": true,
  "redact_pii_policies": [
    "person_name",
    "phone_number",
    "email_address",
    "location",
    "date_of_birth"
  ]
}
```

4. Use **AssemblyAI webhooks** (preferred) or polling to detect completion:
   - Webhook: pass `"webhook_url": "https://your-api.com/webhooks/assemblyai"` in the request
   - On callback, update the appointment:

```
transcriptStatus = 'ready'
transcript = formatted transcript text with speaker labels
```

   - Format the transcript as:

```
Hablante 1: texto...
Hablante 2: texto...
```

5. If transcription fails, set `transcriptStatus = 'failed'`
6. Delete the temporary audio file after successful transcription

---

### 3. Required Endpoints (new or modified)

| Endpoint | Change |
|---|---|
| `POST /rtc/rooms/join` | Accept `recordingConsent: boolean` in body. Track consent per participant. |
| `POST /rtc/rooms/:appointmentId/end` | Trigger transcription pipeline after stopping recording. |
| `POST /webhooks/assemblyai` | **New.** Receives AssemblyAI webhook callback. Validates webhook, updates appointment with transcript. |
| `GET /appointments/:id` | **No change.** Already returns `transcript` and `transcriptStatus`. |

---

### 4. Appointment Model Changes

Add/verify these fields on the Appointment model:

```javascript
transcript:        { type: String, default: '' },
transcriptStatus:  { type: String, enum: ['idle', 'processing', 'ready', 'failed'], default: 'idle' },
transcriptJobId:   { type: String },        // AssemblyAI transcript ID for polling/lookup
recordingUrl:      { type: String },        // temporary storage path, delete after transcription
recordingConsent:  { type: Boolean, default: false },

// ── Session timing fields (REQUIRED) ─────────────────────────────────────────
callStartedAt:     { type: Date },          // UTC timestamp when both peers connected
callEndedAt:       { type: Date },          // UTC timestamp when room was ended
callDuration:      { type: Number },        // actual elapsed minutes (derived: (callEndedAt - callStartedAt) / 60000)
duration:          { type: Number },        // scheduled duration in minutes (set at booking time, never overwrite with callDuration)
```

#### ⚠️ Duration tracking rules

- `duration` = the **booked/scheduled** duration (set when the appointment is created). Never overwrite this.
- `callDuration` = the **actual measured** duration, calculated server-side when the room ends:

```javascript
// In POST /rtc/rooms/:appointmentId/end handler:
const callEndedAt = new Date()
const callDuration = Math.round((callEndedAt - appointment.callStartedAt) / 60_000)

await Appointment.findByIdAndUpdate(appointmentId, {
  callEndedAt,
  callDuration,
  status: 'completed',
})
```

- `callStartedAt` must be set in `POST /rtc/rooms/join` **when the second participant joins** (i.e., when the call actually begins, not when the first peer enters the room):

```javascript
// In POST /rtc/rooms/join handler:
const room = await Room.findOne({ appointmentId })
const participantCount = room.participants.length + 1  // after adding current

if (participantCount === 2 && !appointment.callStartedAt) {
  await Appointment.findByIdAndUpdate(appointmentId, {
    callStartedAt: new Date(),
  })
}
```

- Both fields must be returned in `GET /appointments/:id` and in all appointment list endpoints so the frontend can display **actual session times** in the clinical file history.
- For **in-person sessions** (non-video), `callDuration` will always be null. The frontend falls back to `duration` (scheduled). The backend does not need to do anything special — just ensure `duration` is always saved at booking time and never null/0.

---

### 5. Environment Variables

```env
ASSEMBLYAI_API_KEY=<key>
ASSEMBLYAI_WEBHOOK_SECRET=<secret>        # for webhook signature verification
RECORDING_STORAGE_PATH=/tmp/recordings    # or S3 bucket config
```

---

### 6. Security Requirements

- **HIPAA**: Ensure AssemblyAI BAA is signed before production use. Audio files must be encrypted at rest and in transit.
- **Consent**: Never record without explicit consent from both participants.
- **Cleanup**: Delete audio files after transcription completes (or within 24h max).
- **Webhook validation**: Verify AssemblyAI webhook signatures to prevent spoofed callbacks.
- **Access control**: Only the professional assigned to the appointment can view the transcript.

---

### 7. Error Handling

- If recording fails mid-session, log the error but do not interrupt the call.
- If AssemblyAI is unreachable, retry up to 3 times with exponential backoff, then set `transcriptStatus = 'failed'`.
- If the audio file is too short (<10 seconds), skip transcription and set `transcriptStatus = 'idle'`.

---

### 8. Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     VIDEO CALL ACTIVE                       │
│                                                             │
│  Patient ──WebRTC──► Server (SFU/Headless Peer) ◄──► Prof  │
│                         │                                   │
│                    Records audio                            │
│                    (both tracks mixed)                       │
└────────────────────────┬────────────────────────────────────┘
                         │
              POST /rtc/rooms/:id/end
                         │
                         ▼
              ┌──────────────────────┐
              │ Finalize recording   │
              │ Upload to S3/R2      │
              │ transcriptStatus =   │
              │   'processing'       │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ POST AssemblyAI      │
              │  /v2/transcript      │
              │  - language: es      │
              │  - speaker_labels    │
              │  - redact_pii        │
              │  - webhook_url       │
              └──────────┬───────────┘
                         │
              (async — minutes later)
                         │
                         ▼
              ┌──────────────────────┐
              │ POST /webhooks/      │
              │   assemblyai         │
              │                      │
              │ → Validate signature │
              │ → Parse transcript   │
              │ → Format speakers    │
              │ → Update appointment │
              │   transcriptStatus   │
              │     = 'ready'        │
              │   transcript = text  │
              │ → Delete audio file  │
              └──────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ Frontend polls       │
              │ GET /appointments/:id│
              │ → Shows transcript   │
              │   in SessionSummary  │
              └──────────────────────┘
```
