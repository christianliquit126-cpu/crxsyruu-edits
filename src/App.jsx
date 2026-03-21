import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ParticleBackground from './components/ParticleBackground'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Gallery from './pages/Gallery'
import Upload from './pages/Upload'
import Stats from './pages/Stats'
import Admin from './pages/Admin'
import styles from './App.module.css'

export default function App() {
  return (
    <BrowserRouter>
      <div className={styles.app}>
        <ParticleBackground />
        <div className={styles.ambientGradient} />
        <Navbar />
        <main className={styles.main}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/admin" element={<Admin />} />
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
    </BrowserRouter>
  )
}
