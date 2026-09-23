// Generic undo/redo history for a single piece of Lab state. One state
// object per hook instance - a Lab combines whatever it needs to undo
// (base color, overrides, shapes, ...) into one value and passes it here.

import { useState, useCallback } from 'react'

export function useLabHistory(initialValue, limit = 50) {
  const [state, setState] = useState({ list: [initialValue], index: 0 })

  const value = state.list[state.index]

  const set = useCallback((next) => {
    setState((prev) => {
      const current = prev.list[prev.index]
      const resolved = typeof next === 'function' ? next(current) : next
      if (resolved === current) return prev
      const trimmed = prev.list.slice(0, prev.index + 1)
      const list = [...trimmed, resolved].slice(-limit)
      return { list, index: list.length - 1 }
    })
  }, [limit])

  const undo = useCallback(() => {
    setState((prev) => ({ ...prev, index: Math.max(0, prev.index - 1) }))
  }, [])

  const redo = useCallback(() => {
    setState((prev) => ({ ...prev, index: Math.min(prev.list.length - 1, prev.index + 1) }))
  }, [])

  const reset = useCallback((value) => {
    setState({ list: [value], index: 0 })
  }, [])

  return {
    value, set, undo, redo, reset,
    canUndo: state.index > 0,
    canRedo: state.index < state.list.length - 1,
  }
}
