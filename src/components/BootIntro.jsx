import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './BootIntro.module.css'

const BOOT_LINES = [
  { text: 'Initializing Tempest Core…', delay: 0 },
  { text: 'Loading Great Sage Interface…', delay: 0.4 },
  { text: 'Syncing Rimuru Archive…', delay: 0.8 },
  { text: 'Calibrating Energy Systems…', delay: 1.2 },
  { text: 'All systems online.', delay: 1.6, accent: true },
]

const BOOT_KEY = 'tempest_booted'

export default function BootIntro({ onComplete }) {
  const [lines, setLines] = useState([])
  const [progress, setProgress] = useState(0)
  const [done, setDone] = useState(false)
  const hasStarted = useRef(false)

  useEffect(() => {
    if (hasStarted.current) return
    hasStarted.current = true

    const alreadyBooted = sessionStorage.getItem(BOOT_KEY)
    if (alreadyBooted) {
      onComplete()
      return
    }

    const start = Date.now()
    let frameId

    const animate = () => {
      const elapsed = Date.now() - start
      const p = Math.min((elapsed / 2200) * 100, 100)
      setProgress(p)
      if (p < 100) frameId = requestAnimationFrame(animate)
    }
    frameId = requestAnimationFrame(animate)

    BOOT_LINES.forEach(({ text, delay, accent }) => {
      setTimeout(() => {
        setLines(prev => [...prev, { text, accent }])
      }, delay * 1000)
    })

    setTimeout(() => {
      cancelAnimationFrame(frameId)
      setProgress(100)
      setDone(true)
      sessionStorage.setItem(BOOT_KEY, '1')
      setTimeout(onComplete, 650)
    }, 2400)
  }, [])

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          className={styles.boot}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.65, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className={styles.scanLines} />
          <div className={styles.grid} />

          <div className={styles.content}>
            <motion.div
              className={styles.logoWrap}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className={styles.logoRing} />
              <div className={styles.logoRing2} />
              <svg width="56" height="56" viewBox="0 0 64 64" fill="none" className={styles.logoSvg}>
                <circle cx="32" cy="32" r="28" stroke="var(--glow-blue)" strokeWidth="1" opacity="0.4"/>
                <polygon points="32,14 42,26 37,26 37,50 27,50 27,26 22,26" fill="var(--glow-blue)" opacity="0.9"/>
                <circle cx="32" cy="32" r="4" fill="var(--glow-cyan)"/>
              </svg>
            </motion.div>

            <motion.div
              className={styles.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              CRXSYRUU TEMPEST
            </motion.div>

            <div className={styles.terminal}>
              {lines.map((line, i) => (
                <motion.div
                  key={i}
                  className={`${styles.termLine} ${line.accent ? styles.termAccent : ''}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
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
                <div className={styles.progressGlow} style={{ left: `${progress}%` }} />
              </div>
              <span className={styles.progressPct}>{Math.round(progress)}%</span>
            </div>
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
