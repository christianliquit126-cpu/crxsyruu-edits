import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import styles from './NotFound.module.css'
import { sounds } from '../lib/sound'

export default function NotFound() {
  const navigate = useNavigate()

  useEffect(() => {
    document.title = '404 — Page Not Found'
  }, [])

  useEffect(() => {
    const t = setTimeout(() => navigate('/'), 12000)
    return () => clearTimeout(t)
  }, [navigate])

  return (
    <div className={styles.page}>
      <div className={styles.glowTop} />
      <div className={styles.glowBottom} />

      <motion.div
        className={styles.content}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className={styles.codeWrap}>
          <div className={styles.codeGlow} />
          <span className={styles.codeLabel}>ERROR CODE</span>
          <h1 className={styles.code}>404</h1>
        </div>

        <div className={styles.divider} />

        <div className={styles.info}>
          <span className="label-tag">System Alert</span>
          <h2 className={styles.title}>Realm Not Found</h2>
          <p className={styles.desc}>
            The page you're looking for doesn't exist in this dimension.
            Perhaps the Great Sage can guide you elsewhere.
          </p>
        </div>

        <div className={styles.actions}>
          <Link to="/" className={styles.homeBtn} onClick={() => sounds.tap()}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15,18 9,12 15,6"/>
            </svg>
            Return Home
            <span className={styles.btnGlow} />
          </Link>
          <Link to="/gallery" className={styles.galleryBtn} onClick={() => sounds.tap()}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            Browse Archive
          </Link>
        </div>

        <p className={styles.redirect}>
          Auto-redirecting to home in <span className={styles.countdown}>12s</span>
        </p>

        <div className={styles.grid}>
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className={styles.gridCell}
              style={{ animationDelay: `${(i * 0.12) % 2}s` }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  )
}
