import { useEffect, useRef, useCallback } from 'react'
import { useDevicePerformance } from './useDevicePerformance'

const IDLE_MS = 28000

const TIME_THEMES = {
  dawn:  { '--glow-intensity': '1.1',  '--ambient-brightness': '1.06', '--glow-blue-alpha': '0.15' },
  day:   { '--glow-intensity': '1.0',  '--ambient-brightness': '1.0',  '--glow-blue-alpha': '0.12' },
  dusk:  { '--glow-intensity': '0.88', '--ambient-brightness': '0.93', '--glow-blue-alpha': '0.10' },
  night: { '--glow-intensity': '0.72', '--ambient-brightness': '0.86', '--glow-blue-alpha': '0.08' },
}

const getTimePeriod = () => {
  const h = new Date().getHours()
  if (h >= 5  && h < 10) return 'dawn'
  if (h >= 10 && h < 17) return 'day'
  if (h >= 17 && h < 21) return 'dusk'
  return 'night'
}

export function useSystemIntelligence() {
  const { isLowEnd } = useDevicePerformance()
  const idleTimer = useRef(null)

  useEffect(() => {
    const root = document.documentElement
    const apply = () => {
      const vars = TIME_THEMES[getTimePeriod()]
      Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v))
      root.setAttribute('data-time', getTimePeriod())
    }
    apply()
    const interval = setInterval(apply, 600000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    if (isLowEnd) {
      root.style.setProperty('--anim-speed', '0.5')
      root.setAttribute('data-perf', 'low')
      return
    }
    const t0 = performance.now()
    let n = 0
    while (performance.now() - t0 < 4) n++
    const speed = n > 800000 ? '1' : n > 400000 ? '0.8' : '0.6'
    root.style.setProperty('--anim-speed', speed)
    root.setAttribute('data-perf', speed === '1' ? 'high' : speed === '0.8' ? 'mid' : 'low')
  }, [isLowEnd])

  const resetIdle = useCallback(() => {
    document.documentElement.removeAttribute('data-idle')
    clearTimeout(idleTimer.current)
    idleTimer.current = setTimeout(() => {
      document.documentElement.setAttribute('data-idle', 'true')
    }, IDLE_MS)
  }, [])

  useEffect(() => {
    const evts = ['mousemove', 'keydown', 'touchstart', 'click', 'scroll', 'pointerdown']
    evts.forEach(e => window.addEventListener(e, resetIdle, { passive: true }))
    resetIdle()
    return () => {
      evts.forEach(e => window.removeEventListener(e, resetIdle))
      clearTimeout(idleTimer.current)
    }
  }, [resetIdle])
}
