import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEdits } from '../hooks/useFirebaseData'
import GalleryCard from '../components/GalleryCard'
import VideoModal from '../components/VideoModal'
import { CATEGORIES } from '../lib/demoData'
import styles from './Gallery.module.css'

const SORT_OPTIONS = [
  { value: 'latest', label: 'Latest' },
  { value: 'popular', label: 'Most Viewed' },
  { value: 'featured', label: 'Featured' },
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
    if (!search.trim() || !searchFocused) return []
    const q = search.toLowerCase()
    return edits
      .filter(e => e.title?.toLowerCase().includes(q))
      .slice(0, 5)
  }, [search, searchFocused, edits])

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
          <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className={styles.searchInput}
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
            placeholder="Search the archive..."
          />
          {search && (
            <button className={styles.searchClear} onClick={() => setSearch('')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    {s.title}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className={styles.filterRow}>
          <div className={styles.categories}>
            {CATEGORIES.map(cat => (
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

      <div className={styles.results}>
        <span className={styles.resultCount}>{filtered.length} edit{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div className={styles.loadingGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.skeleton} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.3">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
          <p>No edits found</p>
          <span>Try adjusting your search or filters</span>
        </div>
      ) : (
        <motion.div
          className={styles.grid}
          layout
        >
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
