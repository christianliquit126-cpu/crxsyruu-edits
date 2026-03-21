import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import styles from './Navbar.module.css'

const NAV_ITEMS = [
  {
    path: '/',
    label: 'Tempest Flow',
    sublabel: '01',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
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
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
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
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polyline points="16,16 12,12 8,16"/>
        <line x1="12" y1="12" x2="12" y2="21"/>
        <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/>
      </svg>
    ),
  },
  {
    path: '/stats',
    label: 'Tempest Stats',
    sublabel: '04',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
  },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.inner}>
        <NavLink to="/" className={styles.brand}>
          <div className={styles.brandIcon}>
            <svg width="22" height="22" viewBox="0 0 64 64" fill="none">
              <circle cx="32" cy="32" r="28" stroke="var(--glow-blue)" strokeWidth="1.5" opacity="0.5"/>
              <polygon points="32,14 42,26 37,26 37,50 27,50 27,26 22,26" fill="var(--glow-blue)" opacity="0.9"/>
              <circle cx="32" cy="32" r="4" fill="var(--glow-cyan)"/>
            </svg>
          </div>
          <div className={styles.brandText}>
            <span className={styles.brandMain}>Crxsyruu</span>
            <span className={styles.brandSub}>Tempest</span>
          </div>
        </NavLink>

        <div className={`${styles.navLinks} ${menuOpen ? styles.open : ''}`}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`
              }
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
          >
            <span className={styles.navIcon}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </span>
            <span className={styles.navLabel}>Admin</span>
          </NavLink>
        </div>

        <button
          className={`${styles.hamburger} ${menuOpen ? styles.open : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
        >
          <span /><span /><span />
        </button>
      </div>
      <div className={styles.navLine} />
    </nav>
  )
}
