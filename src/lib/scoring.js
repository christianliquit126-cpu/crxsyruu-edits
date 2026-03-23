export const getDynamicFeatured = (edits, limit = 3) => {
  const now = Date.now()
  const scored = edits.map(e => {
    const ageDays = (now - (e.uploadedAt || 0)) / 86400000
    const recency = Math.max(0, 1 - ageDays / 30)
    const score = (e.views || 0) * (1 + recency * 2)
    return { ...e, _score: score }
  })
  return scored.sort((a, b) => b._score - a._score).slice(0, limit)
}
