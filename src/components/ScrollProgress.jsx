import { useEffect, useRef } from 'react'
import styles from './ScrollProgress.module.css'

export default function ScrollProgress() {
  const fillRef = useRef(null)
  const glowRef = useRef(null)

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement
      const scrolled = el.scrollTop || document.body.scrollTop
      const total = el.scrollHeight - el.clientHeight
      const progress = total > 0 ? (scrolled / total) * 100 : 0
      if (fillRef.current) fillRef.current.style.width = `${progress}%`
      if (glowRef.current) glowRef.current.style.left = `${progress}%`
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className={styles.track}>
      <div ref={fillRef} className={styles.fill} style={{ width: '0%' }} />
      <div ref={glowRef} className={styles.glow} style={{ left: '0%' }} />
    </div>
  )
}
