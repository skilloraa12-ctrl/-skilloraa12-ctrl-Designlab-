// Generic keyboard-shortcut binder for a Lab: Ctrl/Cmd+Z (undo),
// Ctrl/Cmd+Shift+Z (redo), Ctrl/Cmd+S (save), Ctrl/Cmd+C (copy),
// Escape (cancel). Ignores keystrokes while the user is typing in a
// text/number input so it never fights normal text editing.

import { useEffect } from 'react'

function isTypingTarget(el) {
  if (!el) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable
}

export function useLabShortcuts({ onUndo, onRedo, onSave, onCopy, onEscape }) {
  useEffect(() => {
    function handler(e) {
      const mod = e.ctrlKey || e.metaKey
      if (e.key === 'Escape' && onEscape) {
        onEscape()
        return
      }
      if (!mod) return
      const typing = isTypingTarget(document.activeElement)
      if (e.key.toLowerCase() === 'z' && !e.shiftKey && onUndo) {
        e.preventDefault()
        onUndo()
      } else if (e.key.toLowerCase() === 'z' && e.shiftKey && onRedo) {
        e.preventDefault()
        onRedo()
      } else if (e.key.toLowerCase() === 's' && onSave) {
        e.preventDefault()
        onSave()
      } else if (e.key.toLowerCase() === 'c' && !typing && onCopy) {
        onCopy()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onUndo, onRedo, onSave, onCopy, onEscape])
}
