import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { uploadToCloudinary, isCloudinaryConfigured } from '../lib/cloudinary'
import { pushEdit } from '../hooks/useFirebaseData'
import { CATEGORIES } from '../lib/demoData'
import styles from './UploadForm.module.css'

const UPLOAD_STATES = {
  IDLE: 'idle',
  UPLOADING: 'uploading',
  PROCESSING: 'processing',
  COMPLETE: 'complete',
  ERROR: 'error',
}

const MAX_FILE_SIZE = 4 * 1024 * 1024 * 1024

const formatSize = (bytes) => {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / 1024).toFixed(0)} KB`
}

export default function UploadForm({ onSuccess }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [uploadState, setUploadState] = useState(UPLOAD_STATES.IDLE)
  const [progress, setProgress] = useState(0)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'AMV',
    tags: '',
    featured: false,
  })
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const handleFile = useCallback((f) => {
    if (!f) return
    const isVideo = f.type.startsWith('video/')
    const isImage = f.type.startsWith('image/')
    if (!isVideo && !isImage) {
      setError('Only video and image files are supported.')
      return
    }
    if (f.size > MAX_FILE_SIZE) {
      setError('File must be under 4 GB.')
      return
    }
    setError('')
    if (f.size > 500 * 1024 * 1024) {
      setError(`Large file detected (${formatSize(f.size)}). Upload may take a while — Ultra HD quality preserved. Ensure good connection.`)
    }
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
  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false)
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
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
      await new Promise(r => setTimeout(r, 1000))

      const tags = formData.tags.split(',').map(t => t.trim()).filter(Boolean)
      const isVideo = preview?.type === 'video'

      const editData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        tags,
        thumbnail: isVideo
          ? `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/video/upload/so_0,w_1280,h_720,c_fill,q_auto/${result.publicId}.jpg`
          : result.url,
        videoUrl: isVideo ? result.url : '',
        views: 0,
        featured: formData.featured,
        uploadedAt: Date.now(),
        uploader: 'Crxsyruu',
        publicId: result.publicId,
        resourceType: result.resourceType,
        quality: result.width && result.height
          ? (result.width >= 3840 ? '4K UHD' : result.width >= 1920 ? '1080p HD' : 'SD')
          : undefined,
        width: result.width,
        height: result.height,
        duration: result.duration,
      }

      await pushEdit(editData)
      setUploadState(UPLOAD_STATES.COMPLETE)

      setTimeout(() => {
        onSuccess && onSuccess(editData)
        setUploadState(UPLOAD_STATES.IDLE)
        setFile(null)
        setPreview(null)
        setProgress(0)
        setFormData({ title: '', description: '', category: 'AMV', tags: '', featured: false })
      }, 3000)
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

        <div className={styles.dropBorderAnim} />

        <AnimatePresence mode="wait">
          {!file ? (
            <motion.div
              key="empty"
              className={styles.dropContent}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className={styles.uploadIconWrap}>
                <div className={styles.uploadIconRing} />
                <div className={styles.uploadIcon}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                    <polyline points="16,16 12,12 8,16"/>
                    <line x1="12" y1="12" x2="12" y2="21"/>
                    <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/>
                  </svg>
                </div>
              </div>
              <p className={styles.dropTitle}>Drag & drop your file here</p>
              <p className={styles.dropSub}>or click to browse</p>
              <div className={styles.dropBadges}>
                <span className={styles.dropBadge}>Video</span>
                <span className={styles.dropBadge}>Image</span>
                <span className={`${styles.dropBadge} ${styles.uhdBadge}`}>Ultra HD Ready</span>
              </div>
              <p className={styles.dropMeta}>MP4 · MOV · WebM · JPG · PNG · up to 4 GB</p>
            </motion.div>
          ) : (
            <motion.div
              key="preview"
              className={styles.previewWrap}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
            >
              {preview?.type === 'video' ? (
                <video src={preview.url} className={styles.previewMedia} muted playsInline />
              ) : (
                <img src={preview.url} alt="preview" className={styles.previewMedia} />
              )}
              <div className={styles.previewInfo}>
                <span className={styles.fileName}>{file.name}</span>
                <span className={styles.fileSize}>{formatSize(file.size)}</span>
                {file.size >= 1920 * 1080 * 4 && (
                  <span className={styles.uhdPill}>Ultra HD</span>
                )}
                <button
                  type="button"
                  className={styles.removeFile}
                  onClick={(e) => {
                    e.stopPropagation()
                    setFile(null)
                    setPreview(null)
                    if (fileInputRef.current) fileInputRef.current.value = ''
                  }}
                >
                  Remove file
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className={styles.fields}>
        <div className={styles.field}>
          <div className={styles.labelRow}>
            <label className={styles.label}>Title</label>
            <span className={styles.charCount}>{formData.title.length}/120</span>
          </div>
          <input
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Enter edit title..."
            disabled={isSubmitting}
            maxLength={120}
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <div className={styles.labelRow}>
            <label className={styles.label}>Description</label>
            <span className={styles.charCount}>{formData.description.length}/500</span>
          </div>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Describe this edit..."
            rows={3}
            disabled={isSubmitting}
            maxLength={500}
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
            <label className={styles.label}>
              Tags <span className={styles.labelNote}>(comma-separated)</span>
            </label>
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

        <label className={styles.checkRow}>
          <input
            type="checkbox"
            name="featured"
            checked={formData.featured}
            onChange={handleInputChange}
            disabled={isSubmitting}
            className={styles.checkbox}
          />
          <span className={styles.checkLabel}>Mark as Featured Edit</span>
          <span className={styles.checkNote}>Featured edits are highlighted on the home page</span>
        </label>
      </div>

      {error && (
        <motion.div
          className={styles.errorMsg}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </motion.div>
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
              <span className={styles.progressState}>
                {uploadState === UPLOAD_STATES.UPLOADING
                  ? '⬆ Uploading to Cloudinary...'
                  : '⚙ Processing & optimizing...'}
              </span>
              <span className={styles.progressPct}>{uploadState === UPLOAD_STATES.PROCESSING ? '100' : progress}%</span>
            </div>
            <div className={styles.progressBar}>
              <motion.div
                className={styles.progressFill}
                animate={{
                  width: `${uploadState === UPLOAD_STATES.PROCESSING ? 100 : progress}%`
                }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
              <div className={styles.progressGlow} />
            </div>
            <p className={styles.progressSub}>
              {uploadState === UPLOAD_STATES.UPLOADING
                ? 'Large files may take a moment — Ultra HD quality preserved'
                : 'Generating thumbnails and optimizing delivery'}
            </p>
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
            <div className={styles.successPulse} />
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
              <polyline points="22,4 12,14.01 9,11.01"/>
            </svg>
            <span>Upload complete — Tempest Archive updated</span>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="submit"
        className={styles.submitBtn}
        disabled={isSubmitting || uploadState === UPLOAD_STATES.COMPLETE}
      >
        {isSubmitting ? (
          <>
            <span className={styles.btnSpinner} />
            {uploadState === UPLOAD_STATES.UPLOADING ? 'Uploading...' : 'Processing...'}
          </>
        ) : (
          <>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="16,16 12,12 8,16"/>
              <line x1="12" y1="12" x2="12" y2="21"/>
              <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/>
            </svg>
            Upload to Tempest Archive
          </>
        )}
        <span className={styles.btnGlow} />
      </button>

      {!isCloudinaryConfigured && (
        <p className={styles.demoNote}>
          Cloudinary not configured — uploads are simulated in demo mode.
        </p>
      )}
    </form>
  )
}
