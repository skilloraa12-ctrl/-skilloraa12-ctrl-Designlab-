// Тонка обгортка над localStorage.
// Винесена окремо, щоб у майбутньому замінити на запити до бекенду
// без переписування компонентів (просто поміняти реалізацію тут).

const NS = 'designlab:v1:'

export function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(NS + key)
    if (raw === null) return fallback
    return JSON.parse(raw)
  } catch (e) {
    console.warn('Не вдалося прочитати збережені дані для', key, e)
    return fallback
  }
}

export function saveJSON(key, value) {
  try {
    localStorage.setItem(NS + key, JSON.stringify(value))
    return true
  } catch (e) {
    console.warn('Не вдалося зберегти дані для', key, e)
    return false
  }
}

export function removeKey(key) {
  localStorage.removeItem(NS + key)
}
