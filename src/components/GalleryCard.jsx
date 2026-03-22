import { useState, useRef, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import styles from './GalleryCard.module.css'
import { sounds } from '../lib/sound'

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

const formatViews = (n) => {
  if (!n) return '0'
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

const timeAgo = (ts) => {
  if (!ts) return ''
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

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

export default function GalleryCard({ edit, onOpen, featured = false, searchQuery = '', focused = false }) {
  const [tilted, setTilted] = useState({ x: 0, y: 0 })
  const [hovered, setHovered] = useState(false)
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50 })
  const [ripples, setRipples] = useState([])
  const [videoReady, setVideoReady] = useState(false)
  const [isHolding, setIsHolding] = useState(false)
  const [holdActive, setHoldActive] = useState(false)
  const [buffering, setBuffering] = useState(false)
  const [videoProgress, setVideoProgress] = useState(0)
  const cardRef = useRef(null)
  const videoRef = useRef(null)
  const holdTimerRef = useRef(null)
  const soundHoverRef = useRef(false)
  const isMobile = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
  const catColor = CATEGORY_COLORS[edit.category] || 'var(--glow-blue)'

  useEffect(() => {
    const video = videoRef.current
    if (!video || !edit.videoUrl) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting && !holdActive) {
          video.pause()
          video.currentTime = 0
          setVideoProgress(0)
        }
      },
      { threshold: 0.1 }
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

  const handleMouseMove = useCallback((e) => {
    if (isMobile) return
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const cx = ((e.clientX - rect.left) / rect.width - 0.5) * 2
    const cy = ((e.clientY - rect.top) / rect.height - 0.5) * 2
    setTilted({ x: cy * -7, y: cx * 7 })
    setGlowPos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    })
  }, [isMobile])

  const handleMouseEnter = useCallback(() => {
    if (isMobile) return
    setHovered(true)
    if (!soundHoverRef.current) {
      soundHoverRef.current = true
      sounds.hover()
    }
    if (videoRef.current && edit.videoUrl) {
      videoRef.current.play().catch(() => {})
    }
  }, [isMobile, edit.videoUrl])

  const handleMouseLeave = useCallback(() => {
    setTilted({ x: 0, y: 0 })
    setHovered(false)
    soundHoverRef.current = false
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

  const startHold = useCallback(() => {
    if (!edit.videoUrl) return
    holdTimerRef.current = setTimeout(() => {
      setHoldActive(true)
      setIsHolding(true)
      sounds.videoPlay()
      if (videoRef.current) {
        videoRef.current.muted = true
        videoRef.current.play().catch(() => {})
      }
    }, 250)
  }, [edit.videoUrl])

  const endHold = useCallback((e) => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }
    if (holdActive) {
      if (videoRef.current) {
        videoRef.current.pause()
        if (!hovered) videoRef.current.currentTime = 0
      }
      setHoldActive(false)
      setIsHolding(false)
      e?.preventDefault()
      e?.stopPropagation()
      return true
    }
    setIsHolding(false)
    return false
  }, [holdActive, hovered])

  const handleClick = useCallback((e) => {
    if (endHold(e)) return
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
  }, [edit, onOpen, endHold])

  const showVideo = (hovered && videoReady) || holdActive
  const showProgress = (showVideo || holdActive) && videoProgress > 0

  return (
    <motion.div
      ref={cardRef}
      className={`${styles.card} ${featured ? styles.featured : ''} ${holdActive ? styles.holding : ''} ${focused ? styles.focused : ''}`}
      style={{
        transform: isMobile
          ? undefined
          : `perspective(900px) rotateX(${tilted.x}deg) rotateY(${tilted.y}deg)`,
        '--glow-x': `${glowPos.x}%`,
        '--glow-y': `${glowPos.y}%`,
        '--cat-color': catColor,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={startHold}
      onMouseUp={endHold}
      onTouchStart={startHold}
      onTouchEnd={endHold}
      onClick={handleClick}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      whileTap={{ scale: 0.97 }}
      layout
    >
      {ripples.map(r => (
        <span
          key={r.id}
          className={styles.ripple}
          style={{ left: r.x, top: r.y }}
        />
      ))}

      <div className={styles.cursorGlow} />
      <div className={styles.edgeLighting} />
      <div className={styles.lightReflection} />
      <div className={styles.shadowDepth} />

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
        <img
          src={edit.thumbnail}
          alt={edit.title}
          className={`${styles.thumb} ${showVideo && edit.videoUrl ? styles.thumbHidden : ''}`}
          loading="lazy"
        />
        {edit.videoUrl && (
          <video
            ref={videoRef}
            src={edit.videoUrl}
            className={`${styles.hoverVideo} ${showVideo ? styles.hoverVideoVisible : ''}`}
            muted
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
          <span className={styles.category} style={{ color: catColor, borderColor: `color-mix(in srgb, ${catColor} 30%, transparent)`, boxShadow: `0 0 8px color-mix(in srgb, ${catColor} 20%, transparent)` }}>
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
      {featured && <div className={styles.featuredPulse} />}
    </motion.div>
  )
}
