import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import styles from './GalleryCard.module.css'

const formatViews = (n) => {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

const timeAgo = (ts) => {
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

export default function GalleryCard({ edit, onOpen, featured = false }) {
  const [tilted, setTilted] = useState({ x: 0, y: 0 })
  const [hovered, setHovered] = useState(false)
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50 })
  const cardRef = useRef(null)

  const handleMouseMove = (e) => {
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const cx = ((e.clientX - rect.left) / rect.width - 0.5) * 2
    const cy = ((e.clientY - rect.top) / rect.height - 0.5) * 2
    setTilted({ x: cy * -5, y: cx * 5 })
    setGlowPos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    })
  }

  const handleMouseLeave = () => {
    setTilted({ x: 0, y: 0 })
    setHovered(false)
  }

  return (
    <motion.div
      ref={cardRef}
      className={`${styles.card} ${featured ? styles.featured : ''}`}
      style={{
        transform: `perspective(800px) rotateX(${tilted.x}deg) rotateY(${tilted.y}deg)`,
        '--glow-x': `${glowPos.x}%`,
        '--glow-y': `${glowPos.y}%`,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={() => onOpen && onOpen(edit)}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      whileTap={{ scale: 0.98 }}
    >
      <div className={styles.cursorGlow} />

      {featured && (
        <div className={styles.featuredBadge}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
          </svg>
          Featured
        </div>
      )}

      <div className={styles.thumbWrap}>
        <img
          src={edit.thumbnail}
          alt={edit.title}
          className={styles.thumb}
          loading="lazy"
        />
        <div className={styles.thumbOverlay}>
          <div className={styles.playBtn}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5,3 19,12 5,21"/>
            </svg>
          </div>
        </div>
        <div className={styles.thumbGlow} />
      </div>

      <div className={styles.body}>
        <div className={styles.meta}>
          <span className={styles.category}>{edit.category}</span>
          <span className={styles.time}>{timeAgo(edit.uploadedAt)}</span>
        </div>
        <h3 className={styles.title}>{edit.title}</h3>
        <p className={styles.desc}>{edit.description}</p>
        <div className={styles.footer}>
          <div className={styles.views}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            <span>{formatViews(edit.views || 0)}</span>
          </div>
          <div className={styles.tags}>
            {(edit.tags || []).slice(0, 2).map((tag) => (
              <span key={tag} className={styles.tag}>{tag}</span>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.borderGlow} />
    </motion.div>
  )
}
