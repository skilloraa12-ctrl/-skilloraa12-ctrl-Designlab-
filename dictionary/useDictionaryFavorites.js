// "Мої терміни" - term ids the user starred. Stored under localStorage key
// dictionaryFavorites (via storage.js's designlab:v1: namespace), separate
// from the Labs favorites system since Dictionary is its own feature.
import { useState, useCallback, useEffect } from 'react'
import { loadJSON, saveJSON } from '../storage.js'

export function useDictionaryFavorites() {
  const [ids, setIds] = useState(() => loadJSON('dictionaryFavorites', []))

  useEffect(() => {
    saveJSON('dictionaryFavorites', ids)
  }, [ids])

  const toggle = useCallback((termId) => {
    setIds((prev) => (prev.includes(termId) ? prev.filter((id) => id !== termId) : [termId, ...prev]))
  }, [])

  const isFavorite = useCallback((termId) => ids.includes(termId), [ids])

  return { ids, toggle, isFavorite }
}
