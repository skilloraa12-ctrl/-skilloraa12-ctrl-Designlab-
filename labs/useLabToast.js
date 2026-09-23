// Short-lived success/status feedback ("✓ Saved", "✓ Copied") instead of
// intrusive popups.

import { useState, useCallback, useRef } from 'react'

export function useLabToast() {
  const [toast, setToast] = useState(null)
  const timer = useRef(null)

  const show = useCallback((message, duration = 1800) => {
    setToast(message)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setToast(null), duration)
  }, [])

  return { toast, show }
}
