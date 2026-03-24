import { useState, useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAdmin } from '../context/AdminContext'
import styles from './Navbar.module.css'
import { sounds } from '../lib/sound'

const NAV_ITEMS = [
  {
    path: '/',
    label: 'Tempest Flow',
    sublabel: '01',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
        <polyline points="9,22 9,12 15,12 15,22"/>
      </svg>
    ),
  },
  {
    path: '/gallery',
    label: 'Tempest Archive',
    sublabel: '02',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    path: '/upload',
    label: 'Tempest Upload',
    sublabel: '03',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polyline points="16,16 12,12 8,16"/>
        <line x1="12" y1="12" x2="12" y2="21"/>
        <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/>
      </svg>
    ),
    adminOnly: true,
  },
  {
    path: '/stats',
    label: 'Tempest Stats',
    sublabel: '04',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
  },
]

function MagneticBtn({ children, className, onClick, ...props }) {
  const ref = useRef(null)

  const handleMouseMove = (e) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = (e.clientX - cx) * 0.28
    const dy = (e.clientY - cy) * 0.28
    el.style.transform = `translate(${dx}px, ${dy}px)`
  }

  const handleMouseLeave = () => {
    const el = ref.current
    if (!el) return
    el.style.transform = ''
  }

  return (
    <button
      ref={ref}
      className={className}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </button>
  )
}

export default function Navbar({ performanceModeOn, setPerformanceModeOn, globalMute = false, onGlobalMuteChange }) {
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [audioPlaying, setAudioPlaying] = useState(false)
  const [audioAvailable, setAudioAvailable] = useState(true)
  const location = useLocation()
  const audioRef = useRef(null)
  const lastScrollY = useRef(0)
  const { isAdmin } = useAdmin()

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 40)
      if (y > lastScrollY.current + 8 && y > 80) {
        setHidden(true)
      } else if (y < lastScrollY.current - 8 || y < 80) {
        setHidden(false)
      }
      lastScrollY.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const toggleAudio = () => {
    sounds.toggle()
    if (!audioRef.current || !audioAvailable) return
    if (audioPlaying) {
      audioRef.current.pause()
      setAudioPlaying(false)
    } else {
      audioRef.current.play().then(() => setAudioPlaying(true)).catch(() => {
        setAudioAvailable(false)
        setAudioPlaying(false)
      })
    }
  }

  const visibleNavItems = NAV_ITEMS.filter(item => !item.adminOnly || isAdmin)

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ''} ${hidden && !menuOpen ? styles.hidden : ''}`}>
      <div className={styles.inner}>
        <NavLink to="/" className={styles.brand} onClick={() => sounds.nav()}>
          <img
            src="/crxsyruu-logo.png"
            alt="Crxsyruu Edits"
            className={styles.brandLogo}
          />
        </NavLink>

        <div className={`${styles.navLinks} ${menuOpen ? styles.open : ''}`}>
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`
              }
              onClick={() => sounds.nav()}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
              <span className={styles.navSublabel}>{item.sublabel}</span>
              <span className={styles.navGlow} />
            </NavLink>
          ))}
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `${styles.navItem} ${styles.adminLink} ${isActive ? styles.active : ''}`
            }
            onClick={() => sounds.nav()}
          >
            <span className={styles.navIcon}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </span>
            <span className={styles.navLabel}>Admin</span>
            {isAdmin && <span className={styles.adminDot} />}
          </NavLink>
        </div>

        <div className={styles.navRight}>
          <MagneticBtn
            className={`${styles.perfBtn} ${performanceModeOn ? styles.perfActive : ''}`}
            onClick={() => { sounds.toggle(); setPerformanceModeOn?.(!performanceModeOn) }}
            aria-label="Toggle performance mode"
            title={performanceModeOn ? 'Performance mode on — reduced effects' : 'Performance mode off — full effects'}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="13,2 3,14 12,14 11,22 21,10 12,10"/>
            </svg>
          </MagneticBtn>

          <MagneticBtn
            className={`${styles.perfBtn} ${globalMute ? styles.perfActive : ''}`}
            onClick={() => { sounds.tap(); onGlobalMuteChange?.(!globalMute) }}
            aria-label={globalMute ? 'Unmute all videos' : 'Mute all videos'}
            title={globalMute ? 'Unmute all videos' : 'Mute all videos'}
          >
            {globalMute ? (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polygon points="11,5 6,9 2,9 2,15 6,15 11,19"/>
                <line x1="23" y1="9" x2="17" y2="15"/>
                <line x1="17" y1="9" x2="23" y2="15"/>
              </svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polygon points="11,5 6,9 2,9 2,15 6,15 11,19"/>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
              </svg>
            )}
          </MagneticBtn>

          <MagneticBtn
            className={`${styles.audioBtn} ${audioPlaying ? styles.audioBtnActive : ''} ${!audioAvailable ? styles.audioDisabled : ''}`}
            onClick={toggleAudio}
            aria-label={!audioAvailable ? 'Ambient music unavailable' : audioPlaying ? 'Pause music' : 'Play ambient music'}
            title={!audioAvailable ? 'No ambient audio track found' : audioPlaying ? 'Pause ambient music' : 'Play ambient music'}
            disabled={!audioAvailable}
          >
            {audioPlaying ? (
              <div className={styles.visualizer}>
                <span className={styles.bar1} />
                <span className={styles.bar2} />
                <span className={styles.bar3} />
                <span className={styles.bar4} />
                <span className={styles.bar5} />
              </div>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 18V5l12-2v13"/>
                <circle cx="6" cy="18" r="3"/>
                <circle cx="18" cy="16" r="3"/>
              </svg>
            )}
          </MagneticBtn>

          <button
            className={`${styles.hamburger} ${menuOpen ? styles.open : ''}`}
            onClick={() => { sounds.tap(); setMenuOpen(!menuOpen) }}
            aria-label="Toggle navigation"
          >
            <span /><span /><span />
          </button>
        </div>
      </div>
      <div className={styles.navLine} />

      <audio
        ref={audioRef}
        loop
        preload="none"
        src="/audio/tempest-ambient.mp3"
        onError={() => { setAudioAvailable(false); setAudioPlaying(false) }}
      />

      {menuOpen && (
        <div className={styles.mobileOverlay} onClick={() => setMenuOpen(false)} />
      )}
    </nav>
  )
}
