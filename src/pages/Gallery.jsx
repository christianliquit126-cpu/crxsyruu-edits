import { useState, useMemo, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useEdits } from '../hooks/useFirebaseData'
import { isConfigured } from '../lib/firebase'
import GalleryCard from '../components/GalleryCard'
import VideoModal from '../components/VideoModal'
import { CATEGORIES } from '../lib/demoData'
import { useAdmin } from '../context/AdminContext'
import styles from './Gallery.module.css'
import { sounds } from '../lib/sound'
import { useScrollFade } from '../hooks/useScrollFade'

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

export default function Gallery() {
  const { edits, loading } = useEdits()
  const { isAdmin } = useAdmin()
  const [selectedEdit, setSelectedEdit] = useState(null)
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [focusedId, setFocusedId] = useState(null)
  const searchRef = useRef(null)
  const headerRef = useScrollFade()

  const categories = useMemo(() => ['All', ...CATEGORIES], [])

  const filteredEdits = useMemo(() => {
    let result = edits
    if (activeCategory !== 'All') result = result.filter(e => e.category === activeCategory)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
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
  }, [edits, activeCategory, searchQuery, sortBy])

  const handleOpenEdit = useCallback((edit) => {
    sounds.open()
    setSelectedEdit(edit)
  }, [])

  const handleNavigate = useCallback((edit) => {
    setSelectedEdit(edit)
  }, [])

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

  return (
    <div className={styles.page}>
      <div className={styles.headerGlow} />
      <div className={styles.headerGlow2} />

      <div ref={headerRef} className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <span className="label-tag">Tempest Archive — 02</span>
            <h1 className={styles.title}>The Archive</h1>
            <p className={styles.sub}>
              {loading ? 'Loading the archive...' : `${filteredEdits.length} edit${filteredEdits.length !== 1 ? 's' : ''}${activeCategory !== 'All' ? ` in ${activeCategory}` : ''}`}
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
            placeholder="Search edits, categories, tags..."
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
            <div className={styles.emptyIcon}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <polygon points="12,2 2,7 12,12 22,7"/>
                <polyline points="2,17 12,22 22,17"/>
                <polyline points="2,12 12,17 22,12"/>
              </svg>
            </div>
            <h3>Firebase Not Configured</h3>
            <p>Add Firebase credentials in <code>.env</code> to load your archive.</p>
            <p className={styles.emptyHint}>Demo data will appear here once connected.</p>
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
            <div className={styles.emptyIcon}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
            <h3>No edits found</h3>
            <p>Try a different search or category filter.</p>
            <button className={styles.resetBtn} onClick={() => { sounds.tap(); setSearchQuery(''); setActiveCategory('All') }}>
              Clear Filters
            </button>
          </motion.div>
        ) : (
          <AnimatePresence mode="sync">
            <div className={styles.grid}>
              {filteredEdits.map((edit) => (
                <GalleryCard
                  key={edit.id}
                  edit={edit}
                  featured={edit.featured}
                  onOpen={handleOpenEdit}
                  searchQuery={searchQuery}
                  focused={focusedId === edit.id}
                />
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>

      <VideoModal
        edit={selectedEdit}
        onClose={() => setSelectedEdit(null)}
        edits={filteredEdits}
        onNavigate={handleNavigate}
      />
    </div>
  )
}
