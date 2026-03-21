import { useEffect, useRef } from 'react'
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

export default function VideoModal({ edit, onClose }) {
  const overlayRef = useRef(null)
  const viewTracked = useRef(false)

  useEffect(() => {
    if (edit && !viewTracked.current) {
      viewTracked.current = true
      incrementView(edit.id)
    }
    if (!edit) viewTracked.current = false
  }, [edit])

  useEffect(() => {
    if (!edit) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [edit, onClose])

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

            <div className={styles.mediaWrap}>
              {edit.videoUrl ? (
                <video
                  src={edit.videoUrl}
                  controls
                  autoPlay
                  playsInline
                  className={styles.video}
                />
              ) : (
                <div className={styles.noVideo}>
                  <img
                    src={edit.thumbnail}
                    alt={edit.title}
                    className={styles.thumbBig}
                  />
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

              {edit.description && (
                <p className={styles.desc}>{edit.description}</p>
              )}

              <div className={styles.metaRow}>
                <div className={styles.tags}>
                  {(edit.tags || []).map((tag) => (
                    <span key={tag} className={styles.tag}>{tag}</span>
                  ))}
                </div>
                <span className={styles.date}>{timeAgo(edit.uploadedAt)}</span>
              </div>
            </div>

            <div className={styles.modalGlow} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
