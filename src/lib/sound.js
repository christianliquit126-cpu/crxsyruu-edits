let ctx = null

const getCtx = () => {
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)() } catch {}
  }
  return ctx
}

const resume = async (c) => {
  if (c && c.state === 'suspended') {
    try { await c.resume() } catch {}
  }
}

const playTone = (frequency, duration, type = 'sine', gain = 0.06, startFade = 0.01) => {
  const c = getCtx()
  if (!c) return
  resume(c)
  try {
    const osc = c.createOscillator()
    const gainNode = c.createGain()
    osc.connect(gainNode)
    gainNode.connect(c.destination)
    osc.type = type
    osc.frequency.setValueAtTime(frequency, c.currentTime)
    osc.frequency.exponentialRampToValueAtTime(frequency * 0.85, c.currentTime + duration)
    gainNode.gain.setValueAtTime(0, c.currentTime)
    gainNode.gain.linearRampToValueAtTime(gain, c.currentTime + startFade)
    gainNode.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration)
    osc.start(c.currentTime)
    osc.stop(c.currentTime + duration)
  } catch {}
}

const playNoise = (duration = 0.06, gain = 0.04) => {
  const c = getCtx()
  if (!c) return
  resume(c)
  try {
    const bufSize = c.sampleRate * duration
    const buffer = c.createBuffer(1, bufSize, c.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.3
    const src = c.createBufferSource()
    src.buffer = buffer
    const gainNode = c.createGain()
    const filter = c.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 3200
    filter.Q.value = 0.8
    src.connect(filter)
    filter.connect(gainNode)
    gainNode.connect(c.destination)
    gainNode.gain.setValueAtTime(gain, c.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration)
    src.start(c.currentTime)
  } catch {}
}

let enabled = true
try { enabled = localStorage.getItem('tempest_sound') !== '0' } catch {}

export const setSoundEnabled = (val) => {
  enabled = val
  try { localStorage.setItem('tempest_sound', val ? '1' : '0') } catch {}
}

export const isSoundEnabled = () => enabled

export const sounds = {
  tap: () => {
    if (!enabled) return
    playNoise(0.05, 0.05)
    playTone(880, 0.08, 'sine', 0.04, 0.005)
  },
  hover: () => {
    if (!enabled) return
    playTone(1200, 0.06, 'sine', 0.018, 0.01)
  },
  open: () => {
    if (!enabled) return
    playTone(440, 0.12, 'sine', 0.05, 0.01)
    setTimeout(() => playTone(660, 0.1, 'sine', 0.04, 0.01), 60)
  },
  close: () => {
    if (!enabled) return
    playTone(660, 0.08, 'sine', 0.04, 0.01)
    setTimeout(() => playTone(440, 0.1, 'sine', 0.03, 0.01), 50)
  },
  nav: () => {
    if (!enabled) return
    playTone(520, 0.1, 'sine', 0.035, 0.008)
  },
  success: () => {
    if (!enabled) return
    playTone(523, 0.1, 'sine', 0.05, 0.01)
    setTimeout(() => playTone(659, 0.1, 'sine', 0.04, 0.01), 80)
    setTimeout(() => playTone(784, 0.18, 'sine', 0.04, 0.01), 160)
  },
  toggle: () => {
    if (!enabled) return
    playNoise(0.04, 0.03)
    playTone(700, 0.07, 'sine', 0.035, 0.008)
  },
  swipe: () => {
    if (!enabled) return
    playTone(400, 0.09, 'sine', 0.03, 0.005)
  },
  videoPlay: () => {
    if (!enabled) return
    playTone(330, 0.15, 'sine', 0.03, 0.01)
  },
}

export const initSound = () => {
  const c = getCtx()
  resume(c)
}
