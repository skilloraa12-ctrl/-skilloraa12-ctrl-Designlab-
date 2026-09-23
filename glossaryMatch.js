import { GLOSSARY } from './glossary.js'

// Longest phrase first, so e.g. "кольоровий профіль" wins over a shorter
// entry that happens to be a prefix of it starting at the same position.
const ENTRIES = [...GLOSSARY].sort((a, b) => b.ua.length - a.ua.length)

const isWordChar = (ch) => !!ch && /[a-zа-яіїєґ'ʼ-]/i.test(ch)

// Scans `text` left to right for GLOSSARY terms (by their `ua` label),
// case-insensitively. Single-word terms also match a short inflectional
// suffix (up to 4 extra letters) so "кернінг" still lights up as "кернінгу"
// or "кернінгом" — multi-word phrases require an exact match, since
// declension across a whole phrase isn't worth the complexity here.
// Returns an array of {type:"text", value} | {type:"term", raw, entry}.
export function splitGlossaryTerms(text) {
  const lower = text.toLowerCase();
  const raw = [];
  let i = 0;

  while (i < text.length) {
    let best = null; // { len, entry }
    if (!isWordChar(text[i - 1])) {
      for (const entry of ENTRIES) {
        const needle = entry.ua.toLowerCase();
        if (!lower.startsWith(needle, i)) continue;
        const after = text[i + needle.length];
        let len = needle.length;
        if (isWordChar(after)) {
          if (needle.includes(" ")) continue; // phrase must land on a boundary
          let end = i + needle.length;
          while (end < text.length && isWordChar(text[end]) && end - i - needle.length < 4) end++;
          if (isWordChar(text[end])) continue; // still mid-word past the suffix budget
          len = end - i;
        }
        if (!best || len > best.len) best = { len, entry };
      }
    }
    if (best) {
      raw.push({ type: "term", raw: text.slice(i, i + best.len), entry: best.entry });
      i += best.len;
    } else {
      raw.push({ type: "text", value: text[i] });
      i += 1;
    }
  }

  const merged = [];
  for (const part of raw) {
    const last = merged[merged.length - 1];
    if (part.type === "text" && last && last.type === "text") last.value += part.value;
    else merged.push(part.type === "text" ? { type: "text", value: part.value } : part);
  }
  return merged;
}
