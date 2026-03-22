import { useState, useCallback } from 'react'
import { session } from '../lib/session'

export function useInteractionTracking(isAdmin = false) {
  const [data, setData] = useState(() => isAdmin ? session.getInteractions() : {})

  const track = useCallback((editId, type) => {
    if (!isAdmin || !editId) return
    setData(prev => {
      const next = { ...prev }
      if (!next[editId]) next[editId] = { clicks: 0, plays: 0, hovers: 0, score: 0, ts: Date.now() }
      if (type === 'click')  next[editId].clicks++
      if (type === 'play')   next[editId].plays++
      if (type === 'hover')  next[editId].hovers++
      next[editId].score = (next[editId].clicks * 3) + (next[editId].plays * 5) + next[editId].hovers
      next[editId].ts = Date.now()
      session.saveInteractions(next)
      return next
    })
  }, [isAdmin])

  const getHeatScore = useCallback((editId) => data[editId]?.score || 0, [data])

  const getTopEdits = useCallback((n = 5) =>
    Object.entries(data)
      .sort((a, b) => b[1].score - a[1].score)
      .slice(0, n)
      .map(([id, info]) => ({ id, ...info }))
  , [data])

  const clearTracking = useCallback(() => {
    session.saveInteractions({})
    setData({})
  }, [])

  return { track, getHeatScore, getTopEdits, clearTracking, trackingData: data }
}
