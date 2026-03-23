import { useEffect, useRef } from 'react'
import styles from './CursorGlow.module.css'

export default function CursorGlow({ disabled = false }) {
  const dotRef = useRef(null)
  const trailRef = useRef(null)
  const posRef = useRef({ x: -200, y: -200 })
  const trailPosRef = useRef({ x: -200, y: -200 })
  const frameRef = useRef(null)
  const visibleRef = useRef(false)

  useEffect(() => {
    if (disabled) return
    const isMobile = window.matchMedia('(pointer: coarse)').matches
    if (isMobile) return

    const onMove = (e) => {
      posRef.current = { x: e.clientX, y: e.clientY }
      if (!visibleRef.current) {
        visibleRef.current = true
        if (dotRef.current) dotRef.current.style.opacity = '1'
        if (trailRef.current) trailRef.current.style.opacity = '1'
      }
    }

    const animate = () => {
      const dot = dotRef.current
      const trail = trailRef.current
      if (dot && trail) {
        const dx = posRef.current.x - trailPosRef.current.x
        const dy = posRef.current.y - trailPosRef.current.y
        trailPosRef.current.x += dx * 0.12
        trailPosRef.current.y += dy * 0.12

        dot.style.transform = `translate(${posRef.current.x}px, ${posRef.current.y}px) translate(-50%, -50%)`
        trail.style.transform = `translate(${trailPosRef.current.x}px, ${trailPosRef.current.y}px) translate(-50%, -50%)`
      }
      frameRef.current = requestAnimationFrame(animate)
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    frameRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('mousemove', onMove)
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [disabled])

  if (disabled) return null

  return (
    <>
      <div ref={trailRef} className={styles.trail} style={{ opacity: 0 }} />
      <div ref={dotRef} className={styles.dot} style={{ opacity: 0 }} />
    </>
  )
}
