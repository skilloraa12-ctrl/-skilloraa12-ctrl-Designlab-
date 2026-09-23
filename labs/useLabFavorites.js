// Cross-Lab favorites, grouped by kind (e.g. 'lab', 'color', 'gradient').
// Stored under a single localStorage key (labsFavorites) shared by every Lab.

import { useState, useCallback, useEffect } from 'react'
import { loadJSON, saveJSON } from '../storage.js'

export function useLabFavorites(kind) {
  const [all, setAll] = useState(() => loadJSON('labsFavorites', {}))

  useEffect(() => {
    saveJSON('labsFavorites', all)
  }, [all])

  const items = all[kind] || []

  const toggle = useCallback((item) => {
    setAll((prev) => {
      const list = prev[kind] || []
      const exists = list.includes(item)
      return { ...prev, [kind]: exists ? list.filter((x) => x !== item) : [item, ...list] }
    })
  }, [kind])

  const isFavorite = useCallback((item) => items.includes(item), [items])

  return { items, toggle, isFavorite }
}
