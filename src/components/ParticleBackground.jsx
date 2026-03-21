import { useEffect, useRef } from 'react'
import { useDevicePerformance } from '../hooks/useDevicePerformance'

export default function ParticleBackground() {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const { isLowEnd } = useDevicePerformance()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const count = isLowEnd ? 28 : 65
    let particles = []
    let width, height

    const resize = () => {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const randBetween = (a, b) => a + Math.random() * (b - a)

    const COLORS = [
      'rgba(56, 189, 248,',
      'rgba(125, 211, 252,',
      'rgba(45, 212, 191,',
      'rgba(129, 140, 248,',
    ]

    for (let i = 0; i < count; i++) {
      particles.push({
        x: randBetween(0, window.innerWidth),
        y: randBetween(0, window.innerHeight),
        size: randBetween(0.8, 2.2),
        speedX: randBetween(-0.18, 0.18),
        speedY: randBetween(-0.35, -0.08),
        opacity: randBetween(0.3, 0.9),
        opacityDelta: randBetween(0.003, 0.008) * (Math.random() > 0.5 ? 1 : -1),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      })
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height)

      particles.forEach((p) => {
        p.x += p.speedX
        p.y += p.speedY
        p.opacity += p.opacityDelta
        if (p.opacity <= 0.15 || p.opacity >= 0.95) p.opacityDelta *= -1
        if (p.y < -10) { p.y = height + 10; p.x = randBetween(0, width) }
        if (p.x < -10) p.x = width + 10
        if (p.x > width + 10) p.x = -10

        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3)
        gradient.addColorStop(0, `${p.color}${p.opacity})`)
        gradient.addColorStop(1, `${p.color}0)`)

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 0.6, 0, Math.PI * 2)
        ctx.fillStyle = `${p.color}${Math.min(p.opacity + 0.3, 1)})`
        ctx.fill()
      })

      if (!isLowEnd) {
        particles.forEach((p, i) => {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = p.x - particles[j].x
            const dy = p.y - particles[j].y
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist < 90) {
              ctx.beginPath()
              ctx.moveTo(p.x, p.y)
              ctx.lineTo(particles[j].x, particles[j].y)
              ctx.strokeStyle = `rgba(56, 189, 248, ${0.06 * (1 - dist / 90)})`
              ctx.lineWidth = 0.5
              ctx.stroke()
            }
          }
        })
      }

      animRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      window.removeEventListener('resize', resize)
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [isLowEnd])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  )
}
