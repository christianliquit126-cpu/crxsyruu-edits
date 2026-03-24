import { useState, useEffect, lazy, Suspense, Component } from 'react'
import { BrowserRouter, Routes, Route, useLocation, Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AdminProvider } from './context/AdminContext'
import ParticleBackground from './components/ParticleBackground'
import Navbar from './components/Navbar'
import BootIntro from './components/BootIntro'
import CursorGlow from './components/CursorGlow'
import ScrollProgress from './components/ScrollProgress'
import ScrollToTop from './components/ScrollToTop'
import styles from './App.module.css'
import { useDevicePerformance } from './hooks/useDevicePerformance'
import { useSystemIntelligence } from './hooks/useSystemIntelligence'
import { initSound } from './lib/sound'
import { session } from './lib/session'

const Home = lazy(() => import('./pages/Home'))
const Gallery = lazy(() => import('./pages/Gallery'))
const Upload = lazy(() => import('./pages/Upload'))
const Stats = lazy(() => import('./pages/Stats'))
const Admin = lazy(() => import('./pages/Admin'))
const NotFound = lazy(() => import('./pages/NotFound'))

function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', opacity: 0.4 }}>
      <div style={{ width: 20, height: 20, border: '2px solid var(--glow-blue)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16, padding: 32, textAlign: 'center' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--glow-blue)" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Something went wrong in this section.</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            style={{ padding: '8px 20px', background: 'var(--tempest-panel)', border: '1px solid var(--tempest-border)', borderRadius: 8, color: 'var(--glow-blue)', cursor: 'pointer', fontSize: '0.85rem' }}
          >
            Try Again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

function PageTransition({ children }) {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
        style={{ flex: 1 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

function AppInner({ performanceModeOn, setPerformanceModeOn, globalMute, onGlobalMuteChange }) {
  const { isLowEnd } = useDevicePerformance()
  const perf = performanceModeOn || isLowEnd
  const currentYear = new Date().getFullYear()

  useSystemIntelligence()

  useEffect(() => {
    const unlock = () => { initSound(); document.removeEventListener('click', unlock) }
    document.addEventListener('click', unlock, { once: true })
  }, [])

  return (
    <div className={styles.app} data-perf={perf ? 'low' : 'high'}>
      <ScrollProgress />
      <CursorGlow disabled={perf} />
      <ParticleBackground />
      <div className={styles.ambientGradient} />
      {!perf && <div className={styles.noiseOverlay} />}
      <Navbar
        performanceModeOn={performanceModeOn}
        setPerformanceModeOn={setPerformanceModeOn}
        globalMute={globalMute}
        onGlobalMuteChange={onGlobalMuteChange}
      />
      <ScrollToTop />
      <main className={styles.main}>
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<PageTransition><Home globalMute={globalMute} onGlobalMuteChange={onGlobalMuteChange} /></PageTransition>} />
              <Route path="/gallery" element={<PageTransition><Gallery globalMute={globalMute} onGlobalMuteChange={onGlobalMuteChange} /></PageTransition>} />
              <Route path="/upload" element={<PageTransition><Upload /></PageTransition>} />
              <Route path="/stats" element={<PageTransition><Stats /></PageTransition>} />
              <Route path="/admin" element={<PageTransition><Admin /></PageTransition>} />
              <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <div className={styles.logoWrap}>
              <svg width="18" height="18" viewBox="0 0 64 64" fill="none" className={styles.logoSvg}>
                <circle cx="32" cy="32" r="28" stroke="var(--glow-blue)" strokeWidth="1.5" opacity="0.5"
                  strokeDasharray="176" strokeDashoffset="176" className={styles.logoCircle}/>
                <polygon points="32,14 42,26 37,26 37,50 27,50 27,26 22,26" fill="var(--glow-blue)" opacity="0.9"
                  className={styles.logoBolt}/>
                <circle cx="32" cy="32" r="4" fill="var(--glow-cyan)" className={styles.logoCore}/>
              </svg>
            </div>
            <span>Crxsyruu Tempest</span>
          </div>
          <div className={styles.footerLinks}>
            <Link to="/" className={styles.footerItem}>Tempest Flow</Link>
            <Link to="/gallery" className={styles.footerItem}>Tempest Archive</Link>
            <Link to="/upload" className={styles.footerItem}>Tempest Upload</Link>
            <Link to="/stats" className={styles.footerItem}>Tempest Stats</Link>
          </div>
          <p className={styles.footerCopy}>
            © {currentYear} Crxsyruu Tempest — Crafted with precision. Inspired by the Great Sage.
          </p>
        </div>
        <div className={styles.footerLine} />
      </footer>
    </div>
  )
}

export default function App() {
  const [booted, setBooted] = useState(false)
  const [performanceModeOn, setPerformanceModeOn] = useState(() => {
    try { return localStorage.getItem('tempest_perf') === '1' } catch { return false }
  })
  const [globalMute, setGlobalMute] = useState(() => session.getGlobalMute())

  const togglePerformanceMode = (val) => {
    setPerformanceModeOn(val)
    try { localStorage.setItem('tempest_perf', val ? '1' : '0') } catch {}
  }

  const handleGlobalMuteChange = (val) => {
    setGlobalMute(val)
    session.setGlobalMute(val)
  }

  return (
    <AdminProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        {!booted && <BootIntro onComplete={() => setBooted(true)} />}
        {booted && (
          <AppInner
            performanceModeOn={performanceModeOn}
            setPerformanceModeOn={togglePerformanceMode}
            globalMute={globalMute}
            onGlobalMuteChange={handleGlobalMuteChange}
          />
        )}
      </BrowserRouter>
    </AdminProvider>
  )
}
