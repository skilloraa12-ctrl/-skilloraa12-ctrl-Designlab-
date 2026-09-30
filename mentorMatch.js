// Пошук відповіді по матеріалу конкретного уроку за ключовими словами.
// Це НЕ штучний інтелект і не жива розмова — просто зіставлення слів
// питання користувача з уже написаним текстом уроку (theory/keyPoints/
// mistakes/selfCheck/topics/quiz). Working без жодного зовнішнього API,
// тому чесно каже "не знайшла", коли питання не пов'язане з уроком,
// замість того щоб вигадувати відповідь.

const STOPWORDS = new Set([
  'і', 'й', 'та', 'а', 'але', 'чи', 'або', 'це', 'цей', 'ця', 'ці', 'той', 'та',
  'як', 'що', 'щоб', 'для', 'в', 'у', 'на', 'з', 'із', 'зі', 'до', 'від', 'по',
  'при', 'про', 'є', 'був', 'була', 'було', 'були', 'не', 'ні', 'так', 'же',
  'ж', 'би', 'б', 'тільки', 'лише', 'вже', 'ще', 'теж', 'також', 'коли', 'де',
  'хто', 'ти', 'ви', 'я', 'ми', 'він', 'вона', 'воно', 'вони', 'мій', 'твій',
  'свій', 'його', 'її', 'їх', 'мене', 'тебе', 'нас', 'вас', 'чому', 'навіщо',
  'можна', 'можеш', 'можу', 'треба', 'потрібно', 'будь', 'ласка', 'запитання',
  'питання', 'скажи', 'поясни', 'розкажи', 'what', 'is', 'the', 'a', 'an',
])

function tokenize(text) {
  return (text.toLowerCase().match(/[\p{L}\p{N}]+/gu) || [])
    .filter((w) => w.length > 2 && !STOPWORDS.has(w))
}

function overlapScore(queryTokens, text) {
  const tokens = tokenize(text)
  if (tokens.length === 0 || queryTokens.length === 0) return 0
  const tokenSet = new Set(tokens)
  let hits = 0
  for (const qt of queryTokens) if (tokenSet.has(qt)) hits++
  return hits
}

// Розбиває теорію на окремі речення, щоб зіставлення було точнішим,
// ніж по всьому абзацу одразу.
function splitSentences(text) {
  return text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter((s) => s.length > 15)
}

function buildCorpus(module) {
  const corpus = []
  for (const sentence of splitSentences(module.theory || '')) {
    corpus.push({ source: 'theory', label: 'Теорія', text: sentence })
  }
  for (const kp of module.keyPoints || []) {
    corpus.push({ source: 'keyPoint', label: 'Ключовий принцип', text: kp })
  }
  for (const m of module.mistakes || []) {
    corpus.push({ source: 'mistake', label: 'Типова помилка', text: m })
  }
  for (const sc of module.selfCheck || []) {
    corpus.push({ source: 'selfCheck', label: 'Самоперевірка', text: sc })
  }
  for (const q of module.quiz || []) {
    const correct = q.options[q.correctAnswer]
    corpus.push({ source: 'quiz', label: 'З міні-тесту', text: `${q.question} — правильна відповідь: ${correct}` })
  }
  if (module.practice) corpus.push({ source: 'practice', label: 'Практика', text: module.practice })
  if (module.example) corpus.push({ source: 'example', label: 'Приклад виконання', text: module.example })
  return corpus
}

// Повертає { matched: bool, passages: [{source,label,text,score}], flaggedMistake }
export function answerFromLesson(module, question) {
  const queryTokens = tokenize(question)
  if (queryTokens.length === 0) {
    return { matched: false, passages: [], flaggedMistake: null }
  }

  const corpus = buildCorpus(module)
  const scored = corpus
    .map((entry) => ({ ...entry, score: overlapScore(queryTokens, entry.text) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)

  if (scored.length === 0) {
    return { matched: false, passages: [], flaggedMistake: null }
  }

  const topScore = scored[0].score
  const minScore = queryTokens.length <= 3 ? 1 : 2
  if (topScore < minScore) {
    return { matched: false, passages: [], flaggedMistake: null }
  }

  const flaggedMistake = scored[0].source === 'mistake' ? scored[0] : null
  const passages = []
  const seenText = new Set()
  for (const entry of scored) {
    if (passages.length >= 3) break
    if (seenText.has(entry.text)) continue
    if (flaggedMistake && entry.source === 'mistake' && entry.text !== flaggedMistake.text) continue
    passages.push(entry)
    seenText.add(entry.text)
  }

  return { matched: true, passages, flaggedMistake }
}
