import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './VideoModal.module.css'
import { incrementView } from '../hooks/useFirebaseData'

const timeAgo = (ts) => {
  if (!ts) return ''
  const diff = Date.now() - ts
  const d = Math.floor(diff / 86400000)
  return d < 1 ? 'Today' : `${d} day${d !== 1 ? 's' : ''} ago`
}

const formatViews = (n) => {
  if (!n) return '0'
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

export default function VideoModal({ edit, onClose, edits = [], onNavigate }) {
  const overlayRef = useRef(null)
  const videoRef = useRef(null)
  const viewTracked = useRef(false)
  const [buffering, setBuffering] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [quality, setQuality] = useState('auto')

  const currentIdx = edits.findIndex(e => e?.id === edit?.id)

  const goNext = useCallback(() => {
    if (onNavigate && currentIdx < edits.length - 1) onNavigate(edits[currentIdx + 1])
  }, [onNavigate, currentIdx, edits])

  const goPrev = useCallback(() => {
    if (onNavigate && currentIdx > 0) onNavigate(edits[currentIdx - 1])
  }, [onNavigate, currentIdx, edits])

  useEffect(() => {
    if (edit && !viewTracked.current) {
      viewTracked.current = true
      incrementView(edit.id)
    }
    if (!edit) viewTracked.current = false
  }, [edit])

  useEffect(() => {
    if (!edit) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'f' || e.key === 'F') toggleFullscreen()
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [edit, onClose, goNext, goPrev])

  const handleBackdrop = (e) => {
    if (e.target === overlayRef.current) onClose()
  }

  const toggleFullscreen = () => {
    const el = videoRef.current
    if (!el) return
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().then(() => setFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen?.().then(() => setFullscreen(false)).catch(() => {})
    }
  }

  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const videoSrc = edit?.videoUrl

  return (
    <AnimatePresence>
      {edit && (
        <motion.div
          ref={overlayRef}
          className={styles.overlay}
          onClick={handleBackdrop}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <motion.div
            className={styles.modal}
            initial={{ scale: 0.9, opacity: 0, y: 32 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 32 }}
            transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
          >
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>

            {onNavigate && (
              <>
                <button
                  className={`${styles.navBtn} ${styles.navPrev}`}
                  onClick={goPrev}
                  disabled={currentIdx <= 0}
                  aria-label="Previous"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15,18 9,12 15,6"/>
                  </svg>
                </button>
                <button
                  className={`${styles.navBtn} ${styles.navNext}`}
                  onClick={goNext}
                  disabled={currentIdx >= edits.length - 1}
                  aria-label="Next"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9,18 15,12 9,6"/>
                  </svg>
                </button>
              </>
            )}

            <div className={styles.mediaWrap}>
              {edit.videoUrl ? (
                <div className={styles.videoContainer}>
                  <video
                    ref={videoRef}
                    src={videoSrc}
                    controls
                    autoPlay
                    playsInline
                    className={styles.video}
                    onWaiting={() => setBuffering(true)}
                    onPlaying={() => setBuffering(false)}
                    onCanPlay={() => setBuffering(false)}
                  />
                  {buffering && (
                    <div className={styles.bufferingOverlay}>
                      <div className={styles.bufferingRing}>
                        <div className={styles.bufferingSpinner} />
                      </div>
                      <span className={styles.bufferingText}>Buffering…</span>
                    </div>
                  )}
                  <div className={styles.videoControls}>
                    <div className={styles.qualitySelector}>
                      <span className={styles.qualityLabel}>Quality</span>
                      <select
                        className={styles.qualitySelect}
                        value={quality}
                        onChange={e => setQuality(e.target.value)}
                      >
                        <option value="auto">Auto</option>
                        <option value="hd">HD</option>
                      </select>
                    </div>
                    <button
                      className={`${styles.fullscreenBtn} ${fullscreen ? styles.fullscreenActive : ''}`}
                      onClick={toggleFullscreen}
                      aria-label="Toggle fullscreen"
                    >
                      {fullscreen ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="8,3 3,3 3,8"/><polyline points="21,8 21,3 16,3"/>
                          <polyline points="3,16 3,21 8,21"/><polyline points="16,21 21,21 21,16"/>
                        </svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="15,3 21,3 21,9"/><polyline points="9,21 3,21 3,15"/>
                          <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
                        </svg>
                      )}
                      {fullscreen ? 'Exit' : 'Fullscreen'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className={styles.noVideo}>
                  <img src={edit.thumbnail} alt={edit.title} className={styles.thumbBig} />
                  <div className={styles.noVideoOverlay}>
                    <div className={styles.noVideoMsg}>
                      <div className={styles.noVideoIcon}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <polygon points="5,3 19,12 5,21"/>
                        </svg>
                      </div>
                      <span>Video preview not available</span>
                      <span className={styles.noVideoSub}>Viewing thumbnail</span>
                    </div>
                  </div>
                </div>
              )}
              <div className={styles.mediaGlow} />
            </div>

            <div className={styles.info}>
              <div className={styles.infoTop}>
                <div className={styles.infoLeft}>
                  <span className={styles.categoryTag}>{edit.category}</span>
                  <h2 className={styles.title}>{edit.title}</h2>
                </div>
                <div className={styles.infoRight}>
                  <div className={styles.viewCount}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                    {formatViews(edit.views || 0)} views
                  </div>
                  {edit.featured && (
                    <span className={styles.featuredBadge}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                      </svg>
                      Featured
                    </span>
                  )}
                </div>
              </div>

              {edit.description && <p className={styles.desc}>{edit.description}</p>}

              <div className={styles.metaRow}>
                <div className={styles.tags}>
                  {(edit.tags || []).map((tag) => (
                    <span key={tag} className={styles.tag}>{tag}</span>
                  ))}
                </div>
                <span className={styles.date}>{timeAgo(edit.uploadedAt)}</span>
              </div>

              {onNavigate && (
                <div className={styles.keyHints}>
                  <span>← → navigate</span>
                  <span>ESC close</span>
                  <span>F fullscreen</span>
                </div>
              )}
            </div>

            <div className={styles.modalGlow} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
