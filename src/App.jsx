import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AdminProvider } from './context/AdminContext'
import ParticleBackground from './components/ParticleBackground'
import Navbar from './components/Navbar'
import BootIntro from './components/BootIntro'
import CursorGlow from './components/CursorGlow'
import ScrollProgress from './components/ScrollProgress'
import Home from './pages/Home'
import Gallery from './pages/Gallery'
import Upload from './pages/Upload'
import Stats from './pages/Stats'
import Admin from './pages/Admin'
import styles from './App.module.css'
import { useDevicePerformance } from './hooks/useDevicePerformance'
import { initSound } from './lib/sound'

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

function AppInner({ performanceModeOn, setPerformanceModeOn }) {
  const { isLowEnd } = useDevicePerformance()
  const perf = performanceModeOn || isLowEnd

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
      <Navbar performanceModeOn={performanceModeOn} setPerformanceModeOn={setPerformanceModeOn} />
      <main className={styles.main}>
        <Routes>
          <Route path="/" element={<PageTransition><Home /></PageTransition>} />
          <Route path="/gallery" element={<PageTransition><Gallery /></PageTransition>} />
          <Route path="/upload" element={<PageTransition><Upload /></PageTransition>} />
          <Route path="/stats" element={<PageTransition><Stats /></PageTransition>} />
          <Route path="/admin" element={<PageTransition><Admin /></PageTransition>} />
        </Routes>
      </main>
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <svg width="16" height="16" viewBox="0 0 64 64" fill="none">
              <circle cx="32" cy="32" r="28" stroke="var(--glow-blue)" strokeWidth="1.5" opacity="0.5"/>
              <polygon points="32,14 42,26 37,26 37,50 27,50 27,26 22,26" fill="var(--glow-blue)" opacity="0.9"/>
              <circle cx="32" cy="32" r="4" fill="var(--glow-cyan)"/>
            </svg>
            <span>Crxsyruu Tempest</span>
          </div>
          <div className={styles.footerLinks}>
            <span className={styles.footerItem}>Tempest Flow</span>
            <span className={styles.footerItem}>Tempest Archive</span>
            <span className={styles.footerItem}>Tempest Upload</span>
            <span className={styles.footerItem}>Tempest Stats</span>
          </div>
          <p className={styles.footerCopy}>
            Crafted with precision. Inspired by the Great Sage.
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

  const togglePerformanceMode = (val) => {
    setPerformanceModeOn(val)
    try { localStorage.setItem('tempest_perf', val ? '1' : '0') } catch {}
  }

  return (
    <AdminProvider>
      <BrowserRouter>
        {!booted && <BootIntro onComplete={() => setBooted(true)} />}
        {booted && (
          <AppInner
            performanceModeOn={performanceModeOn}
            setPerformanceModeOn={togglePerformanceMode}
          />
        )}
      </BrowserRouter>
    </AdminProvider>
  )
}
