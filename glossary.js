// The Словник lives in data/dictionary/terms.js now (full categories,
// levels, related terms etc). This file stays only so glossaryMatch.js and
// GlossaryText.jsx - which light up glossary words inline in lesson text -
// keep working unchanged, without a second copy of the same 164 terms.
import { TERMS } from './data/dictionary/terms.js'

export const GLOSSARY = TERMS.map((t) => ({ slug: t.id, en: t.en, ua: t.ua, simple: t.shortDef }))
