import { useState, useEffect } from 'react'
import { ref, onValue, push, set, remove, runTransaction, update } from 'firebase/database'
import { database, isConfigured } from '../lib/firebase'

const EMPTY_STATS = { totalViews: 0, totalEdits: 0, recentActivity: [] }

export const useEdits = () => {
  const [edits, setEdits] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isConfigured || !database) {
      setLoading(false)
      return
    }
    const editsRef = ref(database, 'edits')
    const unsub = onValue(editsRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const list = Object.entries(data).map(([id, val]) => ({ id, ...val }))
        list.sort((a, b) => b.uploadedAt - a.uploadedAt)
        setEdits(list)
      } else {
        setEdits([])
      }
      setLoading(false)
    })
    return () => unsub()
  }, [])

  return { edits, loading }
}

export const useStats = () => {
  const [stats, setStats] = useState(EMPTY_STATS)

  useEffect(() => {
    if (!isConfigured || !database) return
    const statsRef = ref(database, 'stats')
    const unsub = onValue(statsRef, (snapshot) => {
      const data = snapshot.val()
      if (data) setStats({ ...EMPTY_STATS, ...data })
    })
    return () => unsub()
  }, [])

  return stats
}

const hasViewedThisSession = (editId) => {
  try {
    const key = `viewed_${editId}`
    if (sessionStorage.getItem(key)) return true
    sessionStorage.setItem(key, '1')
    return false
  } catch {
    return false
  }
}

export const incrementView = async (editId) => {
  if (!isConfigured || !database) return
  if (hasViewedThisSession(editId)) return
  try {
    const viewRef = ref(database, `edits/${editId}/views`)
    await runTransaction(viewRef, (current) => (current || 0) + 1)
    const totalRef = ref(database, 'stats/totalViews')
    await runTransaction(totalRef, (current) => (current || 0) + 1)

    const now = Date.now()
    const actRef = ref(database, 'stats/recentActivity')
    const actSnap = await new Promise(resolve => onValue(actRef, resolve, { onlyOnce: true }))
    const acts = actSnap.val() ? Object.values(actSnap.val()) : []
    const updated = [{ action: 'New view on', target: editId, time: 'just now', ts: now }, ...acts].slice(0, 20)
    await set(actRef, updated)
  } catch (err) {
    console.warn('[Tempest] View increment failed:', err.message)
  }
}

export const pushEdit = async (editData) => {
  if (!isConfigured || !database) {
    console.info('[Tempest] Firebase not configured — edit not persisted')
    return { id: `local_${Date.now()}`, ...editData }
  }
  const editsRef = ref(database, 'edits')
  const newRef = push(editsRef)
  const payload = { ...editData, id: newRef.key }
  await set(newRef, payload)

  const countRef = ref(database, 'stats/totalEdits')
  await runTransaction(countRef, (c) => (c || 0) + 1)

  const now = Date.now()
  const actRef = ref(database, 'stats/recentActivity')
  const actSnap = await new Promise(resolve => onValue(actRef, resolve, { onlyOnce: true }))
  const acts = actSnap.val() ? Object.values(actSnap.val()) : []
  const updated = [{ action: 'Upload complete', target: editData.title, time: 'just now', ts: now }, ...acts].slice(0, 20)
  await set(actRef, updated)

  return payload
}

export const deleteEdit = async (editId) => {
  if (!isConfigured || !database) return
  await remove(ref(database, `edits/${editId}`))
  const countRef = ref(database, 'stats/totalEdits')
  await runTransaction(countRef, (c) => Math.max((c || 1) - 1, 0))
}

export const toggleFeatured = async (editId, currentValue) => {
  if (!isConfigured || !database) return
  await update(ref(database, `edits/${editId}`), { featured: !currentValue })
}

export const updateEdit = async (editId, updates) => {
  if (!isConfigured || !database) return
  await update(ref(database, `edits/${editId}`), updates)
}
