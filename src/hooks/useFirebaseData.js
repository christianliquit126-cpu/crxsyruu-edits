import { useState, useEffect, useRef } from 'react'
import { ref, onValue, push, set, remove, increment, runTransaction } from 'firebase/database'
import { database, isConfigured } from '../lib/firebase'
import { DEMO_EDITS, DEMO_STATS } from '../lib/demoData'

export const useEdits = () => {
  const [edits, setEdits] = useState(DEMO_EDITS)
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
  const [stats, setStats] = useState(DEMO_STATS)

  useEffect(() => {
    if (!isConfigured || !database) return
    const statsRef = ref(database, 'stats')
    const unsub = onValue(statsRef, (snapshot) => {
      const data = snapshot.val()
      if (data) setStats(data)
    })
    return () => unsub()
  }, [])

  return stats
}

export const incrementView = async (editId) => {
  if (!isConfigured || !database) return
  try {
    const viewRef = ref(database, `edits/${editId}/views`)
    await runTransaction(viewRef, (current) => (current || 0) + 1)
    const totalRef = ref(database, 'stats/totalViews')
    await runTransaction(totalRef, (current) => (current || 0) + 1)
  } catch (err) {
    console.warn('[Tempest] View increment failed:', err.message)
  }
}

export const pushEdit = async (editData) => {
  if (!isConfigured || !database) {
    console.info('[Tempest] Demo mode — edit not persisted to Firebase')
    return { id: `demo_${Date.now()}`, ...editData }
  }
  const editsRef = ref(database, 'edits')
  const newRef = push(editsRef)
  await set(newRef, { ...editData, id: newRef.key })

  const countRef = ref(database, 'stats/totalEdits')
  await runTransaction(countRef, (c) => (c || 0) + 1)

  return { id: newRef.key, ...editData }
}

export const deleteEdit = async (editId) => {
  if (!isConfigured || !database) return
  await remove(ref(database, `edits/${editId}`))
  const countRef = ref(database, 'stats/totalEdits')
  await runTransaction(countRef, (c) => Math.max((c || 1) - 1, 0))
}
