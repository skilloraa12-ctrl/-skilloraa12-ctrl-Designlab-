// "Мої інструменти" - tool ids the user starred. localStorage key toolsFavorites.
import { useState, useCallback, useEffect } from 'react'
import { loadJSON, saveJSON } from '../storage.js'

export function useToolsFavorites() {
  const [ids, setIds] = useState(() => loadJSON('toolsFavorites', []))

  useEffect(() => {
    saveJSON('toolsFavorites', ids)
  }, [ids])

  const toggle = useCallback((toolId) => {
    setIds((prev) => (prev.includes(toolId) ? prev.filter((id) => id !== toolId) : [toolId, ...prev]))
  }, [])

  const isFavorite = useCallback((toolId) => ids.includes(toolId), [ids])

  return { ids, toggle, isFavorite }
}
