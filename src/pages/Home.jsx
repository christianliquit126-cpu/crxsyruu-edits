import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useEdits, useStats } from '../hooks/useFirebaseData'
import GalleryCard from '../components/GalleryCard'
import VideoModal from '../components/VideoModal'
import styles from './Home.module.css'

const AnimatedCounter = ({ target, duration = 2000 }) => {
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
    }, { threshold: 0.5 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [target, duration])

  return <span ref={ref}>{count.toLocaleString()}</span>
}

export default function Home() {
  const { edits } = useEdits()
  const stats = useStats()
  const [selectedEdit, setSelectedEdit] = useState(null)
  const featured = edits.filter(e => e.featured).slice(0, 3)

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroContent}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
          >
            <span className="label-tag">Digital Realm — Tempest Flow</span>
            <h1 className={styles.heroTitle}>
              Crxsyruu<br />
              <span className={styles.heroTitleAccent}>Tempest</span>
            </h1>
            <p className={styles.heroSub}>
              Video editor. Storyteller. Slime enthusiast.<br />
              Crafting motion with the precision of the Great Sage.
            </p>
            <div className={styles.heroCTA}>
              <Link to="/gallery" className={styles.ctaPrimary}>
                Enter the Archive
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12,5 19,12 12,19"/>
                </svg>
                <span className={styles.btnGlow} />
              </Link>
              <Link to="/upload" className={styles.ctaSecondary}>
                Upload Edit
              </Link>
            </div>
          </motion.div>
        </div>

        <div className={styles.heroOrbs}>
          <div className={styles.orb1} />
          <div className={styles.orb2} />
          <div className={styles.orb3} />
        </div>
        <div className={styles.heroGrid} />
      </section>

      <section className={styles.statsBar}>
        <div className={styles.statsInner}>
          {[
            { label: 'Total Views', value: stats.totalViews || 0, suffix: '' },
            { label: 'Edits Created', value: stats.totalEdits || edits.length || 0, suffix: '' },
            { label: 'Years Active', value: 3, suffix: '+' },
            { label: 'Satisfaction', value: 100, suffix: '%' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              className={styles.statItem}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 + 0.5, duration: 0.5 }}
            >
              <span className={styles.statValue}>
                <AnimatedCounter target={stat.value} />
                {stat.suffix}
              </span>
              <span className={styles.statLabel}>{stat.label}</span>
            </motion.div>
          ))}
        </div>
      </section>

      <section className={styles.featured}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTag}>
            <span className="label-tag">Featured Works</span>
            <div className={styles.liveIndicator} />
          </div>
          <h2 className={styles.sectionTitle}>Highlighted Edits</h2>
          <Link to="/gallery" className={styles.seeAll}>
            View Full Archive
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12,5 19,12 12,19"/>
            </svg>
          </Link>
        </div>

        <div className={styles.featuredGrid}>
          {featured.map((edit, i) => (
            <GalleryCard
              key={edit.id}
              edit={edit}
              featured={i === 0}
              onOpen={setSelectedEdit}
            />
          ))}
        </div>
      </section>

      <section className={styles.about}>
        <div className={styles.aboutPanel}>
          <div className={styles.aboutLeft}>
            <span className="label-tag">About the Creator</span>
            <h2 className={styles.aboutTitle}>The Tempest Mind</h2>
            <p className={styles.aboutText}>
              Like Rimuru Tempest, I absorb techniques from every source — cinematic cuts,
              AMV flows, glitch art, and lofi aesthetics — blending them into edits that
              feel alive. Every frame is intentional. Every transition tells a story.
            </p>
            <p className={styles.aboutText}>
              Based in the digital realm. Specialized in anime edits, AMVs, and
              atmospheric video production. Available for commissions.
            </p>
            <div className={styles.aboutSkills}>
              {['Premiere Pro', 'After Effects', 'DaVinci Resolve', 'Audacity'].map(skill => (
                <span key={skill} className={styles.skill}>{skill}</span>
              ))}
            </div>
          </div>
          <div className={styles.aboutRight}>
            <div className={styles.avatarWrap}>
              <div className={styles.avatarRing1} />
              <div className={styles.avatarRing2} />
              <div className={styles.avatarCore}>
                <svg width="56" height="56" viewBox="0 0 64 64" fill="none">
                  <circle cx="32" cy="32" r="28" stroke="var(--glow-blue)" strokeWidth="1" opacity="0.4"/>
                  <polygon points="32,12 44,28 38,28 38,52 26,52 26,28 20,28" fill="var(--glow-blue)" opacity="0.85"/>
                  <circle cx="32" cy="32" r="6" fill="var(--glow-cyan)"/>
                  <circle cx="32" cy="32" r="2" fill="white"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.cta}>
        <div className={styles.ctaPanel}>
          <div className={styles.ctaGlow} />
          <h2 className={styles.ctaTitle}>Explore the Tempest Archive</h2>
          <p className={styles.ctaSub}>Browse all edits, filter by category, and experience the collection.</p>
          <Link to="/gallery" className={styles.ctaPrimary}>
            Open Archive
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            <span className={styles.btnGlow} />
          </Link>
        </div>
      </section>

      <VideoModal edit={selectedEdit} onClose={() => setSelectedEdit(null)} />
    </div>
  )
}
