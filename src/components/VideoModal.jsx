import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './VideoModal.module.css'
import { incrementView } from '../hooks/useFirebaseData'
import { sounds } from '../lib/sound'

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

const formatTime = (s) => {
  if (!isFinite(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function VideoModal({ edit, onClose, edits = [], onNavigate }) {
  const overlayRef = useRef(null)
  const videoRef = useRef(null)
  const progressRef = useRef(null)
  const viewTracked = useRef(false)
  const touchStartX = useRef(null)
  const [buffering, setBuffering] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [muted, setMuted] = useState(false)
  const [cinematic, setCinematic] = useState(false)
  const [controlsVisible, setControlsVisible] = useState(true)
  const controlsTimeout = useRef(null)

  const currentIdx = edits.findIndex(e => e?.id === edit?.id)

  const showControls = useCallback(() => {
    setControlsVisible(true)
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current)
    controlsTimeout.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) setControlsVisible(false)
    }, 2800)
  }, [])

  const goNext = useCallback(() => {
    if (onNavigate && currentIdx < edits.length - 1) {
      sounds.swipe()
      onNavigate(edits[currentIdx + 1])
    }
  }, [onNavigate, currentIdx, edits])

  const goPrev = useCallback(() => {
    if (onNavigate && currentIdx > 0) {
      sounds.swipe()
      onNavigate(edits[currentIdx - 1])
    }
  }, [onNavigate, currentIdx, edits])

  useEffect(() => {
    if (edit && !viewTracked.current) {
      viewTracked.current = true
      incrementView(edit.id)
    }
    if (!edit) viewTracked.current = false
    setCurrentTime(0)
    setDuration(0)
  }, [edit])

  useEffect(() => {
    if (!edit) return
    sounds.open()
    const onKey = (e) => {
      if (e.key === 'Escape') { sounds.close(); onClose() }
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'f' || e.key === 'F') toggleFullscreen()
      if (e.key === 'c' || e.key === 'C') setCinematic(v => !v)
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [edit, onClose, goNext, goPrev])

  useEffect(() => {
    return () => { if (controlsTimeout.current) clearTimeout(controlsTimeout.current) }
  }, [])

  const handleBackdrop = (e) => {
    if (e.target === overlayRef.current) { sounds.close(); onClose() }
  }

  const handleClose = () => { sounds.close(); onClose() }

  const toggleFullscreen = () => {
    const el = videoRef.current
    if (!el) return
    sounds.tap()
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().then(() => setFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen?.().then(() => setFullscreen(false)).catch(() => {})
    }
  }

  const toggleCinematic = () => {
    sounds.toggle()
    setCinematic(v => !v)
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted
      setMuted(videoRef.current.muted)
      sounds.tap()
    }
  }

  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const handleTimeUpdate = () => {
    const v = videoRef.current
    if (!v) return
    setCurrentTime(v.currentTime)
    if (v.duration) setDuration(v.duration)
  }

  const handleProgressClick = (e) => {
    const v = videoRef.current
    const track = progressRef.current
    if (!v || !track) return
    const rect = track.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    v.currentTime = pct * v.duration
    sounds.tap()
  }

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(dx) > 60) {
      if (dx < 0) goNext()
      else goPrev()
    }
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <AnimatePresence>
      {edit && (
        <motion.div
          ref={overlayRef}
          className={`${styles.overlay} ${cinematic ? styles.cinematic : ''}`}
          onClick={handleBackdrop}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <motion.div
            className={styles.modal}
            initial={{ scale: 0.88, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 40 }}
            transition={{ duration: 0.34, ease: [0.4, 0, 0.2, 1] }}
            onMouseMove={showControls}
          >
            <button className={styles.closeBtn} onClick={handleClose} aria-label="Close">
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
                <div className={styles.videoContainer} onMouseMove={showControls} onClick={showControls}>
                  <video
                    ref={videoRef}
                    src={edit.videoUrl}
                    controls={false}
                    autoPlay
                    playsInline
                    className={styles.video}
                    onWaiting={() => setBuffering(true)}
                    onPlaying={() => { setBuffering(false); showControls() }}
                    onCanPlay={() => setBuffering(false)}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleTimeUpdate}
                  />

                  {buffering && (
                    <div className={styles.bufferingOverlay}>
                      <div className={styles.bufferingRing}>
                        <div className={styles.bufferingSpinner} />
                      </div>
                      <span className={styles.bufferingText}>Loading…</span>
                    </div>
                  )}

                  <div className={`${styles.videoControls} ${controlsVisible ? styles.controlsVisible : ''}`}>
                    <div
                      className={styles.progressTrack}
                      ref={progressRef}
                      onClick={handleProgressClick}
                      role="slider"
                      aria-label="Video progress"
                    >
                      <div className={styles.progressBuffer} />
                      <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                      <div className={styles.progressThumb} style={{ left: `${progress}%` }} />
                    </div>

                    <div className={styles.controlsRow}>
                      <div className={styles.controlsLeft}>
                        <button className={styles.ctrlBtn} onClick={toggleMute} aria-label="Toggle mute">
                          {muted ? (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polygon points="11,5 6,9 2,9 2,15 6,15 11,19"/>
                              <line x1="23" y1="9" x2="17" y2="15"/>
                              <line x1="17" y1="9" x2="23" y2="15"/>
                            </svg>
                          ) : (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polygon points="11,5 6,9 2,9 2,15 6,15 11,19"/>
                              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                              <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                            </svg>
                          )}
                        </button>
                        <span className={styles.timeDisplay}>
                          {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                      </div>
                      <div className={styles.controlsRight}>
                        <button
                          className={`${styles.ctrlBtn} ${cinematic ? styles.ctrlActive : ''}`}
                          onClick={toggleCinematic}
                          aria-label="Toggle cinematic mode"
                          title="Cinematic mode (C)"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="7" width="20" height="10" rx="2"/>
                            <path d="M7 7V5M17 7V5M7 19v-2M17 19v-2"/>
                          </svg>
                        </button>
                        <button
                          className={`${styles.ctrlBtn} ${styles.fullscreenCtrl} ${fullscreen ? styles.ctrlActive : ''}`}
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
                        </button>
                      </div>
                    </div>
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

            {!cinematic && (
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
                    <span>Swipe or Arrow keys to navigate</span>
                    <span>C cinematic</span>
                    <span>F fullscreen</span>
                    <span>ESC close</span>
                  </div>
                )}
              </div>
            )}

            <div className={styles.modalGlow} />
            <div className={styles.modalEdge} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
