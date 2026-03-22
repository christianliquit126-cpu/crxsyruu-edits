import { useEffect, useRef } from 'react'
import { useDevicePerformance } from '../hooks/useDevicePerformance'

const isMobileDevice = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(pointer: coarse)').matches

export default function ParticleBackground() {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const { isLowEnd } = useDevicePerformance()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    const mobile = isMobileDevice()

    const count = isLowEnd ? 20 : mobile ? 32 : 55
    const drawConnections = !isLowEnd && !mobile
    const targetFPS = isLowEnd ? 24 : 40
    const frameInterval = 1000 / targetFPS

    let particles = []
    let width = 0
    let height = 0
    let lastFrameTime = 0

    const resize = () => {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    resize()

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(document.body)

    const rand = (a, b) => a + Math.random() * (b - a)

    const COLORS = [
      'rgba(56, 189, 248,',
      'rgba(125, 211, 252,',
      'rgba(45, 212, 191,',
      'rgba(129, 140, 248,',
    ]

    const createParticle = () => ({
      x: rand(0, width || window.innerWidth),
      y: rand(0, height || window.innerHeight),
      size: rand(0.7, 2.0),
      speedX: rand(-0.15, 0.15),
      speedY: rand(-0.3, -0.07),
      opacity: rand(0.3, 0.85),
      opacityDelta: rand(0.003, 0.007) * (Math.random() > 0.5 ? 1 : -1),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    })

    for (let i = 0; i < count; i++) {
      particles.push(createParticle())
    }

    const connectionDist = mobile ? 0 : 80

    const draw = (timestamp) => {
      if (timestamp - lastFrameTime < frameInterval) {
        animRef.current = requestAnimationFrame(draw)
        return
      }
      lastFrameTime = timestamp

      ctx.clearRect(0, 0, width, height)

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        p.x += p.speedX
        p.y += p.speedY
        p.opacity += p.opacityDelta
        if (p.opacity <= 0.15 || p.opacity >= 0.9) p.opacityDelta *= -1
        if (p.y < -10) { p.y = height + 10; p.x = rand(0, width) }
        if (p.x < -10) p.x = width + 10
        if (p.x > width + 10) p.x = -10

        const r = p.size * 3
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r)
        g.addColorStop(0, `${p.color}${p.opacity})`)
        g.addColorStop(1, `${p.color}0)`)
        ctx.beginPath()
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
        ctx.fillStyle = g
        ctx.fill()

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 0.55, 0, Math.PI * 2)
        ctx.fillStyle = `${p.color}${Math.min(p.opacity + 0.25, 1)})`
        ctx.fill()
      }

      if (drawConnections && connectionDist > 0) {
        ctx.lineWidth = 0.5
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x
            const dy = particles[i].y - particles[j].y
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist < connectionDist) {
              ctx.beginPath()
              ctx.moveTo(particles[i].x, particles[i].y)
              ctx.lineTo(particles[j].x, particles[j].y)
              ctx.strokeStyle = `rgba(56, 189, 248, ${0.055 * (1 - dist / connectionDist)})`
              ctx.stroke()
            }
          }
        }
      }

      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)

    return () => {
      resizeObserver.disconnect()
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
        willChange: 'transform',
      }}
    />
  )
}
