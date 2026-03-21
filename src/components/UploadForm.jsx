import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { uploadToCloudinary, isCloudinaryConfigured } from '../lib/cloudinary'
import { pushEdit } from '../hooks/useFirebaseData'
import { CATEGORIES } from '../lib/demoData'
import styles from './UploadForm.module.css'

const UPLOAD_STATES = { IDLE: 'idle', UPLOADING: 'uploading', PROCESSING: 'processing', COMPLETE: 'complete', ERROR: 'error' }

export default function UploadForm({ onSuccess }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [uploadState, setUploadState] = useState(UPLOAD_STATES.IDLE)
  const [progress, setProgress] = useState(0)
  const [formData, setFormData] = useState({ title: '', description: '', category: 'AMV', tags: '' })
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const handleFile = useCallback((f) => {
    if (!f) return
    const isVideo = f.type.startsWith('video/')
    const isImage = f.type.startsWith('image/')
    if (!isVideo && !isImage) { setError('Only video and image files are supported.'); return }
    if (f.size > 500 * 1024 * 1024) { setError('File must be under 500MB.'); return }
    setError('')
    setFile(f)
    const url = URL.createObjectURL(f)
    setPreview({ url, type: isVideo ? 'video' : 'image' })
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [handleFile])

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true) }
  const handleDragLeave = () => setDragging(false)

  const handleInputChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) { setError('Please select a file to upload.'); return }
    if (!formData.title.trim()) { setError('Please enter a title.'); return }
    setError('')

    try {
      setUploadState(UPLOAD_STATES.UPLOADING)
      setProgress(0)

      const result = await uploadToCloudinary(file, setProgress)

      setUploadState(UPLOAD_STATES.PROCESSING)
      await new Promise(r => setTimeout(r, 800))

      const tags = formData.tags.split(',').map(t => t.trim()).filter(Boolean)
      const editData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        tags,
        thumbnail: preview?.type === 'image' ? result.url : result.url,
        videoUrl: preview?.type === 'video' ? result.url : '',
        views: 0,
        featured: false,
        uploadedAt: Date.now(),
        uploader: 'Crxsyruu',
        publicId: result.publicId,
        resourceType: result.resourceType,
      }

      await pushEdit(editData)
      setUploadState(UPLOAD_STATES.COMPLETE)
      setTimeout(() => {
        onSuccess && onSuccess(editData)
        setUploadState(UPLOAD_STATES.IDLE)
        setFile(null)
        setPreview(null)
        setProgress(0)
        setFormData({ title: '', description: '', category: 'AMV', tags: '' })
      }, 2800)
    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.')
      setUploadState(UPLOAD_STATES.ERROR)
    }
  }

  const isSubmitting = [UPLOAD_STATES.UPLOADING, UPLOAD_STATES.PROCESSING].includes(uploadState)

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div
        className={`${styles.dropZone} ${dragging ? styles.dragging : ''} ${file ? styles.hasFile : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !file && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*,image/*"
          className={styles.hiddenInput}
          onChange={(e) => handleFile(e.target.files[0])}
        />

        <AnimatePresence mode="wait">
          {!file ? (
            <motion.div
              key="empty"
              className={styles.dropContent}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className={styles.uploadIcon}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <polyline points="16,16 12,12 8,16"/>
                  <line x1="12" y1="12" x2="12" y2="21"/>
                  <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/>
                </svg>
              </div>
              <p className={styles.dropTitle}>Drag & drop your file here</p>
              <p className={styles.dropSub}>or click to browse</p>
              <p className={styles.dropMeta}>Video or image — up to 500MB</p>
              <div className={styles.dropBorderAnim} />
            </motion.div>
          ) : (
            <motion.div
              key="preview"
              className={styles.previewWrap}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              {preview?.type === 'video' ? (
                <video src={preview.url} className={styles.previewMedia} muted />
              ) : (
                <img src={preview.url} alt="preview" className={styles.previewMedia} />
              )}
              <div className={styles.previewInfo}>
                <span className={styles.fileName}>{file.name}</span>
                <span className={styles.fileSize}>{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                <button
                  type="button"
                  className={styles.removeFile}
                  onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null) }}
                >
                  Remove
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className={styles.fields}>
        <div className={styles.field}>
          <label className={styles.label}>Title</label>
          <input
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Edit title..."
            disabled={isSubmitting}
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Short description of this edit..."
            rows={3}
            disabled={isSubmitting}
            className={styles.textarea}
          />
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              disabled={isSubmitting}
              className={styles.select}
            >
              {CATEGORIES.filter(c => c !== 'All').map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Tags <span className={styles.labelNote}>(comma-separated)</span></label>
            <input
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              placeholder="rimuru, amv, epic"
              disabled={isSubmitting}
              className={styles.input}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className={styles.errorMsg}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      )}

      <AnimatePresence>
        {isSubmitting && (
          <motion.div
            className={styles.progressWrap}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className={styles.progressLabel}>
              <span>{uploadState === UPLOAD_STATES.UPLOADING ? 'Uploading...' : 'Processing...'}</span>
              <span>{progress}%</span>
            </div>
            <div className={styles.progressBar}>
              <motion.div
                className={styles.progressFill}
                animate={{ width: `${uploadState === UPLOAD_STATES.PROCESSING ? 100 : progress}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
              <div className={styles.progressGlow} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {uploadState === UPLOAD_STATES.COMPLETE && (
          <motion.div
            className={styles.successMsg}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <div className={styles.successGlow} />
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
              <polyline points="22,4 12,14.01 9,11.01"/>
            </svg>
            Upload complete — Tempest Archive updated
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="submit"
        className={styles.submitBtn}
        disabled={isSubmitting || uploadState === UPLOAD_STATES.COMPLETE}
      >
        {isSubmitting ? (
          <span className={styles.btnSpinner} />
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="16,16 12,12 8,16"/>
            <line x1="12" y1="12" x2="12" y2="21"/>
            <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/>
          </svg>
        )}
        {isSubmitting ? 'Uploading...' : 'Upload to Tempest Archive'}
        <span className={styles.btnGlow} />
      </button>

      {!isCloudinaryConfigured && (
        <p className={styles.demoNote}>Running in demo mode — Cloudinary credentials not configured.</p>
      )}
    </form>
  )
}
