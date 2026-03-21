import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEdits, deleteEdit } from '../hooks/useFirebaseData'
import styles from './Admin.module.css'

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'tempest2024'

export default function Admin() {
  const [authed, setAuthed] = useState(false)
  const [pw, setPw] = useState('')
  const [pwError, setPwError] = useState('')
  const [deleting, setDeleting] = useState(null)
  const { edits, loading } = useEdits()

  const handleLogin = (e) => {
    e.preventDefault()
    if (pw === ADMIN_PASSWORD) {
      setAuthed(true)
      setPwError('')
    } else {
      setPwError('Access denied. Invalid credentials.')
    }
  }

  const handleDelete = async (edit) => {
    if (!window.confirm(`Delete "${edit.title}"? This cannot be undone.`)) return
    setDeleting(edit.id)
    try {
      await deleteEdit(edit.id)
    } catch (err) {
      alert('Delete failed: ' + err.message)
    } finally {
      setDeleting(null)
    }
  }

  if (!authed) {
    return (
      <div className={styles.page}>
        <div className={styles.loginWrap}>
          <motion.div
            className={styles.loginPanel}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className={styles.loginIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
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
                />
              </div>
              {pwError && <p className={styles.pwError}>{pwError}</p>}
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
            <button className={styles.logoutBtn} onClick={() => setAuthed(false)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                <polyline points="16,17 21,12 16,7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Logout
            </button>
          </div>
        </div>
        <div className={styles.headerGlow} />
      </div>

      <div className={styles.content}>
        <div className={styles.panelHeader}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
          All Edits ({edits.length})
        </div>

        {loading ? (
          <div className={styles.loading}>Loading archive...</div>
        ) : (
          <div className={styles.editList}>
            {edits.map((edit) => (
              <motion.div
                key={edit.id}
                className={styles.editItem}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <img
                  src={edit.thumbnail}
                  alt={edit.title}
                  className={styles.editThumb}
                />
                <div className={styles.editInfo}>
                  <span className={styles.editCategory}>{edit.category}</span>
                  <h3 className={styles.editTitle}>{edit.title}</h3>
                  <p className={styles.editDesc}>{edit.description}</p>
                  <div className={styles.editMeta}>
                    <span>{(edit.views || 0).toLocaleString()} views</span>
                    {edit.featured && <span className={styles.featuredTag}>Featured</span>}
                  </div>
                </div>
                <div className={styles.editActions}>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => handleDelete(edit)}
                    disabled={deleting === edit.id}
                  >
                    {deleting === edit.id ? (
                      <span className={styles.spinner} />
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
          </div>
        )}
      </div>
    </div>
  )
}
