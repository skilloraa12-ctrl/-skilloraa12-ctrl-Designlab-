// Чисті (без React) функції для Logo Design Studio: геометрія фігур,
// переведення кольору в сіру шкалу/монохром, серіалізація SVG в
// завантажувані файли (SVG — справжній, PNG — растровий рендер із SVG).
//
// Чесна межа: це реальний векторний редактор форм/тексту з реальним
// SVG-експортом — не імітація Illustrator чи автоматичний генератор
// логотипів (жодного «AI згенерує тобі логотип» тут немає).

export const CANVAS_SIZE = 400

export function regularPolygonPoints(cx, cy, w, h, sides) {
  const rx = w / 2, ry = h / 2
  const pts = []
  const start = -Math.PI / 2
  for (let i = 0; i < sides; i++) {
    const a = start + (i / sides) * Math.PI * 2
    pts.push(`${cx + Math.cos(a) * rx},${cy + Math.sin(a) * ry}`)
  }
  return pts.join(' ')
}

export function trianglePoints(cx, cy, w, h) {
  const hw = w / 2, hh = h / 2
  return `${cx},${cy - hh} ${cx + hw},${cy + hh} ${cx - hw},${cy + hh}`
}

// Люмінансна формула (ITU-R BT.601) — та сама, що й для перевірки
// контрасту в Contrast Lab; дає чесний відтінок сірого з реального
// кольору елемента, а не довільне освітлення.
export function hexToGray(hex) {
  if (!hex || hex === 'none') return hex
  const m = /^#?([0-9a-f]{6})$/i.exec(hex)
  if (!m) return hex
  const n = parseInt(m[1], 16)
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
  const y = Math.round(0.299 * r + 0.587 * g + 0.114 * b)
  const h = y.toString(16).padStart(2, '0')
  return `#${h}${h}${h}`
}

export function elementBounds(el) {
  if (el.type === 'line') {
    return { left: el.x, top: el.y - (el.strokeWidth || 1), right: el.x + el.width, bottom: el.y + (el.strokeWidth || 1) }
  }
  return { left: el.x, top: el.y, right: el.x + el.width, bottom: el.y + el.height }
}

export function elementCenter(el) {
  const b = elementBounds(el)
  return { cx: (b.left + b.right) / 2, cy: (b.top + b.bottom) / 2 }
}

// Серіалізує DOM-вузол <svg> у завантажуваний .svg-файл — справжній
// масштабований вектор, той самий формат, який приймають принтери,
// Illustrator, дизайн-системи.
export function downloadSvg(svgEl, filename) {
  const clone = svgEl.cloneNode(true)
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  const xml = new XMLSerializer().serializeToString(clone)
  const blob = new Blob([xml], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// Рендерить той самий SVG у растровий PNG заданого розміру — чесно
// растеризує саме те, що намальовано, без вигаданого "AI upscale".
export function downloadPngFromSvg(svgEl, size, filename) {
  const clone = svgEl.cloneNode(true)
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('width', String(size))
  clone.setAttribute('height', String(size))
  const xml = new XMLSerializer().serializeToString(clone)
  const svgBlob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(svgBlob)
  const img = new Image()
  img.onload = () => {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, size, size)
    URL.revokeObjectURL(url)
    canvas.toBlob((blob) => {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = filename
      a.click()
      URL.revokeObjectURL(a.href)
    }, 'image/png')
  }
  img.src = url
}
