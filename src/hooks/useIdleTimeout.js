/**
 * hooks/useIdleTimeout.js
 * HIPAA §164.312(a)(2)(iii) — automatic logoff after inactivity.
 *
 * Behaviour
 * ---------
 * • Tracks user activity (mouse, keyboard, touch, scroll).
 * • After IDLE_MS of silence, fires onIdle().
 * • WARN_BEFORE_MS before that, sets showWarning=true so the caller can
 *   render a "Still there?" modal with a live countdown.
 * • While the warning is visible, activity does NOT reset the timer — only
 *   the explicit extend() call does.  This matches HIPAA guidance.
 */
import { useState, useEffect, useRef, useCallback } from 'react'

const IDLE_MS      = 15 * 60 * 1000  // 15 minutes
const WARN_BEFORE_MS = 60 * 1000     // show warning 1 minute before logout

const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll', 'wheel']

/**
 * @param {{ onIdle: () => void, enabled?: boolean }} options
 * @returns {{ showWarning: boolean, secondsLeft: number, extend: () => void }}
 */

export const useIdleTimeout = ({ onIdle, enabled = true }) => {
  const [showWarning, setShowWarning] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(60)

  const warnTimer    = useRef(null)
  const logoutTimer  = useRef(null)
  const tickInterval = useRef(null)
  const warningRef   = useRef(false)   // ref mirror of showWarning for closure safety
  const onIdleRef    = useRef(onIdle)

  // Keep ref in sync so reset() always calls the latest onIdle without needing
  // to re-register event listeners every render.
  useEffect(() => { onIdleRef.current = onIdle }, [onIdle])

  const clearAll = useCallback(() => {
    clearTimeout(warnTimer.current)
    clearTimeout(logoutTimer.current)
    clearInterval(tickInterval.current)
  }, [])

  const reset = useCallback(() => {
    clearAll()
    setShowWarning(false)
    warningRef.current = false

    warnTimer.current = setTimeout(() => {
      setShowWarning(true)
      warningRef.current = true
      setSecondsLeft(60)
      tickInterval.current = setInterval(() => {
        setSecondsLeft(s => Math.max(0, s - 1))
      }, 1_000)
    }, IDLE_MS - WARN_BEFORE_MS)

    logoutTimer.current = setTimeout(() => {
      clearAll()
      setShowWarning(false)
      warningRef.current = false
      onIdleRef.current()
    }, IDLE_MS)
  }, [clearAll])

  // extend() is called by the "Continue" button — resets the full idle timer
  const extend = useCallback(() => reset(), [reset])

  useEffect(() => {
    if (!enabled) {
      clearAll()
      setShowWarning(false)
      warningRef.current = false
      return
    }

    reset()

    const onActivity = () => {
      // While warning is shown, ignore passive activity — only extend() resets
      if (!warningRef.current) reset()
    }

    ACTIVITY_EVENTS.forEach(ev =>
      window.addEventListener(ev, onActivity, { passive: true })
    )
    return () => {
      clearAll()
      ACTIVITY_EVENTS.forEach(ev => window.removeEventListener(ev, onActivity))
    }
  }, [enabled, reset, clearAll])

  return { showWarning, secondsLeft, extend }
}
