// Beginner / Pro mode, shared across all Labs (localStorage: labsMode).
// Beginner mode hides advanced/numeric-precision controls; Pro shows everything.

import { useState, useCallback, useEffect } from 'react'
import { loadJSON, saveJSON } from '../storage.js'

export function useLabMode() {
  const [mode, setMode] = useState(() => loadJSON('labsMode', 'beginner'))

  useEffect(() => {
    saveJSON('labsMode', mode)
  }, [mode])

  const toggle = useCallback(() => {
    setMode((m) => (m === 'beginner' ? 'pro' : 'beginner'))
  }, [])

  return { mode, setMode, toggle, isPro: mode === 'pro', isBeginner: mode === 'beginner' }
}
