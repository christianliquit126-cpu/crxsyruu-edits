import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './GalleryCard.module.css'
import { sounds } from '../lib/sound'
import { getVideoThumbnailFromUrl } from '../lib/cloudinary'
import { formatViews, timeAgo } from '../lib/formatters'

const CATEGORY_COLORS = {
  AMV: 'var(--glow-blue)',
  Cinematic: 'var(--glow-purple)',
  Action: 'var(--glow-pink)',
  Lofi: 'var(--glow-teal)',
  ASMR: 'var(--glow-cyan)',
  Glitch: 'var(--glow-pink)',
  Montage: 'var(--glow-blue)',
  'Short Film': 'var(--glow-purple)',
}

const isMobileDevice = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

function HighlightText({ text, query }) {
  if (!query || !text) return <>{text}</>
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark className={styles.highlight}>{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  )
}

const LONG_PRESS_MENU_MS = 600
const DOUBLE_TAP_MS = 300

export default function GalleryCard({
  edit,
  onOpen,
  featured = false,
  searchQuery = '',
  focused = false,
  heatScore = 0,
  onNavigate,
  allEdits = [],
  globalMute = false,
}) {
  const [hovered, setHovered] = useState(false)
  const [ripples, setRipples] = useState([])
  const [videoReady, setVideoReady] = useState(false)
  const [isHolding, setIsHolding] = useState(false)
  const [holdActive, setHoldActive] = useState(false)
  const [buffering, setBuffering] = useState(false)
  const [videoProgress, setVideoProgress] = useState(0)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgError, setImgError] = useState(false)
  const [showLongPressMenu, setShowLongPressMenu] = useState(false)
  const [doubleTapBurst, setDoubleTapBurst] = useState(false)
  const [inView, setInView] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)

  const cardRef = useRef(null)
  const videoRef = useRef(null)
  const holdTimerRef = useRef(null)
  const longPressTimerRef = useRef(null)
  const soundHoverRef = useRef(false)
  const lastTapRef = useRef(0)
  const touchStartRef = useRef(null)
  const draggingRef = useRef(false)
  const longPressActiveRef = useRef(false)
  const rafRef = useRef(null)
  const pendingMouseRef = useRef(null)

  const catColor = CATEGORY_COLORS[edit.category] || 'var(--glow-blue)'
  const thumbnail = edit.thumbnail || getVideoThumbnailFromUrl(edit.videoUrl)

  useEffect(() => {
    if (!showLongPressMenu) return
    const handler = (e) => {
      if (e.key === 'Escape') setShowLongPressMenu(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [showLongPressMenu])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !edit.videoUrl) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting)
        if (!entry.isIntersecting && !holdActive) {
          video.pause()
          video.currentTime = 0
          setVideoProgress(0)
          setVideoReady(false)
        }
      },
      { threshold: 0.1, rootMargin: '80px' }
    )
    if (cardRef.current) obs.observe(cardRef.current)
    return () => obs.disconnect()
  }, [edit.videoUrl, holdActive])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const onTimeUpdate = () => {
      if (video.duration) setVideoProgress((video.currentTime / video.duration) * 100)
    }
    video.addEventListener('timeupdate', onTimeUpdate)
    return () => video.removeEventListener('timeupdate', onTimeUpdate)
  }, [])

  useEffect(() => {
    if (focused && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
    }
  }, [focused])

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const applyMouseTransform = useCallback(() => {
    const card = cardRef.current
    const data = pendingMouseRef.current
    if (!card || !data) return
    card.style.transform = `perspective(900px) rotateX(${data.ry}deg) rotateY(${data.rx}deg)`
    card.style.setProperty('--glow-x', `${data.gx}%`)
    card.style.setProperty('--glow-y', `${data.gy}%`)
    card.style.setProperty('--trail-x', `${data.gx}%`)
    card.style.setProperty('--trail-y', `${data.gy}%`)
    rafRef.current = null
  }, [])

  const handleMouseMove = useCallback((e) => {
    if (isMobileDevice) return
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const cx = ((e.clientX - rect.left) / rect.width - 0.5) * 2
    const cy = ((e.clientY - rect.top) / rect.height - 0.5) * 2
    const gx = ((e.clientX - rect.left) / rect.width) * 100
    const gy = ((e.clientY - rect.top) / rect.height) * 100
    pendingMouseRef.current = { rx: cx * 7, ry: cy * -7, gx, gy }
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(applyMouseTransform)
    }
  }, [applyMouseTransform])

  const handleMouseEnter = useCallback(() => {
    if (isMobileDevice) return
    setHovered(true)
    if (!soundHoverRef.current) {
      soundHoverRef.current = true
      sounds.hover()
    }
    const video = videoRef.current
    if (video && edit.videoUrl && inView) {
      if (!video.src || video.src === '') {
        video.src = edit.videoUrl
        video.load()
      }
      video.muted = globalMute
      video.play().catch(() => {})
    }
  }, [edit.videoUrl, globalMute, inView])

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current
    if (card) {
      card.style.transform = ''
      card.style.setProperty('--glow-x', '50%')
      card.style.setProperty('--glow-y', '50%')
      card.style.setProperty('--trail-x', '50%')
      card.style.setProperty('--trail-y', '50%')
    }
    pendingMouseRef.current = null
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    setHovered(false)
    soundHoverRef.current = false
    setShowLongPressMenu(false)
    longPressActiveRef.current = false
    clearTimeout(longPressTimerRef.current)
    if (videoRef.current && !holdActive) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
      setVideoProgress(0)
    }
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }
    setIsHolding(false)
    setHoldActive(false)
  }, [holdActive])

  const startHold = useCallback((e) => {
    touchStartRef.current = {
      x: e.touches?.[0]?.clientX ?? e.clientX,
      y: e.touches?.[0]?.clientY ?? e.clientY,
      time: Date.now(),
    }
    draggingRef.current = false
    longPressActiveRef.current = false

    longPressTimerRef.current = setTimeout(() => {
      if (!draggingRef.current) {
        longPressActiveRef.current = true
        setShowLongPressMenu(true)
        sounds.toggle()
      }
    }, LONG_PRESS_MENU_MS)

    if (!edit.videoUrl) return
    holdTimerRef.current = setTimeout(() => {
      if (!longPressActiveRef.current && !draggingRef.current) {
        setHoldActive(true)
        setIsHolding(true)
        sounds.videoPlay()
        const video = videoRef.current
        if (video) {
          if (!video.src || video.src === '') {
            video.src = edit.videoUrl
            video.load()
          }
          video.muted = globalMute
          video.play().catch(() => {})
        }
      }
    }, 280)
  }, [edit.videoUrl, globalMute])

  const handleTouchMove = useCallback((e) => {
    if (!touchStartRef.current) return
    const dx = Math.abs((e.touches[0]?.clientX ?? 0) - touchStartRef.current.x)
    const dy = Math.abs((e.touches[0]?.clientY ?? 0) - touchStartRef.current.y)
    if (dx > 12 || dy > 12) {
      draggingRef.current = true
      clearTimeout(longPressTimerRef.current)
      clearTimeout(holdTimerRef.current)
    }
  }, [])

  const endHold = useCallback((e) => {
    clearTimeout(longPressTimerRef.current)
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }
    if (longPressActiveRef.current) {
      longPressActiveRef.current = false
      return true
    }
    if (holdActive) {
      if (videoRef.current) {
        videoRef.current.pause()
        if (!hovered) videoRef.current.currentTime = 0
      }
      setHoldActive(false)
      setIsHolding(false)
      e?.preventDefault?.()
      e?.stopPropagation?.()
      return true
    }
    setIsHolding(false)
    return false
  }, [holdActive, hovered])

  const handleClick = useCallback((e) => {
    if (showLongPressMenu) { setShowLongPressMenu(false); return }
    if (draggingRef.current) return
    if (endHold(e)) return

    const now = Date.now()
    const dt = now - lastTapRef.current
    lastTapRef.current = now

    if (dt < DOUBLE_TAP_MS) {
      setDoubleTapBurst(true)
      sounds.success()
      setTimeout(() => setDoubleTapBurst(false), 900)
      return
    }

    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const x = (e.clientX || e.touches?.[0]?.clientX || rect.left + rect.width / 2) - rect.left
    const y = (e.clientY || e.touches?.[0]?.clientY || rect.top + rect.height / 2) - rect.top
    const id = Date.now()
    setRipples(prev => [...prev, { id, x, y }])
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 700)
    sounds.tap()
    onOpen && onOpen(edit)
  }, [edit, onOpen, endHold, showLongPressMenu])

  const handleLongPressAction = (action) => {
    setShowLongPressMenu(false)
    sounds.tap()
    if (action === 'view') onOpen && onOpen(edit)
    if (action === 'fullscreen') onOpen && onOpen(edit)
    if (action === 'share') {
      if (navigator.share) {
        navigator.share({ title: edit.title, text: edit.description || '' }).catch(() => {})
      } else {
        try {
          navigator.clipboard.writeText(window.location.href)
          setShareCopied(true)
          setTimeout(() => setShareCopied(false), 2200)
        } catch {}
      }
    }
  }

  const showVideo = (hovered && videoReady) || holdActive
  const showProgress = (showVideo || holdActive) && videoProgress > 0
  const heatOpacity = Math.min(heatScore / 50, 1)

  return (
    <motion.div
      ref={cardRef}
      className={`${styles.card} ${featured ? styles.featured : ''} ${holdActive ? styles.holding : ''} ${focused ? styles.focused : ''}`}
      style={{
        '--cat-color': catColor,
        '--heat-opacity': heatOpacity,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={startHold}
      onMouseUp={endHold}
      onTouchStart={startHold}
      onTouchMove={handleTouchMove}
      onTouchEnd={endHold}
      onClick={handleClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.36, ease: [0.4, 0, 0.2, 1] }}
      whileTap={{ scale: 0.97 }}
    >
      {ripples.map(r => (
        <span key={r.id} className={styles.ripple} style={{ left: r.x, top: r.y }} />
      ))}

      {doubleTapBurst && (
        <div className={styles.doubleTapBurst}>
          <svg viewBox="0 0 100 100" width="100" height="100">
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
              <line
                key={i}
                x1="50" y1="50"
                x2={50 + 38 * Math.cos((angle * Math.PI) / 180)}
                y2={50 + 38 * Math.sin((angle * Math.PI) / 180)}
                stroke="var(--glow-cyan)"
                strokeWidth="1.5"
                strokeLinecap="round"
                className={styles.burstRay}
                style={{ animationDelay: `${i * 0.03}s` }}
              />
            ))}
            <circle cx="50" cy="50" r="8" fill="none" stroke="var(--glow-blue)" strokeWidth="1.5" className={styles.burstCircle} />
            <circle cx="50" cy="50" r="3" fill="var(--glow-cyan)" className={styles.burstCore} />
          </svg>
        </div>
      )}

      {shareCopied && (
        <div className={styles.shareToast}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20,6 9,17 4,12"/>
          </svg>
          Link copied!
        </div>
      )}

      <div className={styles.cursorGlow} />
      <div className={styles.edgeLighting} />
      <div className={styles.lightReflection} />
      <div className={styles.shadowDepth} />
      <div className={styles.highlightTrail} />

      {heatScore > 5 && (
        <div className={styles.heatIndicator} style={{ opacity: 0.4 + heatOpacity * 0.6 }}>
          <div className={styles.heatBar} style={{ width: `${Math.min(100, heatScore * 2)}%` }} />
        </div>
      )}

      {featured && (
        <div className={styles.featuredBadge}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
          </svg>
          Featured
        </div>
      )}

      {holdActive && (
        <div className={styles.holdIndicator}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5,3 19,12 5,21"/>
          </svg>
          <span>Previewing</span>
        </div>
      )}

      <div className={styles.thumbWrap}>
        {!imgLoaded && !imgError && (
          <div className={styles.blurPlaceholder} />
        )}
        {imgError && (
          <div className={styles.blurPlaceholder} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(56,189,248,0.3)" strokeWidth="1">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21,15 16,10 5,21"/>
            </svg>
          </div>
        )}
        {thumbnail && !imgError && (
          <img
            src={thumbnail}
            alt={edit.title}
            className={`${styles.thumb} ${showVideo && edit.videoUrl ? styles.thumbHidden : ''} ${imgLoaded ? styles.thumbLoaded : styles.thumbLoading}`}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            onError={() => { setImgError(true); setImgLoaded(true) }}
          />
        )}
        {edit.videoUrl && (
          <video
            ref={videoRef}
            className={`${styles.hoverVideo} ${showVideo ? styles.hoverVideoVisible : ''}`}
            muted={globalMute}
            loop
            playsInline
            preload="none"
            onCanPlay={() => setVideoReady(true)}
            onWaiting={() => setBuffering(true)}
            onPlaying={() => setBuffering(false)}
          />
        )}
        {buffering && (hovered || holdActive) && (
          <div className={styles.bufferingRing}>
            <div className={styles.bufferingSpinner} />
          </div>
        )}
        <div className={styles.thumbOverlay}>
          <div className={styles.playBtn}>
            {edit.videoUrl ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5,3 19,12 5,21"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
              </svg>
            )}
          </div>
        </div>
        <div className={styles.thumbGlow} />
        {edit.videoUrl && (
          <div className={styles.videoIndicator}>
            {holdActive ? (
              <span className={styles.playingDot} />
            ) : (
              <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5,3 19,12 5,21"/>
              </svg>
            )}
            {holdActive ? 'Playing' : 'Video'}
          </div>
        )}
        {showProgress && (
          <div className={styles.videoProgress}>
            <div className={styles.videoProgressFill} style={{ width: `${videoProgress}%` }} />
          </div>
        )}
      </div>

      <div className={styles.body}>
        <div className={styles.meta}>
          <span className={styles.category} style={{ color: catColor, borderColor: `color-mix(in srgb, ${catColor} 30%, transparent)` }}>
            {edit.category}
          </span>
          <span className={styles.time}>{timeAgo(edit.uploadedAt)}</span>
        </div>
        <h3 className={styles.title}>
          <HighlightText text={edit.title} query={searchQuery} />
        </h3>
        {edit.description && (
          <p className={styles.desc}>
            <HighlightText text={edit.description} query={searchQuery} />
          </p>
        )}
        <div className={styles.footer}>
          <div className={styles.views}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            <span>{formatViews(edit.views || 0)}</span>
          </div>
          <div className={styles.tags}>
            {(edit.tags || []).slice(0, 2).map((tag) => (
              <span key={tag} className={styles.tag} style={{ '--tag-color': catColor }}>
                <HighlightText text={tag} query={searchQuery} />
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.borderGlow} />
      <div className={styles.animatedBorder} />
      {featured && <div className={styles.featuredPulse} />}

      <AnimatePresence>
        {showLongPressMenu && (
          <motion.div
            className={styles.longPressMenu}
            initial={{ opacity: 0, scale: 0.88, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 4 }}
            transition={{ duration: 0.16, ease: [0.4, 0, 0.2, 1] }}
            onClick={e => e.stopPropagation()}
          >
            <button className={styles.menuItem} onClick={() => handleLongPressAction('view')}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5,3 19,12 5,21"/>
              </svg>
              View
            </button>
            <button className={styles.menuItem} onClick={() => handleLongPressAction('fullscreen')}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15,3 21,3 21,9"/><polyline points="9,21 3,21 3,15"/>
                <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
              </svg>
              Fullscreen
            </button>
            <button className={styles.menuItem} onClick={() => handleLongPressAction('share')}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
              Share
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
