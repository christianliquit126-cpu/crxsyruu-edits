import { useState, useMemo, useCallback, useRef, useEffect, memo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useEdits } from '../hooks/useFirebaseData'
import { isConfigured } from '../lib/firebase'
import GalleryCard from '../components/GalleryCard'
import VideoModal from '../components/VideoModal'
import { CATEGORIES } from '../lib/demoData'
import { useAdmin } from '../context/AdminContext'
import { useInteractionTracking } from '../hooks/useInteractionTracking'
import styles from './Gallery.module.css'
import { sounds } from '../lib/sound'
import { session } from '../lib/session'
import { useScrollFade } from '../hooks/useScrollFade'
import { getDynamicFeatured } from '../lib/scoring'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'views', label: 'Most Viewed' },
  { value: 'oldest', label: 'Oldest' },
]

const CATEGORY_COLORS = {
  AMV: 'var(--glow-blue)',
  Cinematic: 'var(--glow-purple)',
  Action: 'var(--glow-pink)',
  Lofi: 'var(--glow-teal)',
  ASMR: 'var(--glow-cyan)',
  Glitch: 'var(--glow-pink)',
  Montage: 'var(--glow-blue)',
  'Short Film': 'var(--glow-purple)',
}

function FadeSection({ children, className }) {
  const ref = useScrollFade()
  return <div ref={ref} className={className}>{children}</div>
}

const GALLERY_FILTER_KEY = 'tempest_gallery_filters'

const loadSavedFilters = () => {
  try {
    const saved = sessionStorage.getItem(GALLERY_FILTER_KEY)
    if (saved) return JSON.parse(saved)
  } catch {}
  return { category: 'All', sort: 'newest' }
}

const saveFilters = (category, sort) => {
  try {
    sessionStorage.setItem(GALLERY_FILTER_KEY, JSON.stringify({ category, sort }))
  } catch {}
}

export default function Gallery({ globalMute = false, onGlobalMuteChange }) {
  const { edits, loading } = useEdits()
  const { isAdmin } = useAdmin()
  const location = useLocation()
  const [selectedEdit, setSelectedEdit] = useState(null)
  const savedFilters = useMemo(() => loadSavedFilters(), [])
  const [activeCategory, setActiveCategory] = useState(savedFilters.category)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [sortBy, setSortBy] = useState(savedFilters.sort)
  const [focusedId, setFocusedId] = useState(null)
  const searchRef = useRef(null)
  const headerRef = useScrollFade()
  const pageRef = useRef(null)
  const scrollRestored = useRef(false)

  const { track, getHeatScore } = useInteractionTracking(isAdmin)

  useEffect(() => {
    document.title = 'Tempest Archive — Gallery'
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 220)
    return () => clearTimeout(t)
  }, [searchQuery])

  useEffect(() => {
    saveFilters(activeCategory, sortBy)
  }, [activeCategory, sortBy])

  useEffect(() => {
    const handler = (e) => {
      const isMac = navigator.platform.toUpperCase().includes('MAC')
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey
      if (ctrlOrCmd && e.key === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
      if (e.key === 'Escape' && document.activeElement === searchRef.current) {
        setSearchQuery('')
        searchRef.current?.blur()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const categories = useMemo(() => {
    if (CATEGORIES[0] === 'All') return CATEGORIES
    return ['All', ...CATEGORIES]
  }, [])

  const filteredEdits = useMemo(() => {
    let result = edits
    if (activeCategory !== 'All') result = result.filter(e => e.category === activeCategory)
    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase()
      result = result.filter(e =>
        e.title?.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q) ||
        e.category?.toLowerCase().includes(q) ||
        (e.tags || []).some(t => t.toLowerCase().includes(q))
      )
    }
    switch (sortBy) {
      case 'views': return [...result].sort((a, b) => (b.views || 0) - (a.views || 0))
      case 'oldest': return [...result].sort((a, b) => (a.uploadedAt || 0) - (b.uploadedAt || 0))
      default: return [...result].sort((a, b) => (b.uploadedAt || 0) - (a.uploadedAt || 0))
    }
  }, [edits, activeCategory, debouncedQuery, sortBy])

  useEffect(() => {
    if (!loading && filteredEdits.length > 0 && !scrollRestored.current) {
      scrollRestored.current = true
      const saved = session.getScroll(location.pathname)
      if (saved > 0) {
        requestAnimationFrame(() => {
          window.scrollTo({ top: saved, behavior: 'instant' })
        })
      }

      const lastViewed = session.getLastViewed()
      if (lastViewed) {
        const match = filteredEdits.find(e => e.id === lastViewed)
        if (match) {
          setFocusedId(match.id)
          setTimeout(() => setFocusedId(null), 2400)
        }
      }
    }
  }, [loading, filteredEdits, location.pathname])

  useEffect(() => {
    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          session.saveScroll(location.pathname, window.scrollY)
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [location.pathname])

  const handleOpenEdit = useCallback((edit) => {
    sounds.open()
    setSelectedEdit(edit)
    session.saveLastViewed(edit.id)
    track(edit.id, 'click')
    track(edit.id, 'play')
  }, [track])

  const handleNavigate = useCallback((edit) => {
    setSelectedEdit(edit)
    session.saveLastViewed(edit.id)
    track(edit.id, 'play')
  }, [track])

  const handleCategoryChange = (cat) => {
    sounds.tap()
    setActiveCategory(cat)
    setFocusedId(null)
  }

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
  }

  const handleSearchClear = () => {
    sounds.tap()
    setSearchQuery('')
    searchRef.current?.focus()
  }

  const handleSortChange = (val) => {
    sounds.tap()
    setSortBy(val)
  }

  const handleCardHover = useCallback((editId) => {
    track(editId, 'hover')
  }, [track])

  const featuredEdits = useMemo(() => {
    const manual = edits.filter(e => e.featured)
    if (manual.length > 0) return manual
    return getDynamicFeatured(edits)
  }, [edits])

  return (
    <div className={styles.page} ref={pageRef}>
      <div className={styles.headerGlow} />
      <div className={styles.headerGlow2} />

      <div ref={headerRef} className={styles.header}>
        <div className={styles.headerContent}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className={styles.headerLabel}>
              <span className="label-tag">Tempest Archive — 02</span>
              <div className={styles.headerLabelDot} />
            </div>
            <h1 className={styles.title}>The Archive</h1>
            <div className={styles.titleRule} />
            <p className={styles.sub}>
              {loading ? 'Loading the archive...' : (
                <>
                  <span className={styles.subCount}>{filteredEdits.length}</span>
                  {` edit${filteredEdits.length !== 1 ? 's' : ''}${activeCategory !== 'All' ? ` in ${activeCategory}` : ''}`}
                </>
              )}
            </p>
          </div>
          {isAdmin && (
            <Link to="/upload" className={styles.uploadBtn} onClick={() => sounds.tap()}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="16,16 12,12 8,16"/>
                <line x1="12" y1="12" x2="12" y2="21"/>
                <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/>
              </svg>
              Upload
            </Link>
          )}
        </div>
      </div>

      <FadeSection className={styles.controls}>
        <div className={styles.searchWrap}>
          <svg className={styles.searchIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref={searchRef}
            type="search"
            className={styles.search}
            placeholder="Search edits, categories, tags... (⌘K)"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => sounds.hover()}
          />
          {searchQuery && (
            <button className={styles.searchClear} onClick={handleSearchClear} aria-label="Clear search">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>

        <div className={styles.sortWrap}>
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              className={`${styles.sortBtn} ${sortBy === opt.value ? styles.sortActive : ''}`}
              onClick={() => handleSortChange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </FadeSection>

      <FadeSection className={styles.cats}>
        <div className={styles.catScroll}>
          {categories.map(cat => (
            <button
              key={cat}
              className={`${styles.catBtn} ${activeCategory === cat ? styles.catActive : ''}`}
              style={activeCategory === cat ? { '--cat-c': CATEGORY_COLORS[cat] || 'var(--glow-blue)' } : {}}
              onClick={() => handleCategoryChange(cat)}
            >
              {cat}
              {activeCategory === cat && (
                <span className={styles.catActiveDot} style={{ background: CATEGORY_COLORS[cat] || 'var(--glow-blue)' }} />
              )}
            </button>
          ))}
        </div>
      </FadeSection>

      <div className={styles.gridArea}>
        {!isConfigured && !loading && edits.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIconWrap}>
              <div className={styles.emptyIconRing} />
              <div className={styles.emptyIconRing2} />
              <div className={styles.emptyIcon}>
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <polygon points="12,2 2,7 12,12 22,7"/>
                  <polyline points="2,17 12,22 22,17"/>
                  <polyline points="2,12 12,17 22,12"/>
                </svg>
              </div>
            </div>
            <h3>Archive Offline</h3>
            <p>Add Firebase credentials in <code>.env</code> to connect your archive and start displaying edits.</p>
          </div>
        ) : loading ? (
          <div className={styles.loadingGrid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={styles.skeleton}>
                <div className={styles.skeletonThumb} />
                <div className={styles.skeletonBody}>
                  <div className={styles.skeletonLine} style={{ width: '40%' }} />
                  <div className={styles.skeletonLine} style={{ width: '80%' }} />
                  <div className={styles.skeletonLine} style={{ width: '60%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : filteredEdits.length === 0 ? (
          <motion.div
            className={styles.emptyState}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className={styles.emptyIconWrap}>
              <div className={styles.emptyIconRing} />
              <div className={styles.emptyIconRing2} />
              <div className={styles.emptyIcon}>
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </div>
            </div>
            <h3>No edits found</h3>
            <p>Try a different search term or category filter to explore the archive.</p>
            <button className={styles.resetBtn} onClick={() => { sounds.tap(); setSearchQuery(''); setActiveCategory('All') }}>
              Clear Filters
            </button>
          </motion.div>
        ) : (
          <div className={styles.grid}>
            {filteredEdits.map((edit) => (
              <GalleryCard
                key={edit.id}
                edit={edit}
                featured={edit.featured || featuredEdits.some(f => f.id === edit.id && !edits.some(e => e.featured))}
                onOpen={handleOpenEdit}
                searchQuery={debouncedQuery}
                focused={focusedId === edit.id}
                heatScore={getHeatScore(edit.id)}
                globalMute={globalMute}
              />
            ))}
          </div>
        )}
      </div>

      <VideoModal
        edit={selectedEdit}
        onClose={() => setSelectedEdit(null)}
        edits={filteredEdits}
        onNavigate={handleNavigate}
        globalMute={globalMute}
        onGlobalMuteChange={onGlobalMuteChange}
      />
    </div>
  )
}
