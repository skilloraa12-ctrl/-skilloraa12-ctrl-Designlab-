// "Нещодавно переглянуті" tools. localStorage key toolsRecentlyViewed.
import { useState, useCallback, useEffect } from 'react'
import { loadJSON, saveJSON } from '../storage.js'

const LIMIT = 20

export function useToolsRecent() {
  const [ids, setIds] = useState(() => loadJSON('toolsRecentlyViewed', []))

  useEffect(() => {
    saveJSON('toolsRecentlyViewed', ids)
  }, [ids])

  const push = useCallback((toolId) => {
    setIds((prev) => [toolId, ...prev.filter((id) => id !== toolId)].slice(0, LIMIT))
  }, [])

  return { ids, push }
}
