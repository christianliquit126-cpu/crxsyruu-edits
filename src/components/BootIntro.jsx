import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './BootIntro.module.css'

const BOOT_LINES = [
  { text: 'Initializing Tempest Core...', delay: 0 },
  { text: 'Loading System Interface...', delay: 0.55 },
  { text: 'Syncing Archive Data...', delay: 1.1 },
  { text: 'Crxsyruu Tempest Ready.', delay: 1.65, accent: true },
]

const TOTAL_MS = 2600
const FADE_MS = 650
const BOOT_KEY = 'tempest_booted'

export default function BootIntro({ onComplete }) {
  const [lines, setLines] = useState([])
  const [progress, setProgress] = useState(0)
  const [done, setDone] = useState(false)
  const frameId = useRef(null)
  const skipRef = useRef(null)

  const skip = useCallback(() => {
    if (skipRef.current) skipRef.current()
  }, [])

  useEffect(() => {
    const alreadyBooted = sessionStorage.getItem(BOOT_KEY)
    if (alreadyBooted) {
      onComplete()
      return
    }

    let cancelled = false
    const timers = []
    const startTime = Date.now()

    const finish = () => {
      if (cancelled) return
      cancelled = true
      timers.forEach(clearTimeout)
      if (frameId.current) cancelAnimationFrame(frameId.current)
      setProgress(100)
      setDone(true)
      sessionStorage.setItem(BOOT_KEY, '1')
      setTimeout(onComplete, FADE_MS)
    }

    skipRef.current = finish

    const animate = () => {
      if (cancelled) return
      const elapsed = Date.now() - startTime
      const p = Math.min((elapsed / TOTAL_MS) * 100, 100)
      setProgress(p)
      if (p < 100) {
        frameId.current = requestAnimationFrame(animate)
      }
    }
    frameId.current = requestAnimationFrame(animate)

    BOOT_LINES.forEach(({ text, delay, accent }) => {
      const t = setTimeout(() => {
        if (!cancelled) setLines(prev => [...prev, { text, accent }])
      }, delay * 1000)
      timers.push(t)
    })

    const doneTimer = setTimeout(finish, TOTAL_MS)
    timers.push(doneTimer)

    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
      if (frameId.current) cancelAnimationFrame(frameId.current)
      setLines([])
      setProgress(0)
      skipRef.current = null
    }
  }, [onComplete])

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          className={styles.boot}
          exit={{ opacity: 0 }}
          transition={{ duration: FADE_MS / 1000, ease: [0.4, 0, 0.2, 1] }}
          onClick={skip}
        >
          <div className={styles.gradientOrb1} />
          <div className={styles.gradientOrb2} />
          <div className={styles.gradientOrb3} />
          <div className={styles.scanLines} />
          <div className={styles.grid} />

          <div className={styles.content}>
            <motion.div
              className={styles.logoWrap}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <div className={styles.logoRing} />
              <div className={styles.logoRing2} />
              <div className={styles.logoRingPulse} />
              <svg width="52" height="52" viewBox="0 0 64 64" fill="none" className={styles.logoSvg}>
                <circle cx="32" cy="32" r="28" stroke="var(--glow-blue)" strokeWidth="1" opacity="0.4"/>
                <polygon points="32,14 42,26 37,26 37,50 27,50 27,26 22,26" fill="var(--glow-blue)" opacity="0.9"/>
                <circle cx="32" cy="32" r="4" fill="var(--glow-cyan)"/>
              </svg>
            </motion.div>

            <motion.div
              className={styles.title}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            >
              CRXSYRUU TEMPEST
            </motion.div>

            <motion.div
              className={styles.subtitle}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              SYSTEM v2.0 — TEMPEST CORE
            </motion.div>

            <div className={styles.terminal}>
              {lines.map((line, i) => (
                <motion.div
                  key={i}
                  className={`${styles.termLine} ${line.accent ? styles.termAccent : ''}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                >
                  <span className={styles.prompt}>&gt;</span>
                  {line.text}
                </motion.div>
              ))}
              <div className={styles.cursor} />
            </div>

            <div className={styles.progressWrap}>
              <div className={styles.progressTrack}>
                <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                <div
                  className={styles.progressGlow}
                  style={{ left: `${Math.max(0, progress)}%` }}
                />
              </div>
              <span className={styles.progressPct}>{Math.round(progress)}%</span>
            </div>

            <motion.div
              className={styles.skipHint}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.4 }}
            >
              Click anywhere to skip
            </motion.div>
          </div>

          <div className={styles.corner} data-pos="tl" />
          <div className={styles.corner} data-pos="tr" />
          <div className={styles.corner} data-pos="bl" />
          <div className={styles.corner} data-pos="br" />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
