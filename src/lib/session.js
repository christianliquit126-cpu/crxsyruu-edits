const P = 'tempest_'

export const session = {
  saveLastViewed: (editId) => {
    try { localStorage.setItem(P + 'last_viewed', editId) } catch {}
  },
  getLastViewed: () => {
    try { return localStorage.getItem(P + 'last_viewed') } catch { return null }
  },

  saveTimestamp: (editId, time) => {
    if (!editId || !time || time < 2) return
    try {
      const map = JSON.parse(localStorage.getItem(P + 'timestamps') || '{}')
      map[editId] = time
      localStorage.setItem(P + 'timestamps', JSON.stringify(map))
    } catch {}
  },
  getTimestamp: (editId) => {
    try {
      const map = JSON.parse(localStorage.getItem(P + 'timestamps') || '{}')
      return map[editId] || 0
    } catch { return 0 }
  },
  clearTimestamp: (editId) => {
    try {
      const map = JSON.parse(localStorage.getItem(P + 'timestamps') || '{}')
      delete map[editId]
      localStorage.setItem(P + 'timestamps', JSON.stringify(map))
    } catch {}
  },

  saveScroll: (route, y) => {
    try {
      const map = JSON.parse(sessionStorage.getItem(P + 'scroll') || '{}')
      map[route] = y
      sessionStorage.setItem(P + 'scroll', JSON.stringify(map))
    } catch {}
  },
  getScroll: (route) => {
    try {
      const map = JSON.parse(sessionStorage.getItem(P + 'scroll') || '{}')
      return map[route] || 0
    } catch { return 0 }
  },

  setGlobalMute: (val) => {
    try { localStorage.setItem(P + 'global_mute', val ? '1' : '0') } catch {}
  },
  getGlobalMute: () => {
    try { return localStorage.getItem(P + 'global_mute') === '1' } catch { return false }
  },

  saveVolume: (v) => {
    try { localStorage.setItem(P + 'volume', String(Math.max(0, Math.min(1, v)))) } catch {}
  },
  getVolume: () => {
    try { return parseFloat(localStorage.getItem(P + 'volume') ?? '1') || 1 } catch { return 1 }
  },

  saveInteractions: (data) => {
    try { localStorage.setItem(P + 'interactions', JSON.stringify(data)) } catch {}
  },
  getInteractions: () => {
    try { return JSON.parse(localStorage.getItem(P + 'interactions') || '{}') } catch { return {} }
  },
}
