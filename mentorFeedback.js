// Локальна "пам'ять" помічника уроку: 👍/👎 під конкретними фрагментами
// зберігаються в localStorage цього браузера (не на сервері — сайт
// статичний, спільної бази для чату немає). Завдяки цьому з часом при
// повторних схожих питаннях підказки, які реально допомогли, спливають
// вище — чесна, хоч і локальна, форма "навчання з досвіду" без LLM.
import { loadJSON, saveJSON } from './storage.js'

function key(moduleId) {
  return `mentor-feedback:${moduleId}`
}

export function loadFeedback(moduleId) {
  return loadJSON(key(moduleId), {})
}

export function rate(moduleId, passageText, delta) {
  const map = loadFeedback(moduleId)
  const next = Math.max(-5, Math.min(5, (map[passageText] || 0) + delta))
  map[passageText] = next
  saveJSON(key(moduleId), map)
  return map
}
