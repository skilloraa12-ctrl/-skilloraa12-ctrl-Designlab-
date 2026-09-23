import { useState } from 'react'
import { splitGlossaryTerms } from './glossaryMatch.js'

// Same idea as the clickable jargon words on 00100101-platform: a term
// found in glossary.js lights up inline wherever it appears in lesson text,
// click reveals its definition, no per-module wiring needed.
function GlossaryTerm({ raw, entry }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="glossary-term-wrap">
      <button type="button" className="glossary-term" onClick={() => setOpen((v) => !v)}>
        {raw}
        <sup>*</sup>
      </button>
      {open && (
        <span className="glossary-term-popup">
          <strong>{entry.ua}</strong> ({entry.en}) — {entry.simple}
        </span>
      )}
    </span>
  )
}

export default function GlossaryText({ text }) {
  if (!text) return null
  const parts = splitGlossaryTerms(text)
  return (
    <>
      {parts.map((p, i) => (p.type === 'term' ? <GlossaryTerm key={i} raw={p.raw} entry={p.entry} /> : <span key={i}>{p.value}</span>))}
    </>
  )
}
