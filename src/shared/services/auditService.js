/**
 * shared/services/auditService.js
 * HIPAA-aligned audit logging.
 *
 * Every call to auditLog():
 *  1. Emits a structured console.info entry so any log aggregator (Datadog,
 *     LogRocket, CloudWatch, etc.) can capture it.
 *  2. Attempts a fire-and-forget POST to /audit/log.  If the endpoint does
 *     not exist yet the error is swallowed — the console entry is the fallback.
 */
import apiClient from '@shared/api/client'

// One stable session id per browser tab — helps correlate a session's events.
const SESSION_ID = Math.random().toString(36).slice(2, 10).toUpperCase()

/**
 * @param {string} action  - e.g. 'LOGIN' | 'LOGOUT' | 'VIEW_PATIENT' | 'IDLE_TIMEOUT'
 * @param {object} details - arbitrary context (userId, patientId, reason…)
 */
export const auditLog = (action, details = {}) => {
  const entry = {
    action,
    sessionId: SESSION_ID,
    timestamp: new Date().toISOString(),
    url: window.location.pathname,
    ...details,
  }

  // Always emit to console so log aggregators can capture it
  console.info('[AUDIT]', JSON.stringify(entry))

  // Best-effort POST — only attempted when the audit endpoint is explicitly enabled.
  // Set VITE_AUDIT_API_ENABLED=true once the backend /audit/log route is deployed
  // to avoid spurious 404 errors in the browser console.
  if (import.meta.env.VITE_AUDIT_API_ENABLED === 'true') {
    apiClient.post('/audit/log', entry).catch(() => {
      // Swallow silently — console entry above is the authoritative record
    })
  }
}
