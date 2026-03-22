import { useEffect, useRef } from 'react'
import { useDevicePerformance } from '../hooks/useDevicePerformance'

const isMobileDevice = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(pointer: coarse)').matches

const COLORS_RGBA = [
  [56, 189, 248],
  [125, 211, 252],
  [45, 212, 191],
  [129, 140, 248],
]

const STAMP_SIZE = 64

function buildStamps() {
  return COLORS_RGBA.map(([r, g, b]) => {
    const c = document.createElement('canvas')
    c.width = STAMP_SIZE
    c.height = STAMP_SIZE
    const ctx = c.getContext('2d')
    const cx = STAMP_SIZE / 2
    const grad = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx)
    grad.addColorStop(0, `rgba(${r},${g},${b},1)`)
    grad.addColorStop(1, `rgba(${r},${g},${b},0)`)
    ctx.beginPath()
    ctx.arc(cx, cx, cx, 0, Math.PI * 2)
    ctx.fillStyle = grad
    ctx.fill()
    return c
  })
}

export default function ParticleBackground() {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const { isLowEnd } = useDevicePerformance()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    const mobile = isMobileDevice()

    const count = isLowEnd ? 18 : mobile ? 28 : 48
    const drawConnections = !isLowEnd && !mobile
    const targetFPS = isLowEnd ? 20 : mobile ? 30 : 40
    const frameInterval = 1000 / targetFPS

    const stamps = buildStamps()

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

    const createParticle = () => {
      const colorIndex = Math.floor(Math.random() * COLORS_RGBA.length)
      return {
        x: rand(0, width || window.innerWidth),
        y: rand(0, height || window.innerHeight),
        size: rand(0.8, 2.2),
        speedX: rand(-0.14, 0.14),
        speedY: rand(-0.28, -0.07),
        opacity: rand(0.3, 0.8),
        opacityDelta: rand(0.003, 0.007) * (Math.random() > 0.5 ? 1 : -1),
        colorIndex,
      }
    }

    for (let i = 0; i < count; i++) {
      particles.push(createParticle())
    }

    const connectionDistSq = drawConnections ? 80 * 80 : 0

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
        if (p.opacity <= 0.15 || p.opacity >= 0.85) p.opacityDelta *= -1
        if (p.y < -10) { p.y = height + 10; p.x = rand(0, width) }
        if (p.x < -10) p.x = width + 10
        if (p.x > width + 10) p.x = -10

        const r = p.size * 3
        const d = r * 2
        ctx.globalAlpha = p.opacity * 0.75
        ctx.drawImage(stamps[p.colorIndex], p.x - r, p.y - r, d, d)

        const [cr, cg, cb] = COLORS_RGBA[p.colorIndex]
        ctx.globalAlpha = Math.min(p.opacity + 0.2, 0.9)
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 0.55, 0, Math.PI * 2)
        ctx.fillStyle = `rgb(${cr},${cg},${cb})`
        ctx.fill()
      }

      ctx.globalAlpha = 1

      if (drawConnections && connectionDistSq > 0) {
        ctx.lineWidth = 0.5
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x
            const dy = particles[i].y - particles[j].y
            const distSq = dx * dx + dy * dy
            if (distSq < connectionDistSq) {
              const alpha = 0.055 * (1 - Math.sqrt(distSq) / 80)
              ctx.strokeStyle = `rgba(56,189,248,${alpha})`
              ctx.beginPath()
              ctx.moveTo(particles[i].x, particles[i].y)
              ctx.lineTo(particles[j].x, particles[j].y)
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
