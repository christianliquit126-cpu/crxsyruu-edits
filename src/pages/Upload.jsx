import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import UploadForm from '../components/UploadForm'
import { isCloudinaryConfigured } from '../lib/cloudinary'
import { isConfigured as isFirebaseConfigured } from '../lib/firebase'
import styles from './Upload.module.css'

export default function Upload() {
  const [lastUpload, setLastUpload] = useState(null)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <span className="label-tag">Tempest Upload — 03</span>
          <h1 className={styles.title}>Upload an Edit</h1>
          <p className={styles.subtitle}>
            Drag, drop, and deploy your work into the Tempest Archive.
          </p>
          {(!isCloudinaryConfigured || !isFirebaseConfigured) && (
            <div className={styles.configWarning}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {!isCloudinaryConfigured && !isFirebaseConfigured
                ? 'Cloudinary and Firebase not configured — running in demo mode'
                : !isCloudinaryConfigured
                ? 'Cloudinary not configured — uploads are simulated'
                : 'Firebase not configured — uploads will not be persisted'}
            </div>
          )}
        </div>
        <div className={styles.headerGlow} />
      </div>

      <div className={styles.layout}>
        <motion.div
          className={styles.formPanel}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className={styles.panelHeader}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="16,16 12,12 8,16"/>
              <line x1="12" y1="12" x2="12" y2="21"/>
              <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/>
            </svg>
            <span>Upload Form</span>
            <div className={styles.uhdBadge}>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
              </svg>
              Ultra HD Ready
            </div>
          </div>
          <UploadForm onSuccess={setLastUpload} />
        </motion.div>

        <div className={styles.sidebar}>
          <motion.div
            className={styles.infoCard}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className={styles.infoHeader}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
              Guidelines
            </div>
            <ul className={styles.guideList}>
              <li>Video: MP4, MOV, WebM, AVI</li>
              <li>Image: JPG, PNG, GIF, WebP</li>
              <li>Up to 4 GB — Ultra HD supported</li>
              <li>4K UHD quality preserved by Cloudinary</li>
              <li>Add clear titles and descriptions</li>
              <li>Use relevant tags for discoverability</li>
              <li>Select the correct category</li>
            </ul>
          </motion.div>

          <motion.div
            className={styles.infoCard}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.18 }}
          >
            <div className={styles.infoHeader}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
              </svg>
              Upload Pipeline
            </div>
            <div className={styles.stateList}>
              {[
                { state: 'Uploading', desc: 'File is transmitted to Cloudinary CDN', color: 'var(--glow-blue)' },
                { state: 'Processing', desc: 'Media optimized & thumbnails generated', color: 'var(--glow-purple)' },
                { state: 'Complete', desc: 'Edit is live in the Tempest Archive', color: 'var(--glow-teal)' },
              ].map(s => (
                <div key={s.state} className={styles.stateItem}>
                  <span className={styles.stateDot} style={{ background: s.color, boxShadow: `0 0 8px ${s.color}` }} />
                  <div>
                    <span className={styles.stateName}>{s.state}</span>
                    <span className={styles.stateDesc}>{s.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {lastUpload && (
            <motion.div
              className={styles.successCard}
              initial={{ opacity: 0, scale: 0.93 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35 }}
            >
              <div className={styles.successGlow} />
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--glow-teal)', flexShrink: 0 }}>
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                <polyline points="22,4 12,14.01 9,11.01"/>
              </svg>
              <div>
                <p className={styles.successTitle}>Upload Successful</p>
                <p className={styles.successName}>{lastUpload.title}</p>
                {lastUpload.quality && (
                  <p className={styles.successQuality}>{lastUpload.quality} — Cloudinary CDN</p>
                )}
                <Link to="/gallery" className={styles.successLink}>View in Archive →</Link>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
