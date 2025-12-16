# Backend API Endpoints Needed for Patient Registration Flow

## 1. Create Patient (Modified - No credentials required)

**Endpoint:** `POST /api/patients`

**Request Body:**
```json
{
  "nombre": "Juan",
  "apellido": "Pérez",
  "datosPersonales": {
    "telefono": "+1234567890",
    "fecha_nacimiento": "1990-01-15",
    "genero": "Masculino",
    "direccion": "Calle Principal 123",
    "historial_medico": "...",
    "alergias": "...",
    "medicamentos_actuales": "..."
  },
  "contactoEmergencia": {
    "nombre": "María Pérez",
    "telefono": "+9876543210"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "patient-uuid-123",
    "nombre": "Juan",
    "apellido": "Pérez",
    "invitationToken": "unique-secure-token-abc123",
    "status": "pending_registration",
    ...
  }
}
```

## 2. Send Registration Invitation

**Endpoint:** `POST /api/patients/:patientId/send-invitation`

**Request Body:**
```json
{
  "email": "patient@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Invitation sent successfully",
  "data": {
    "email": "patient@example.com",
    "invitationToken": "unique-secure-token-abc123",
    "expiresAt": "2025-12-23T10:00:00Z"
  }
}
```

**Email Template:**
Subject: Invitación para Registrarte en el Portal de Salud

Body:
```
Hola [Patient Name],

Tu profesional de salud te ha invitado a registrarte en nuestro portal.

Haz clic en el siguiente enlace para completar tu registro:
[Registration Link]

Este enlace expirará en 7 días.

Si no solicitaste este registro, ignora este correo.
```

## 3. Verify Invitation Token (Optional - for better UX)

**Endpoint:** `GET /api/patients/invitation/:patientId?token=xxx`

**Response:**
```json
{
  "success": true,
  "data": {
    "patientId": "patient-uuid-123",
    "nombre": "Juan",
    "apellido": "Pérez",
    "tokenValid": true,
    "expiresAt": "2025-12-23T10:00:00Z"
  }
}
```

## 4. Complete Patient Registration

**Endpoint:** `POST /api/patients/complete-registration`

**Request Body:**
```json
{
  "patientId": "patient-uuid-123",
  "token": "unique-secure-token-abc123",
  "email": "patient@example.com",
  "password": "SecurePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration completed successfully",
  "data": {
    "id": "patient-uuid-123",
    "email": "patient@example.com",
    "nombre": "Juan",
    "apellido": "Pérez",
    "rol": "patient",
    "status": "active"
  }
}
```

**Backend Logic:**
1. Verify token is valid and not expired
2. Check patient exists and is in "pending_registration" status
3. Create user account with email/password
4. Hash password
5. Link user account to patient record
6. Update patient status to "active"
7. Invalidate the invitation token

## 5. Login (Existing - No changes needed)

**Endpoint:** `POST /api/auth/login`

Patients can now login with their self-created credentials.

## Security Considerations

1. **Token Generation:** Use crypto-secure random tokens (e.g., UUID v4)
2. **Token Expiration:** Tokens should expire after 7 days
3. **One-time Use:** Token should be invalidated after successful registration
4. **Email Verification:** Consider adding email verification after registration
5. **Password Requirements:** Enforce strong passwords (min 8 chars, uppercase, lowercase, numbers)
6. **Rate Limiting:** Limit registration attempts to prevent abuse

## Database Schema Updates

### Patients Table
```sql
ALTER TABLE patients ADD COLUMN:
  - invitation_token VARCHAR(255) UNIQUE
  - invitation_sent_at TIMESTAMP
  - invitation_expires_at TIMESTAMP
  - status ENUM('pending_registration', 'active', 'inactive') DEFAULT 'pending_registration'
  - user_id UUID REFERENCES users(id) -- Link to user account after registration
```

### Users Table (if separate)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol ENUM('health_professional', 'patient') NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```
