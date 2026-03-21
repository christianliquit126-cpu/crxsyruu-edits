import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './VideoModal.module.css'
import { incrementView } from '../hooks/useFirebaseData'

const timeAgo = (ts) => {
  const diff = Date.now() - ts
  const d = Math.floor(diff / 86400000)
  return d < 1 ? 'Today' : `${d} day${d !== 1 ? 's' : ''} ago`
}

const formatViews = (n) => {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

export default function VideoModal({ edit, onClose }) {
  const overlayRef = useRef(null)
  const viewTracked = useRef(false)

  useEffect(() => {
    if (edit && !viewTracked.current) {
      viewTracked.current = true
      incrementView(edit.id)
    }
  }, [edit])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const handleBackdrop = (e) => {
    if (e.target === overlayRef.current) onClose()
  }

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
          transition={{ duration: 0.25 }}
        >
          <motion.div
            className={styles.modal}
            initial={{ scale: 0.92, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 24 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>

            <div className={styles.mediaWrap}>
              {edit.videoUrl ? (
                <video
                  src={edit.videoUrl}
                  controls
                  autoPlay
                  className={styles.video}
                />
              ) : (
                <div className={styles.noVideo}>
                  <img src={edit.thumbnail} alt={edit.title} className={styles.thumbBig} />
                  <div className={styles.noVideoOverlay}>
                    <div className={styles.noVideoMsg}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <polygon points="5,3 19,12 5,21"/>
                      </svg>
                      <span>Video preview not available</span>
                    </div>
                  </div>
                </div>
              )}
              <div className={styles.mediaGlow} />
            </div>

            <div className={styles.info}>
              <div className={styles.infoTop}>
                <div>
                  <span className={styles.categoryTag}>{edit.category}</span>
                  <h2 className={styles.title}>{edit.title}</h2>
                </div>
                <div className={styles.viewCount}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  {formatViews(edit.views || 0)} views
                </div>
              </div>

              <p className={styles.desc}>{edit.description}</p>

              <div className={styles.metaRow}>
                <div className={styles.tags}>
                  {(edit.tags || []).map((tag) => (
                    <span key={tag} className={styles.tag}>{tag}</span>
                  ))}
                </div>
                <span className={styles.date}>{timeAgo(edit.uploadedAt)}</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
