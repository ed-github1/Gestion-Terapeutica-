# Backend Integration — Profile Settings & Analytics

This document describes the three endpoints the frontend expects for the
**Estadísticas** and **Configuración** tabs inside `/dashboard/professional/profile`.

---

## 1. `GET /professional/stats?year=YYYY`

Returns annual stats for the authenticated professional.

### Auth
Bearer JWT (cookie `access_token`).

### Query params
| Param | Type   | Required | Description       |
|-------|--------|----------|-------------------|
| year  | number | yes      | e.g. `2025`       |

### Response `200`
```json
{
  "success": true,
  "data": {
    "totalPatients": 52,
    "activePatients": 38,
    "inactivePatients": 14,
    "totalRevenue": 198000,
    "therapyHours": 524, 
    "avgSessionMin": 50,
    "monthlyRevenue": [14200, 15600, 17800, 16400, 18100, 17200, 16800, 17500, 16900, 17200, 15800, 14500],
    "monthlyHours":   [42, 44, 48, 45, 50, 47, 46, 48, 46, 47, 43, 37],
    "monthlyPatients":[32, 34, 36, 35, 38, 37, 36, 38, 37, 38, 35, 30],
    "countries": [
      { "name": "Argentina", "count": 30 },
      { "name": "México",    "count": 8  }
    ],
    "gender": { "female": 36, "male": 13, "other": 3 },
    "referrals": [
      { "source": "Boca en boca",   "count": 22 },
      { "source": "Google",         "count": 12 }
    ],
    "peakHours": [
      [0,1,2,3,4,3,0],
      [0,2,3,4,5,4,1],
      [0,1,3,5,5,4,1],
      [0,2,4,5,4,3,0],
      [0,3,4,3,2,1,0],
      [0,0,1,2,1,0,0]
    ]
  }
}
```

**`peakHours`** is a 6×7 matrix: rows = Mon–Sat, columns = 9h/11h/13h/15h/17h/19h/21h.  
Each value is the number of sessions that started in that slot during the year.

Months with no data should be `0`. Only return years that have at least one appointment.

---

## 2. `GET /professional/settings`

Returns the stored settings for the authenticated professional.

### Auth
Bearer JWT.

### Response `200`
```json
{
  "success": true,
  "data": {
    "notifications": {
      "emailAppointments": true,
      "emailReminders": true,
      "push": true
    },
    "videoCallEnabled": true,
    "autoConfirm": false,
    "reminderHours": "24",
    "sessionDuration": "60"
  }
}
```

If the professional has no stored settings yet, return the defaults above.

---

## 3. `PATCH /professional/settings`

Persists settings for the authenticated professional.

### Auth
Bearer JWT + CSRF token (`X-CSRF-Token` header, read from `csrf_token` cookie —
already handled by the Axios client).

### Request body
```json
{
  "notifications": {
    "emailAppointments": true,
    "emailReminders": false,
    "push": true
  },
  "videoCallEnabled": true,
  "autoConfirm": false,
  "reminderHours": "24",
  "sessionDuration": "60"
}
```

All fields are optional — merge with existing stored values (PATCH semantics).

### Response `200`
```json
{ "success": true }
```

### Response `400`
```json
{ "success": false, "message": "Validation error description" }
```

---

## Notes

- Session prices (`sessionTypePrices`) are already handled by the existing
  `PATCH /professional/tarifas` endpoint — no change needed there.
- The frontend falls back to mock data when `GET /professional/stats` returns
  a non-2xx response, so the stats tab will render during development without
  this endpoint.
- Settings are cached in `sessionStorage` + `localStorage` so the UI works
  offline; the PATCH is fire-and-forget from the frontend's perspective.
