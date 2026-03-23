import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useEdits, useStats } from '../hooks/useFirebaseData'
import { isConfigured } from '../lib/firebase'
import GalleryCard from '../components/GalleryCard'
import VideoModal from '../components/VideoModal'
import AnimatedCounter from '../components/AnimatedCounter'
import styles from './Home.module.css'
import { useScrollFade } from '../hooks/useScrollFade'
import { sounds } from '../lib/sound'
import { session } from '../lib/session'
import { getDynamicFeatured } from '../lib/scoring'

const SKILLS = [
  { name: 'Color Grading', score: 96, color: 'var(--glow-blue)' },
  { name: 'Cinematic Editing', score: 94, color: 'var(--glow-cyan)' },
  { name: 'Narrative Craft', score: 92, color: 'var(--glow-teal)' },
  { name: 'AMV Composition', score: 91, color: 'var(--glow-blue)' },
  { name: 'Audio Synchronize', score: 89, color: 'var(--glow-cyan)' },
  { name: 'Motion Graphics', score: 87, color: 'var(--glow-purple)' },
]

function SkillBar({ name, score, color, delay = 0 }) {
  const [animated, setAnimated] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setAnimated(true) },
      { threshold: 0.3 }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  return (
    <div ref={ref} className={styles.skillRow} style={{ transitionDelay: `${delay}s` }}>
      <div className={styles.skillMeta}>
        <span className={styles.skillName}>{name}</span>
        <span className={styles.skillScore} style={{ color }}>{score}</span>
      </div>
      <div className={styles.skillTrack}>
        <div
          className={styles.skillFill}
          style={{
            width: animated ? `${score}%` : '0%',
            background: `linear-gradient(90deg, ${color}, color-mix(in srgb, ${color} 60%, var(--glow-cyan)))`,
            boxShadow: `0 0 10px color-mix(in srgb, ${color} 45%, transparent)`,
            transitionDelay: `${delay}s`,
          }}
        />
        <div
          className={styles.skillThumb}
          style={{
            left: animated ? `${score}%` : '0%',
            background: color,
            boxShadow: `0 0 8px ${color}`,
            transitionDelay: `${delay}s`,
          }}
        />
      </div>
    </div>
  )
}

const EnergyLine = ({ style, delay = 0 }) => (
  <div className={styles.energyLine} style={{ ...style, animationDelay: `${delay}s` }} />
)

function FadeSection({ children, className, style, delay = 0 }) {
  const ref = useScrollFade()
  return (
    <div ref={ref} className={className} style={{ ...style, transitionDelay: `${delay}s` }}>
      {children}
    </div>
  )
}

const STAT_ITEMS = [
  {
    label: 'Total Views',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    ),
  },
  {
    label: 'Edits Created',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polygon points="23,7 16,12 23,17"/>
        <rect x="1" y="5" width="15" height="14" rx="2"/>
      </svg>
    ),
  },
  {
    label: 'Years Active',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12,6 12,12 16,14"/>
      </svg>
    ),
  },
  {
    label: 'Client Satisfaction',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
      </svg>
    ),
  },
]

export default function Home({ globalMute = false, onGlobalMuteChange }) {
  const { edits } = useEdits()
  const stats = useStats()
  const [selectedEdit, setSelectedEdit] = useState(null)
  const [restoredEdit, setRestoredEdit] = useState(null)
  const [scanActive, setScanActive] = useState(false)
  const skillRef = useRef(null)

  useEffect(() => {
    document.title = 'Crxsyruu Tempest — Home'
  }, [])

  const manualFeatured = edits.filter(e => e.featured).slice(0, 3)
  const featured = manualFeatured.length > 0 ? manualFeatured : getDynamicFeatured(edits)

  const totalViews = stats.totalViews || edits.reduce((s, e) => s + (e.views || 0), 0)
  const totalEdits = stats.totalEdits || edits.length

  useEffect(() => {
    if (edits.length === 0) return
    const lastId = session.getLastViewed()
    if (lastId) {
      const match = edits.find(e => e.id === lastId)
      if (match) setRestoredEdit(match)
    }
  }, [edits])

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setScanActive(true) },
      { threshold: 0.2 }
    )
    if (skillRef.current) obs.observe(skillRef.current)
    return () => obs.disconnect()
  }, [])

  const handleOpenEdit = (edit) => {
    sounds.open()
    session.saveLastViewed(edit.id)
    setSelectedEdit(edit)
  }

  const handleRestoreEdit = () => {
    if (restoredEdit) {
      handleOpenEdit(restoredEdit)
      setRestoredEdit(null)
    }
  }

  const statValues = [totalViews, totalEdits, 3, 100]
  const statSuffixes = ['', '', '+', '%']

  return (
    <div className={styles.page}>
      {restoredEdit && (
        <motion.div
          className={styles.restoreBanner}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
        >
          <div className={styles.restoreInner}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="1,4 1,10 7,10"/>
              <path d="M3.51,15a9,9,0,1,0,.49-4.95"/>
            </svg>
            <span>Resume where you left off — <strong>{restoredEdit.title}</strong></span>
            <button className={styles.restoreBtn} onClick={handleRestoreEdit}>Resume</button>
            <button className={styles.restoreDismiss} onClick={() => setRestoredEdit(null)}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </motion.div>
      )}

      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroGlow2} />
        <div className={styles.heroOrbs}>
          <div className={styles.orb1} />
          <div className={styles.orb2} />
          <div className={styles.orb3} />
        </div>
        <div className={styles.heroGrid} />
        <div className={styles.heroPerspectiveGrid} />
        <div className={styles.heroScanLine} />
        <div className={styles.energyLines}>
          <EnergyLine style={{ top: '20%', left: 0, width: '40%' }} delay={0} />
          <EnergyLine style={{ top: '60%', right: 0, width: '30%', animationDirection: 'reverse' }} delay={1.2} />
          <EnergyLine style={{ bottom: '30%', left: '10%', width: '20%' }} delay={0.6} />
        </div>
        <div className={styles.heroHexAccent}>
          <svg viewBox="0 0 200 220" width="200" height="220">
            {[0,1,2,3,4,5,6,7,8].map(i => {
              const col = i % 3
              const row = Math.floor(i / 3)
              const x = col * 66 + (row % 2 === 1 ? 33 : 0)
              const y = row * 57
              const pts = Array.from({ length: 6 }, (_, k) => {
                const a = (k * 60 - 30) * Math.PI / 180
                return `${x + 28 * Math.cos(a)},${y + 28 * Math.sin(a)}`
              }).join(' ')
              return (
                <polygon
                  key={i}
                  points={pts}
                  fill="none"
                  stroke="rgba(56,189,248,0.06)"
                  strokeWidth="1"
                  style={{ animationDelay: `${i * 0.3}s` }}
                />
              )
            })}
          </svg>
        </div>

        <div className={styles.heroContent}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className={styles.heroBadge}>
              <span className={styles.heroBadgeDot} />
              <span>Digital Realm — Tempest Flow</span>
            </div>
            <h1 className={styles.heroTitle}>
              <span className={styles.heroTitleWord}>Crxsyruu</span>
              <br />
              <span className={styles.heroTitleAccent}>
                <span className={styles.logoLetterT}>T</span>
                <span className={styles.logoLetterE}>e</span>
                <span className={styles.logoLetterM}>m</span>
                <span className={styles.logoLetterP}>p</span>
                <span className={styles.logoLetterE2}>e</span>
                <span className={styles.logoLetterS}>s</span>
                <span className={styles.logoLetterT2}>t</span>
              </span>
            </h1>
            <p className={styles.heroSub}>
              Video editor. Storyteller. Slime enthusiast.<br />
              Crafting motion with the precision of the Great Sage.
            </p>
            <div className={styles.heroCTA}>
              <Link to="/gallery" className={styles.ctaPrimary} onClick={() => sounds.tap()}>
                Enter the Archive
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12,5 19,12 12,19"/>
                </svg>
                <span className={styles.btnGlow} />
              </Link>
              <Link to="/upload" className={styles.ctaSecondary} onClick={() => sounds.tap()}>Upload Edit</Link>
            </div>
          </motion.div>
        </div>

        <div className={styles.logoOrbit}>
          <svg viewBox="0 0 200 200" width="200" height="200" className={styles.orbitSvg}>
            <circle cx="100" cy="100" r="80" stroke="rgba(56,189,248,0.08)" strokeWidth="1" fill="none" strokeDasharray="4 8"/>
            <circle cx="100" cy="100" r="56" stroke="rgba(45,212,191,0.06)" strokeWidth="1" fill="none"/>
            <circle cx="100" cy="20" r="4" fill="var(--glow-blue)" opacity="0.6" className={styles.orbitDot1}/>
            <circle cx="180" cy="100" r="3" fill="var(--glow-cyan)" opacity="0.5" className={styles.orbitDot2}/>
            <circle cx="44" cy="144" r="3" fill="var(--glow-teal)" opacity="0.5" className={styles.orbitDot3}/>
          </svg>
        </div>

        <div className={styles.heroBottomGrad} />
      </section>

      <section className={styles.statsBar}>
        <div className={styles.statsBarLine} />
        <div className={styles.statsInner}>
          {STAT_ITEMS.map((stat, i) => (
            <motion.div
              key={stat.label}
              className={styles.statItem}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 + 0.5, duration: 0.5 }}
            >
              <div className={styles.statIcon}>{stat.icon}</div>
              <span className={styles.statValue}>
                <AnimatedCounter target={statValues[i]} duration={2000} />
                {statSuffixes[i]}
              </span>
              <span className={styles.statLabel}>{stat.label}</span>
            </motion.div>
          ))}
        </div>
      </section>

      <FadeSection className={styles.featured}>
        <div className={styles.sectionHeader}>
          <div>
            <div className={styles.sectionTag}>
              <span className="label-tag">
                {manualFeatured.length > 0 ? 'Featured Works' : 'Top Edits — Auto Selected'}
              </span>
              <div className={styles.liveIndicator} />
            </div>
            <h2 className={styles.sectionTitle}>
              {manualFeatured.length > 0 ? 'Highlighted Edits' : 'Trending Edits'}
            </h2>
          </div>
          <Link to="/gallery" className={styles.seeAll} onClick={() => sounds.tap()}>
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
                onOpen={handleOpenEdit}
                globalMute={globalMute}
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
            <Link to="/upload" className={styles.emptyBtn} onClick={() => sounds.tap()}>
              Upload First Edit
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="16,16 12,12 8,16"/>
                <line x1="12" y1="12" x2="12" y2="21"/>
                <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/>
              </svg>
            </Link>
          </div>
        )}
      </FadeSection>

      <FadeSection className={styles.about} delay={0.05}>
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
            <div className={styles.aboutMeta}>
              <div className={styles.commissionBadge}>
                <span className={styles.commissionDot} />
                Available for Commissions
              </div>
              <div className={styles.softwareList}>
                {['Premiere Pro', 'After Effects', 'DaVinci Resolve', 'Audacity'].map(skill => (
                  <span key={skill} className={styles.skill}>{skill}</span>
                ))}
              </div>
            </div>
          </div>
          <div className={styles.aboutRight}>
            <div className={styles.avatarWrap}>
              <div className={styles.avatarRing1} />
              <div className={styles.avatarRing2} />
              <div className={styles.avatarRing3} />
              <div className={styles.avatarCore}>
                <svg width="56" height="56" viewBox="0 0 80 80" fill="none" className={styles.avatarSvg}>
                  <circle cx="40" cy="40" r="36" stroke="var(--glow-blue)" strokeWidth="0.8" opacity="0.3"/>
                  <circle cx="40" cy="40" r="26" stroke="var(--glow-teal)" strokeWidth="0.5" opacity="0.2"/>
                  <circle cx="40" cy="40" r="20" fill="rgba(56,189,248,0.06)" stroke="var(--glow-blue)" strokeWidth="0.8" opacity="0.4"/>
                  <circle cx="40" cy="40" r="13" fill="rgba(56,189,248,0.12)" className={styles.avatarCoreGlow}/>
                  <circle cx="40" cy="40" r="8" fill="rgba(45,212,191,0.4)" className={styles.avatarSlime}/>
                  <circle cx="40" cy="40" r="4.5" fill="var(--glow-cyan)"/>
                  <circle cx="40" cy="40" r="2" fill="white" opacity="0.9"/>
                  <line x1="40" y1="4" x2="40" y2="16" stroke="var(--glow-blue)" strokeWidth="0.8" opacity="0.5"/>
                  <line x1="40" y1="64" x2="40" y2="76" stroke="var(--glow-blue)" strokeWidth="0.8" opacity="0.5"/>
                  <line x1="4" y1="40" x2="16" y2="40" stroke="var(--glow-teal)" strokeWidth="0.8" opacity="0.4"/>
                  <line x1="64" y1="40" x2="76" y2="40" stroke="var(--glow-teal)" strokeWidth="0.8" opacity="0.4"/>
                  <circle cx="40" cy="4" r="2" fill="var(--glow-blue)" opacity="0.6" className={styles.orbitDot1}/>
                  <circle cx="76" cy="40" r="1.5" fill="var(--glow-cyan)" opacity="0.5" className={styles.orbitDot2}/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </FadeSection>

      <FadeSection className={styles.skillSection} delay={0.05}>
        <div className={styles.skillPanel} ref={skillRef}>
          <div className={styles.skillPanelBg} />
          <div className={styles.skillScanLine} style={{ animationPlayState: scanActive ? 'running' : 'paused' }} />
          <div className={styles.skillHeader}>
            <div className={styles.skillHeaderLeft}>
              <div className={styles.skillSystemTag}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
                </svg>
                Great Sage
              </div>
              <h2 className={styles.skillTitle}>Skill Assessment</h2>
              <p className={styles.skillSub}>Ability analysis complete. All parameters recorded.</p>
            </div>
            <div className={styles.skillHeaderRight}>
              <div className={styles.skillOverallWrap}>
                <svg viewBox="0 0 80 80" width="80" height="80" className={styles.skillRing}>
                  <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(56,189,248,0.1)" strokeWidth="4"/>
                  <circle
                    cx="40" cy="40" r="32"
                    fill="none"
                    stroke="var(--glow-blue)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray="201"
                    strokeDashoffset={scanActive ? 201 * (1 - 0.915) : 201}
                    transform="rotate(-90 40 40)"
                    style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1) 0.4s' }}
                  />
                </svg>
                <div className={styles.skillOverallNum}>
                  <span>91.5</span>
                  <span className={styles.skillOverallLabel}>AVG</span>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.skillGrid}>
            {SKILLS.map((sk, i) => (
              <SkillBar key={sk.name} name={sk.name} score={sk.score} color={sk.color} delay={i * 0.12 + 0.2} />
            ))}
          </div>
        </div>
      </FadeSection>

      <FadeSection className={styles.cta} delay={0.05}>
        <div className={styles.ctaPanel}>
          <div className={styles.ctaGlow} />
          <div className={styles.ctaTopLine} />
          <div className={styles.ctaCornerTL} />
          <div className={styles.ctaCornerBR} />
          <div className={styles.ctaLightReflection} />
          <div className={styles.ctaEnergyLines}>
            <EnergyLine style={{ top: '30%', left: 0, width: '60%' }} delay={0} />
            <EnergyLine style={{ bottom: '30%', right: 0, width: '50%', animationDirection: 'reverse' }} delay={0.8} />
          </div>
          <h2 className={styles.ctaTitle}>Explore the Tempest Archive</h2>
          <p className={styles.ctaSub}>Browse all edits, filter by category, and experience the full collection.</p>
          <Link to="/gallery" className={styles.ctaPrimary} onClick={() => sounds.tap()}>
            Open Archive
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            <span className={styles.btnGlow} />
          </Link>
        </div>
      </FadeSection>

      <VideoModal
        edit={selectedEdit}
        onClose={() => setSelectedEdit(null)}
        globalMute={globalMute}
        onGlobalMuteChange={onGlobalMuteChange}
      />
    </div>
  )
}
