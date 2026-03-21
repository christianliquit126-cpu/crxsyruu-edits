import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useEdits } from '../hooks/useFirebaseData'
import { isConfigured } from '../lib/firebase'
import GalleryCard from '../components/GalleryCard'
import VideoModal from '../components/VideoModal'
import { CATEGORIES } from '../lib/demoData'
import styles from './Gallery.module.css'

const SORT_OPTIONS = [
  { value: 'latest', label: 'Latest' },
  { value: 'popular', label: 'Most Viewed' },
  { value: 'featured', label: 'Featured First' },
]

export default function Gallery() {
  const { edits, loading } = useEdits()
  const [selectedEdit, setSelectedEdit] = useState(null)
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState('latest')
  const [search, setSearch] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)

  const filtered = useMemo(() => {
    let result = [...edits]
    if (category !== 'All') result = result.filter(e => e.category === category)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(e =>
        e.title?.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q) ||
        (e.tags || []).some(t => t.toLowerCase().includes(q))
      )
    }
    if (sort === 'popular') result.sort((a, b) => (b.views || 0) - (a.views || 0))
    else if (sort === 'featured') result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
    else result.sort((a, b) => b.uploadedAt - a.uploadedAt)
    return result
  }, [edits, category, sort, search])

  const suggestions = useMemo(() => {
    if (!search.trim() || !searchFocused || search.length < 2) return []
    const q = search.toLowerCase()
    return edits.filter(e => e.title?.toLowerCase().includes(q)).slice(0, 5)
  }, [search, searchFocused, edits])

  const activeCategories = useMemo(() => {
    const cats = new Set(edits.map(e => e.category))
    return CATEGORIES.filter(c => c === 'All' || cats.has(c))
  }, [edits])

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <span className="label-tag">Tempest Archive — 02</span>
          <h1 className={styles.title}>The Archive</h1>
          <p className={styles.subtitle}>All edits, catalogued and ready for viewing.</p>
        </div>
        <div className={styles.headerGlow} />
      </div>

      <div className={styles.controls}>
        <div className={styles.searchWrap}>
          <svg className={styles.searchIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className={styles.searchInput}
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
            placeholder="Search the archive..."
            autoComplete="off"
          />
          {search && (
            <button className={styles.searchClear} onClick={() => setSearch('')} aria-label="Clear search">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
          <AnimatePresence>
            {suggestions.length > 0 && (
              <motion.div
                className={styles.suggestions}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
              >
                {suggestions.map(s => (
                  <button
                    key={s.id}
                    className={styles.suggestion}
                    onMouseDown={() => { setSearch(s.title); setSearchFocused(false) }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"/>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <span>{s.title}</span>
                    <span className={styles.suggestionCat}>{s.category}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className={styles.filterRow}>
          <div className={styles.categories}>
            {activeCategories.map(cat => (
              <button
                key={cat}
                className={`${styles.catBtn} ${category === cat ? styles.active : ''}`}
                onClick={() => setCategory(cat)}
              >
                {cat}
                {category === cat && <span className={styles.catGlow} />}
              </button>
            ))}
          </div>

          <select
            className={styles.sortSelect}
            value={sort}
            onChange={e => setSort(e.target.value)}
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {!loading && (
        <div className={styles.results}>
          <span className={styles.resultCount}>
            {filtered.length} edit{filtered.length !== 1 ? 's' : ''}
            {category !== 'All' && ` in ${category}`}
            {search && ` matching "${search}"`}
          </span>
        </div>
      )}

      {loading ? (
        <div className={styles.loadingGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.skeleton} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>
          {edits.length === 0 ? (
            <>
              <div className={styles.emptyIcon}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.3">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                </svg>
              </div>
              <p>The archive is empty</p>
              {isConfigured ? (
                <>
                  <span>Upload your first edit to get started</span>
                  <Link to="/upload" className={styles.emptyAction}>
                    Upload First Edit
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="16,16 12,12 8,16"/>
                      <line x1="12" y1="12" x2="12" y2="21"/>
                      <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/>
                    </svg>
                  </Link>
                </>
              ) : (
                <>
                  <span>Configure Firebase credentials to load live data</span>
                  <div className={styles.configNote}>
                    Add <code>VITE_FIREBASE_*</code> environment variables to connect your database
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.3">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <p>No edits found</p>
              <span>Try adjusting your search or filters</span>
              {(search || category !== 'All') && (
                <button className={styles.resetBtn} onClick={() => { setSearch(''); setCategory('All') }}>
                  Clear filters
                </button>
              )}
            </>
          )}
        </div>
      ) : (
        <motion.div className={styles.grid} layout>
          <AnimatePresence>
            {filtered.map((edit) => (
              <GalleryCard
                key={edit.id}
                edit={edit}
                featured={edit.featured}
                onOpen={setSelectedEdit}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <VideoModal edit={selectedEdit} onClose={() => setSelectedEdit(null)} />
    </div>
  )
}
