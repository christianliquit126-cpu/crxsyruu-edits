import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEdits, deleteEdit, toggleFeatured, updateEdit } from '../hooks/useFirebaseData'
import { isConfigured } from '../lib/firebase'
import { CATEGORIES } from '../lib/demoData'
import styles from './Admin.module.css'

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'tempest2024'
const EDIT_CATEGORIES = CATEGORIES.filter(c => c !== 'All')

export default function Admin() {
  const [authed, setAuthed] = useState(false)
  const [pw, setPw] = useState('')
  const [pwError, setPwError] = useState('')
  const [deleting, setDeleting] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [toggling, setToggling] = useState(null)
  const [editing, setEditing] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)
  const { edits, loading } = useEdits()

  useEffect(() => {
    document.title = 'Admin — Control Panel'
  }, [])

  useEffect(() => {
    if (!editing) return
    const handler = (e) => {
      if (e.key === 'Escape') setEditing(null)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [editing])

  useEffect(() => {
    if (!deleteConfirm) return
    const handler = (e) => {
      if (e.key === 'Escape') setDeleteConfirm(null)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [deleteConfirm])

  const handleLogin = (e) => {
    e.preventDefault()
    if (pw === ADMIN_PASSWORD) {
      setAuthed(true)
      setPwError('')
      setPw('')
    } else {
      setPwError('Access denied. Invalid credentials.')
    }
  }

  const handleDeleteRequest = (edit) => {
    setDeleteConfirm(edit)
  }

  const handleDeleteConfirm = async () => {
    const edit = deleteConfirm
    if (!edit) return
    setDeleteConfirm(null)
    setDeleting(edit.id)
    try {
      await deleteEdit(edit.id)
    } catch (err) {
      alert('Delete failed: ' + err.message)
    } finally {
      setDeleting(null)
    }
  }

  const handleToggleFeatured = async (edit) => {
    setToggling(edit.id)
    try {
      await toggleFeatured(edit.id, edit.featured)
    } catch (err) {
      alert('Failed to update featured status: ' + err.message)
    } finally {
      setToggling(null)
    }
  }

  const openEdit = (edit) => {
    setEditing(edit)
    setEditForm({
      title: edit.title || '',
      description: edit.description || '',
      category: edit.category || EDIT_CATEGORIES[0] || '',
      tags: (edit.tags || []).join(', '),
    })
  }

  const handleSaveEdit = async () => {
    if (!editForm.title?.trim()) return
    setSaving(true)
    try {
      const tags = editForm.tags.split(',').map(t => t.trim()).filter(Boolean)
      await updateEdit(editing.id, {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        category: editForm.category,
        tags,
      })
      setEditing(null)
    } catch (err) {
      alert('Save failed: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!authed) {
    return (
      <div className={styles.page}>
        <div className={styles.loginWrap}>
          <motion.div
            className={styles.loginPanel}
            initial={{ opacity: 0, scale: 0.93 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className={styles.loginIcon}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <span className="label-tag">Admin Access</span>
            <h2 className={styles.loginTitle}>Secure Entry</h2>
            <p className={styles.loginSub}>Authentication required to enter the control panel.</p>
            <form className={styles.loginForm} onSubmit={handleLogin}>
              <div className={styles.field}>
                <label className={styles.label}>Admin Password</label>
                <input
                  type="password"
                  value={pw}
                  onChange={e => setPw(e.target.value)}
                  placeholder="Enter credentials..."
                  className={styles.input}
                  autoFocus
                  autoComplete="current-password"
                />
              </div>
              {pwError && (
                <p className={styles.pwError}>{pwError}</p>
              )}
              <button type="submit" className={styles.loginBtn}>
                Authenticate
                <span className={styles.btnGlow} />
              </button>
            </form>
            <div className={styles.loginGlow} />
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerTop}>
            <div>
              <span className="label-tag">Admin Panel</span>
              <h1 className={styles.title}>Control Panel</h1>
            </div>
            <div className={styles.headerActions}>
              {!isConfigured && (
                <span className={styles.demoWarning}>Demo mode — changes not persisted</span>
              )}
              <button className={styles.logoutBtn} onClick={() => setAuthed(false)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                  <polyline points="16,17 21,12 16,7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
        <div className={styles.headerGlow} />
      </div>

      <div className={styles.content}>
        <div className={styles.panelHeader}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
          All Edits ({edits.length})
        </div>

        {loading ? (
          <div className={styles.loadingState}>
            <span className={styles.spinner} />
            Loading archive...
          </div>
        ) : edits.length === 0 ? (
          <div className={styles.emptyState}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            <p>No edits in the archive yet</p>
            <span>Upload your first edit via Tempest Upload</span>
          </div>
        ) : (
          <div className={styles.editList}>
            <AnimatePresence>
              {edits.map((edit) => (
                <motion.div
                  key={edit.id}
                  className={`${styles.editItem} ${edit.featured ? styles.editFeatured : ''}`}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.25 }}
                >
                  <img
                    src={edit.thumbnail}
                    alt={edit.title}
                    className={styles.editThumb}
                    loading="lazy"
                    onError={e => { e.currentTarget.style.opacity = '0.3' }}
                  />
                  <div className={styles.editInfo}>
                    <div className={styles.editTopRow}>
                      <span className={styles.editCategory}>{edit.category}</span>
                      {edit.featured && (
                        <span className={styles.featuredTag}>
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                          </svg>
                          Featured
                        </span>
                      )}
                      {edit.quality && (
                        <span className={styles.qualityTag}>{edit.quality}</span>
                      )}
                    </div>
                    <h3 className={styles.editTitle}>{edit.title}</h3>
                    {edit.description && (
                      <p className={styles.editDesc}>{edit.description}</p>
                    )}
                    <div className={styles.editMeta}>
                      <span>{(edit.views || 0).toLocaleString()} views</span>
                      {edit.tags?.length > 0 && (
                        <span className={styles.editTags}>
                          {edit.tags.slice(0, 3).map(t => `#${t}`).join(' ')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={styles.editActions}>
                    <button
                      className={`${styles.featuredBtn} ${edit.featured ? styles.featuredActive : ''}`}
                      onClick={() => handleToggleFeatured(edit)}
                      disabled={toggling === edit.id}
                      title={edit.featured ? 'Remove from featured' : 'Mark as featured'}
                    >
                      {toggling === edit.id ? (
                        <span className={styles.spinnerSm} />
                      ) : (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill={edit.featured ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                        </svg>
                      )}
                      {edit.featured ? 'Unfeature' : 'Feature'}
                    </button>
                    <button
                      className={styles.editBtn}
                      onClick={() => openEdit(edit)}
                      title="Edit metadata"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                      Edit
                    </button>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => handleDeleteRequest(edit)}
                      disabled={deleting === edit.id}
                      title="Delete this edit"
                    >
                      {deleting === edit.id ? (
                        <span className={styles.spinnerSm} />
                      ) : (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3,6 5,6 21,6"/>
                          <path d="M19,6l-1,14a2,2,0,01-2,2H8a2,2,0,01-2-2L5,6"/>
                          <path d="M10,11v6M14,11v6"/>
                          <path d="M9,6V4a1,1,0,011-1h4a1,1,0,011,1v2"/>
                        </svg>
                      )}
                      Delete
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            className={styles.editModalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) setDeleteConfirm(null) }}
          >
            <motion.div
              className={styles.editModal}
              initial={{ opacity: 0, scale: 0.93, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 20 }}
              style={{ maxWidth: 400 }}
            >
              <div className={styles.editModalHeader}>
                <span className={styles.editModalTitle} style={{ color: 'var(--glow-pink)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}>
                    <polyline points="3,6 5,6 21,6"/>
                    <path d="M19,6l-1,14a2,2,0,01-2,2H8a2,2,0,01-2-2L5,6"/>
                  </svg>
                  Confirm Delete
                </span>
                <button className={styles.editModalClose} onClick={() => setDeleteConfirm(null)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              <div className={styles.editModalBody}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  Are you sure you want to permanently delete <strong style={{ color: 'var(--text-primary)' }}>{deleteConfirm.title}</strong>? This action cannot be undone.
                </p>
              </div>
              <div className={styles.editModalActions}>
                <button className={styles.cancelBtn} onClick={() => setDeleteConfirm(null)}>
                  Cancel
                </button>
                <button
                  className={styles.deleteBtn}
                  onClick={handleDeleteConfirm}
                  style={{ background: 'rgba(244, 114, 182, 0.12)', borderColor: 'rgba(244,114,182,0.3)', color: 'var(--glow-pink)' }}
                >
                  Delete Permanently
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editing && (
          <motion.div
            className={styles.editModalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) setEditing(null) }}
          >
            <motion.div
              className={styles.editModal}
              initial={{ opacity: 0, scale: 0.93, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 20 }}
            >
              <div className={styles.editModalHeader}>
                <span className={styles.editModalTitle}>Edit Metadata</span>
                <button className={styles.editModalClose} onClick={() => setEditing(null)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              <div className={styles.editModalBody}>
                <div className={styles.editModalField}>
                  <label className={styles.editModalLabel}>Title</label>
                  <input
                    className={styles.editModalInput}
                    value={editForm.title}
                    onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="Edit title..."
                    autoFocus
                  />
                </div>
                <div className={styles.editModalField}>
                  <label className={styles.editModalLabel}>Category</label>
                  <select
                    className={styles.editModalInput}
                    value={editForm.category}
                    onChange={e => setEditForm(p => ({ ...p, category: e.target.value }))}
                  >
                    {EDIT_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.editModalField}>
                  <label className={styles.editModalLabel}>Description</label>
                  <textarea
                    className={styles.editModalTextarea}
                    value={editForm.description}
                    onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                    rows={3}
                    placeholder="Description..."
                  />
                </div>
                <div className={styles.editModalField}>
                  <label className={styles.editModalLabel}>Tags (comma-separated)</label>
                  <input
                    className={styles.editModalInput}
                    value={editForm.tags}
                    onChange={e => setEditForm(p => ({ ...p, tags: e.target.value }))}
                    placeholder="rimuru, amv, epic"
                  />
                </div>
              </div>
              <div className={styles.editModalActions}>
                <button className={styles.cancelBtn} onClick={() => setEditing(null)}>
                  Cancel
                </button>
                <button
                  className={styles.saveBtn}
                  onClick={handleSaveEdit}
                  disabled={saving || !editForm.title?.trim()}
                >
                  {saving ? <><span className={styles.spinnerSm} /> Saving...</> : 'Save Changes'}
                  <span className={styles.btnGlow} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
