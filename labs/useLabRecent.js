// Cross-Lab "recently used" list, grouped by kind. Stored under a single
// localStorage key (labsRecent) shared by every Lab.

import { useState, useCallback, useEffect } from 'react'
import { loadJSON, saveJSON } from '../storage.js'

export function useLabRecent(kind, limit = 20) {
  const [all, setAll] = useState(() => loadJSON('labsRecent', {}))

  useEffect(() => {
    saveJSON('labsRecent', all)
  }, [all])

  const items = all[kind] || []

  const push = useCallback((item) => {
    setAll((prev) => {
      const list = (prev[kind] || []).filter((x) => x !== item)
      return { ...prev, [kind]: [item, ...list].slice(0, limit) }
    })
  }, [kind, limit])

  const clear = useCallback(() => {
    setAll((prev) => ({ ...prev, [kind]: [] }))
  }, [kind])

  return { items, push, clear }
}
