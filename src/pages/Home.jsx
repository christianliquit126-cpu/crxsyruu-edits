import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useEdits, useStats } from '../hooks/useFirebaseData'
import { isConfigured } from '../lib/firebase'
import GalleryCard from '../components/GalleryCard'
import VideoModal from '../components/VideoModal'
import styles from './Home.module.css'

const AnimatedCounter = ({ target, duration = 2000 }) => {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    if (!target) return
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

const EnergyLine = ({ style, delay = 0 }) => (
  <div className={styles.energyLine} style={{ ...style, animationDelay: `${delay}s` }} />
)

export default function Home() {
  const { edits } = useEdits()
  const stats = useStats()
  const [selectedEdit, setSelectedEdit] = useState(null)
  const featured = edits.filter(e => e.featured).slice(0, 3)

  const totalViews = stats.totalViews || edits.reduce((s, e) => s + (e.views || 0), 0)
  const totalEdits = stats.totalEdits || edits.length

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroOrbs}>
          <div className={styles.orb1} />
          <div className={styles.orb2} />
          <div className={styles.orb3} />
        </div>
        <div className={styles.heroGrid} />
        <div className={styles.energyLines}>
          <EnergyLine style={{ top: '20%', left: 0, width: '40%' }} delay={0} />
          <EnergyLine style={{ top: '60%', right: 0, width: '30%', animationDirection: 'reverse' }} delay={1.2} />
          <EnergyLine style={{ bottom: '30%', left: '10%', width: '20%' }} delay={0.6} />
        </div>

        <div className={styles.heroContent}>
          <motion.div
            initial={{ opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: [0.4, 0, 0.2, 1] }}
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
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12,5 19,12 12,19"/>
                </svg>
                <span className={styles.btnGlow} />
              </Link>
              <Link to="/upload" className={styles.ctaSecondary}>Upload Edit</Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className={styles.statsBar}>
        <div className={styles.statsInner}>
          {[
            { label: 'Total Views', value: totalViews, suffix: '' },
            { label: 'Edits Created', value: totalEdits, suffix: '' },
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
          <div>
            <div className={styles.sectionTag}>
              <span className="label-tag">Featured Works</span>
              <div className={styles.liveIndicator} />
            </div>
            <h2 className={styles.sectionTitle}>Highlighted Edits</h2>
          </div>
          <Link to="/gallery" className={styles.seeAll}>
            View Full Archive
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12,5 19,12 12,19"/>
            </svg>
          </Link>
        </div>

        {featured.length > 0 ? (
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
        ) : (
          <div className={styles.emptyFeatured}>
            <div className={styles.emptyIcon}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
              </svg>
            </div>
            {isConfigured ? (
              <>
                <p>No featured edits yet</p>
                <span>Upload an edit and mark it as featured to see it here</span>
              </>
            ) : (
              <>
                <p>Firebase not configured</p>
                <span>Add Firebase credentials to load live data from your archive</span>
              </>
            )}
            <Link to="/upload" className={styles.emptyBtn}>
              Upload First Edit
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="16,16 12,12 8,16"/>
                <line x1="12" y1="12" x2="12" y2="21"/>
                <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/>
              </svg>
            </Link>
          </div>
        )}
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
              <div className={styles.avatarRing3} />
              <div className={styles.avatarCore}>
                <svg width="52" height="52" viewBox="0 0 64 64" fill="none">
                  <circle cx="32" cy="32" r="28" stroke="var(--glow-blue)" strokeWidth="1" opacity="0.4"/>
                  <polygon points="32,12 44,28 38,28 38,52 26,52 26,28 20,28" fill="var(--glow-blue)" opacity="0.9"/>
                  <circle cx="32" cy="32" r="6" fill="var(--glow-cyan)"/>
                  <circle cx="32" cy="32" r="2.5" fill="white"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.cta}>
        <div className={styles.ctaPanel}>
          <div className={styles.ctaGlow} />
          <div className={styles.ctaEnergyLines}>
            <EnergyLine style={{ top: '30%', left: 0, width: '60%' }} delay={0} />
            <EnergyLine style={{ bottom: '30%', right: 0, width: '50%', animationDirection: 'reverse' }} delay={0.8} />
          </div>
          <h2 className={styles.ctaTitle}>Explore the Tempest Archive</h2>
          <p className={styles.ctaSub}>Browse all edits, filter by category, and experience the collection.</p>
          <Link to="/gallery" className={styles.ctaPrimary}>
            Open Archive
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
