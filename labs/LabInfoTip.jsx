import { useState, useRef, useEffect } from 'react'

// Small ⓘ info icon next to a complex control. Click to expand a short
// explanation without cluttering the professional workflow around it.
// Closes on an outside click or Escape so the popup never sits open and
// blocking clicks on whatever's underneath it.
export default function LabInfoTip({ title, children }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    if (!open) return
    function handlePointer(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    function handleKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handlePointer)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handlePointer)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  return (
    <span className="lab-infotip" ref={rootRef}>
      <button
        type="button"
        className="lab-infotip-btn"
        aria-label={title ? `Довідка: ${title}` : 'Довідка'}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        ⓘ
      </button>
      {open && (
        <span className="lab-infotip-pop" role="note">
          {title && <b>{title}</b>}
          <span>{children}</span>
        </span>
      )}
    </span>
  )
}
