import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useEdits, useStats } from '../hooks/useFirebaseData'
import styles from './Stats.module.css'

const formatViews = (n) => {
  if (!n) return '0'
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

const AnimatedCounter = ({ target, duration = 1800 }) => {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true
        const start = Date.now()
        const tick = () => {
          const elapsed = Date.now() - start
          const progress = Math.min(elapsed / duration, 1)
          const ease = 1 - Math.pow(1 - progress, 3)
          setCount(Math.floor(ease * target))
          if (progress < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }
    }, { threshold: 0.3 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [target, duration])

  return <span ref={ref}>{count.toLocaleString()}</span>
}

const GlowBar = ({ value, max, color = 'var(--glow-blue)' }) => {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className={styles.barTrack}>
      <motion.div
        className={styles.barFill}
        style={{ background: color, boxShadow: `0 0 8px ${color}` }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 1, ease: [0.4, 0, 0.2, 1], delay: 0.3 }}
      />
    </div>
  )
}

export default function Stats() {
  const { edits } = useEdits()
  const stats = useStats()

  const sorted = [...edits].sort((a, b) => (b.views || 0) - (a.views || 0))
  const maxViews = sorted[0]?.views || 1

  const categoryCounts = edits.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + 1
    return acc
  }, {})

  const categoryEntries = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)

  const maxCat = categoryEntries[0]?.[1] || 1

  const totalViews = edits.reduce((sum, e) => sum + (e.views || 0), 0)

  const STAT_CARDS = [
    { label: 'Total Views', value: stats.totalViews || totalViews, icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    )},
    { label: 'Total Edits', value: stats.totalEdits || edits.length, icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    )},
    { label: 'Featured Works', value: edits.filter(e => e.featured).length, icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" opacity="0.8"/>
      </svg>
    )},
    { label: 'Avg Views / Edit', value: edits.length > 0 ? Math.round(totalViews / edits.length) : 0, icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
      </svg>
    )},
  ]

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <span className="label-tag">Tempest Stats — 04</span>
          <h1 className={styles.title}>Analytics</h1>
          <p className={styles.subtitle}>Live metrics from the Tempest Archive.</p>
          <div className={styles.liveTag}>
            <span className={styles.liveDot} />
            <span>Live Data</span>
          </div>
        </div>
        <div className={styles.headerGlow} />
      </div>

      <div className={styles.content}>
        <div className={styles.statCards}>
          {STAT_CARDS.map((card, i) => (
            <motion.div
              key={card.label}
              className={styles.statCard}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
            >
              <div className={styles.statCardIcon}>{card.icon}</div>
              <div className={styles.statCardValue}>
                <AnimatedCounter target={card.value} />
              </div>
              <div className={styles.statCardLabel}>{card.label}</div>
              <div className={styles.statCardGlow} />
            </motion.div>
          ))}
        </div>

        <div className={styles.twoCol}>
          <motion.div
            className={styles.panel}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div className={styles.panelHeader}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
              </svg>
              Most Viewed Edits
            </div>
            <div className={styles.rankList}>
              {sorted.slice(0, 6).map((edit, i) => (
                <div key={edit.id} className={styles.rankItem}>
                  <span className={`${styles.rankNum} ${i === 0 ? styles.gold : i === 1 ? styles.silver : i === 2 ? styles.bronze : ''}`}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className={styles.rankInfo}>
                    <span className={styles.rankTitle}>{edit.title}</span>
                    <GlowBar value={edit.views || 0} max={maxViews} />
                  </div>
                  <span className={styles.rankViews}>{formatViews(edit.views || 0)}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <div className={styles.rightCol}>
            <motion.div
              className={styles.panel}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <div className={styles.panelHeader}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                </svg>
                By Category
              </div>
              <div className={styles.catList}>
                {categoryEntries.map(([cat, count]) => (
                  <div key={cat} className={styles.catItem}>
                    <div className={styles.catItemTop}>
                      <span className={styles.catName}>{cat}</span>
                      <span className={styles.catCount}>{count}</span>
                    </div>
                    <GlowBar value={count} max={maxCat} color="var(--glow-teal)" />
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              className={styles.panel}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <div className={styles.panelHeader}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
                </svg>
                Recent Activity
                <span className={styles.livePill}>
                  <span className={styles.liveDotSm} /> Live
                </span>
              </div>
              <div className={styles.activityList}>
                {(stats.recentActivity || []).map((activity, i) => (
                  <div key={i} className={styles.activityItem}>
                    <div className={styles.activityDot} />
                    <div className={styles.activityInfo}>
                      <span className={styles.activityText}>
                        {activity.action} <strong>{activity.target}</strong>
                      </span>
                      <span className={styles.activityTime}>{activity.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
