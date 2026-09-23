// "Нещодавно переглянуті" terms. localStorage key dictionaryRecentlyViewed.
import { useState, useCallback, useEffect } from 'react'
import { loadJSON, saveJSON } from '../storage.js'

const LIMIT = 20

export function useDictionaryRecent() {
  const [ids, setIds] = useState(() => loadJSON('dictionaryRecentlyViewed', []))

  useEffect(() => {
    saveJSON('dictionaryRecentlyViewed', ids)
  }, [ids])

  const push = useCallback((termId) => {
    setIds((prev) => [termId, ...prev.filter((id) => id !== termId)].slice(0, LIMIT))
  }, [])

  return { ids, push }
}
