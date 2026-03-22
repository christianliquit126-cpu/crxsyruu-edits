import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './VideoModal.module.css'
import { incrementView } from '../hooks/useFirebaseData'
import { sounds } from '../lib/sound'
import { session } from '../lib/session'

const timeAgo = (ts) => {
  if (!ts) return ''
  const d = Math.floor((Date.now() - ts) / 86400000)
  return d < 1 ? 'Today' : `${d} day${d !== 1 ? 's' : ''} ago`
}

const formatViews = (n) => {
  if (!n) return '0'
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

const formatTime = (s) => {
  if (!isFinite(s) || s < 0) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

const SPEEDS = [0.5, 1, 1.5, 2]

export default function VideoModal({ edit, onClose, edits = [], onNavigate, globalMute = false, onGlobalMuteChange }) {
  const overlayRef = useRef(null)
  const videoRef = useRef(null)
  const progressRef = useRef(null)
  const previewCanvasRef = useRef(null)
  const previewVideoRef = useRef(null)
  const viewTracked = useRef(false)
  const touchStartX = useRef(null)
  const saveTimer = useRef(null)

  const [buffering, setBuffering] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [muted, setMuted] = useState(() => session.getGlobalMute())
  const [volume, setVolume] = useState(() => session.getVolume())
  const [cinematic, setCinematic] = useState(false)
  const [controlsVisible, setControlsVisible] = useState(true)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [loop, setLoop] = useState(false)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [previewX, setPreviewX] = useState(0)
  const [previewTime, setPreviewTime] = useState(0)
  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewReady, setPreviewReady] = useState(false)

  const controlsTimeout = useRef(null)
  const currentIdx = edits.findIndex(e => e?.id === edit?.id)

  const showControls = useCallback(() => {
    setControlsVisible(true)
    clearTimeout(controlsTimeout.current)
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
      session.saveLastViewed(edit.id)
    }
    if (!edit) viewTracked.current = false
    setCurrentTime(0)
    setDuration(0)
    setPlaying(false)
    setSpeed(1)
    setLoop(false)
  }, [edit])

  useEffect(() => {
    const v = videoRef.current
    if (!v || !edit?.id) return
    const savedTime = session.getTimestamp(edit.id)
    if (savedTime > 0) {
      const onLoaded = () => {
        if (savedTime < v.duration - 3) {
          v.currentTime = savedTime
        }
      }
      v.addEventListener('loadedmetadata', onLoaded, { once: true })
    }
    v.volume = session.getVolume()
    v.muted = session.getGlobalMute()
    setMuted(v.muted)
    setVolume(v.volume)
  }, [edit])

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    v.muted = globalMute
    setMuted(globalMute)
  }, [globalMute])

  useEffect(() => {
    return () => {
      if (edit?.id && videoRef.current) {
        const t = videoRef.current.currentTime
        if (t > 3) session.saveTimestamp(edit.id, t)
      }
    }
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
      if (e.key === ' ') { e.preventDefault(); togglePlay() }
      if (e.key === 'm' || e.key === 'M') toggleMute()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [edit, onClose, goNext, goPrev])

  useEffect(() => {
    return () => clearTimeout(controlsTimeout.current)
  }, [])

  const handleBackdrop = (e) => {
    if (e.target === overlayRef.current) { sounds.close(); onClose() }
  }

  const handleClose = () => {
    if (edit?.id && videoRef.current) {
      const t = videoRef.current.currentTime
      if (t > 3) session.saveTimestamp(edit.id, t)
    }
    sounds.close()
    onClose()
  }

  const toggleFullscreen = () => {
    const el = videoRef.current?.closest('.' + styles.modal) || videoRef.current
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
    const v = videoRef.current
    if (!v) return
    const next = !v.muted
    v.muted = next
    setMuted(next)
    session.setGlobalMute(next)
    onGlobalMuteChange?.(next)
    sounds.tap()
  }

  const togglePlay = () => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) {
      v.play().catch(() => {})
    } else {
      v.pause()
    }
    sounds.tap()
  }

  const toggleLoop = () => {
    setLoop(l => {
      const next = !l
      if (videoRef.current) videoRef.current.loop = next
      sounds.toggle()
      return next
    })
  }

  const setPlaySpeed = (s) => {
    setSpeed(s)
    if (videoRef.current) videoRef.current.playbackRate = s
    setShowSpeedMenu(false)
    sounds.tap()
  }

  const handleVolumeChange = (e) => {
    const v = parseFloat(e.target.value)
    setVolume(v)
    if (videoRef.current) {
      videoRef.current.volume = v
      videoRef.current.muted = v === 0
      setMuted(v === 0)
    }
    session.saveVolume(v)
  }

  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const handleTimeUpdate = () => {
    const v = videoRef.current
    if (!v) return
    const t = v.currentTime
    const d = v.duration
    setCurrentTime(t)
    if (d) setDuration(d)
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      if (edit?.id && t > 3) session.saveTimestamp(edit.id, t)
    }, 5000)
  }

  const handleProgressClick = (e) => {
    const v = videoRef.current
    const track = progressRef.current
    if (!v || !track) return
    const rect = track.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    v.currentTime = pct * v.duration
    sounds.tap()
  }

  const handleProgressHover = useCallback((e) => {
    const track = progressRef.current
    if (!track || !duration) return
    const rect = track.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const t = pct * duration
    setPreviewX(e.clientX - rect.left)
    setPreviewTime(t)
    setPreviewVisible(true)

    const pv = previewVideoRef.current
    const canvas = previewCanvasRef.current
    if (!pv || !canvas || !edit?.videoUrl) return
    if (!previewReady) {
      pv.src = edit.videoUrl
      pv.addEventListener('loadedmetadata', () => setPreviewReady(true), { once: true })
    }
    if (previewReady) {
      pv.currentTime = t
      pv.addEventListener('seeked', () => {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          canvas.width = 160
          canvas.height = 90
          ctx.drawImage(pv, 0, 0, 160, 90)
        }
      }, { once: true })
    }
  }, [duration, edit, previewReady])

  const handleProgressLeave = () => {
    setPreviewVisible(false)
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

  const handleVideoClick = () => {
    togglePlay()
    showControls()
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
            <div className={styles.animatedBorder} />

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
                <div className={styles.videoContainer} onMouseMove={showControls} onClick={handleVideoClick}>
                  <video
                    ref={videoRef}
                    src={edit.videoUrl}
                    controls={false}
                    autoPlay
                    playsInline
                    loop={loop}
                    className={styles.video}
                    onWaiting={() => setBuffering(true)}
                    onPlaying={() => { setBuffering(false); setPlaying(true); showControls() }}
                    onPause={() => { setPlaying(false); setControlsVisible(true) }}
                    onCanPlay={() => setBuffering(false)}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleTimeUpdate}
                    onEnded={() => { setPlaying(false); setControlsVisible(true) }}
                  />

                  {!playing && !buffering && (
                    <div className={styles.pauseOverlay}>
                      <div className={styles.pauseIcon}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="5,3 19,12 5,21"/>
                        </svg>
                      </div>
                    </div>
                  )}

                  {buffering && (
                    <div className={styles.bufferingOverlay}>
                      <div className={styles.bufferingRing}>
                        <div className={styles.bufferingSpinner} />
                      </div>
                      <span className={styles.bufferingText}>Loading</span>
                    </div>
                  )}

                  <div className={`${styles.videoControls} ${controlsVisible ? styles.controlsVisible : ''}`}>
                    <div
                      className={styles.progressTrack}
                      ref={progressRef}
                      onClick={handleProgressClick}
                      onMouseMove={handleProgressHover}
                      onMouseLeave={handleProgressLeave}
                      role="slider"
                      aria-label="Video progress"
                    >
                      <div className={styles.progressBuffer} />
                      <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                      <div className={styles.progressThumb} style={{ left: `${progress}%` }} />

                      {previewVisible && (
                        <div
                          className={styles.timelinePreview}
                          style={{ left: Math.max(80, Math.min(previewX, (progressRef.current?.offsetWidth || 300) - 80)) }}
                        >
                          <canvas ref={previewCanvasRef} className={styles.previewCanvas} width="160" height="90" />
                          <video ref={previewVideoRef} className={styles.previewVideoHidden} muted playsInline preload="metadata" />
                          <span className={styles.previewTime}>{formatTime(previewTime)}</span>
                        </div>
                      )}
                    </div>

                    <div className={styles.controlsRow}>
                      <div className={styles.controlsLeft}>
                        <button className={styles.ctrlBtn} onClick={(e) => { e.stopPropagation(); togglePlay() }} aria-label={playing ? 'Pause' : 'Play'}>
                          {playing ? (
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                              <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
                            </svg>
                          ) : (
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                              <polygon points="5,3 19,12 5,21"/>
                            </svg>
                          )}
                        </button>

                        <div className={styles.volumeWrap}>
                          <button
                            className={styles.ctrlBtn}
                            onClick={(e) => { e.stopPropagation(); toggleMute() }}
                            onMouseEnter={() => setShowVolumeSlider(true)}
                            aria-label="Toggle mute"
                          >
                            {muted || volume === 0 ? (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="11,5 6,9 2,9 2,15 6,15 11,19"/>
                                <line x1="23" y1="9" x2="17" y2="15"/>
                                <line x1="17" y1="9" x2="23" y2="15"/>
                              </svg>
                            ) : (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="11,5 6,9 2,9 2,15 6,15 11,19"/>
                                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                                <path d={volume > 0.5 ? "M19.07 4.93a10 10 0 0 1 0 14.14" : ""}/>
                              </svg>
                            )}
                          </button>
                          {showVolumeSlider && (
                            <div
                              className={styles.volumeSliderWrap}
                              onMouseLeave={() => setShowVolumeSlider(false)}
                              onClick={e => e.stopPropagation()}
                            >
                              <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={muted ? 0 : volume}
                                onChange={handleVolumeChange}
                                className={styles.volumeSlider}
                                aria-label="Volume"
                              />
                            </div>
                          )}
                        </div>

                        <span className={styles.timeDisplay}>
                          {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                      </div>

                      <div className={styles.controlsRight}>
                        <div className={styles.speedWrap}>
                          <button
                            className={`${styles.ctrlBtn} ${styles.speedBtn}`}
                            onClick={(e) => { e.stopPropagation(); setShowSpeedMenu(s => !s) }}
                            aria-label="Playback speed"
                          >
                            {speed}x
                          </button>
                          {showSpeedMenu && (
                            <div className={styles.speedMenu} onClick={e => e.stopPropagation()}>
                              {SPEEDS.map(s => (
                                <button
                                  key={s}
                                  className={`${styles.speedOption} ${speed === s ? styles.speedActive : ''}`}
                                  onClick={() => setPlaySpeed(s)}
                                >
                                  {s}x
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <button
                          className={`${styles.ctrlBtn} ${loop ? styles.ctrlActive : ''}`}
                          onClick={(e) => { e.stopPropagation(); toggleLoop() }}
                          aria-label="Toggle loop"
                          title="Loop"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="17,1 21,5 17,9"/>
                            <path d="M3,11V9a4,4,0,0,1,4-4h14"/>
                            <polyline points="7,23 3,19 7,15"/>
                            <path d="M21,13v2a4,4,0,0,1-4,4H3"/>
                          </svg>
                        </button>

                        <button
                          className={`${styles.ctrlBtn} ${cinematic ? styles.ctrlActive : ''}`}
                          onClick={(e) => { e.stopPropagation(); toggleCinematic() }}
                          aria-label="Toggle cinematic mode"
                          title="Cinematic (C)"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="7" width="20" height="10" rx="2"/>
                            <path d="M7 7V5M17 7V5M7 19v-2M17 19v-2"/>
                          </svg>
                        </button>

                        <button
                          className={`${styles.ctrlBtn} ${styles.fullscreenCtrl} ${fullscreen ? styles.ctrlActive : ''}`}
                          onClick={(e) => { e.stopPropagation(); toggleFullscreen() }}
                          aria-label="Toggle fullscreen"
                        >
                          {fullscreen ? (
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="8,3 3,3 3,8"/><polyline points="21,8 21,3 16,3"/>
                              <polyline points="3,16 3,21 8,21"/><polyline points="16,21 21,21 21,16"/>
                            </svg>
                          ) : (
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                    <span>Swipe / Arrows to navigate</span>
                    <span>Space play/pause</span>
                    <span>C cinematic</span>
                    <span>F fullscreen</span>
                    <span>M mute</span>
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
