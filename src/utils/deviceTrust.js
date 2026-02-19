/**
 * utils/deviceTrust.js
 *
 * Device-trust token management.
 *
 * After a successful 2FA the browser fingerprint is persisted locally.
 * On subsequent logins the fingerprint is sent to the backend as the
 * X-Device-Token header, allowing the backend to skip the 2FA email
 * challenge for recognised devices.
 *
 * Trust lifetime: TRUST_DAYS days (default 30).
 *
 * HIPAA note: the fingerprint contains no PHI — it is a one-way hash of
 * browser characteristics (user-agent, screen size, timezone, etc.).
 */

const TRUST_DAYS  = 30
const STORAGE_KEY = 'dtokens' // JSON map  email → { fingerprint, expiresAt }

// ── Fingerprint ───────────────────────────────────────────────────────────────

/** Build a stable, non-reversible device fingerprint from browser traits. */
export function getDeviceFingerprint () {
  const nav = window.navigator
  const scr = window.screen
  const raw = [
    nav.userAgent,
    nav.language,
    nav.hardwareConcurrency ?? 'unk',
    nav.maxTouchPoints        ?? 0,
    scr.width,
    scr.height,
    scr.colorDepth            ?? 24,
    Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC',
    nav.platform              ?? 'unk',
  ].join('|')

  // djb2 hash — fast, dependency-free, collision-resistant enough for this purpose
  let hash = 5381
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) + hash) ^ raw.charCodeAt(i)
  }
  return (hash >>> 0).toString(36) // unsigned 32-bit hex-ish string
}

// ── Storage helpers ───────────────────────────────────────────────────────────

function readAll () {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

function writeAll (map) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch { /* storage quota / disabled — silently ignore */ }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Persist a trust record for `email` after a successful 2FA challenge.
 * Call this once from Verify2FAPage on success.
 */
export function storeTrustToken (email) {
  if (!email) return
  const map = readAll()
  map[email.toLowerCase()] = {
    fingerprint : getDeviceFingerprint(),
    expiresAt   : Date.now() + TRUST_DAYS * 24 * 60 * 60 * 1000,
  }
  writeAll(map)
}

/**
 * Return the stored fingerprint for `email` when still valid, else null.
 * Send this value as the X-Device-Token header with login requests.
 */
export function getTrustToken (email) {
  if (!email) return null
  try {
    const record = readAll()[email.toLowerCase()]
    if (!record) return null
    if (record.expiresAt < Date.now()) {
      revokeTrustToken(email)
      return null
    }
    return record.fingerprint
  } catch {
    return null
  }
}

/** True when a valid (non-expired) trust record exists for this device+email. */
export function isTrustedDevice (email) {
  return getTrustToken(email) !== null
}

/**
 * Remove the trust record for `email`.
 * Call on explicit logout (not on idle lock — the lock is a pause, not a sign-out).
 */
export function revokeTrustToken (email) {
  if (!email) return
  const map = readAll()
  delete map[email.toLowerCase()]
  writeAll(map)
}

/** Clear ALL trust records (e.g. "sign out everywhere" / admin reset). */
export function revokeAllTrustTokens () {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch { /* ignore */ }
}
