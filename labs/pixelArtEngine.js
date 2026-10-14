// Чисті (без React) функції піксельного редактора — спільні для
// самостійної сторінки /labs/pixel-art і для вбудованого редактора
// просто всередині Game Art Studio (розділ «2D-концепти»), щоб малювати
// можна було прямо в майстерні проєкту, а не лише на окремій сторінці.

export const SIZES = [16, 24, 32]
export const DEFAULT_PALETTE = ['#1A1A1E', '#5B5B66', '#B8B8C2', '#F5F5F7', '#E0373E', '#E6A028', '#2BB673', '#2E86DE', '#6B62FF', '#D94FAF']
export const CELL_PX = 18

export function emptyGrid(size) {
  return new Array(size * size).fill(null)
}

export function floodFill(pixels, size, startIdx, targetColor, fillColor) {
  if (targetColor === fillColor) return pixels
  const next = pixels.slice()
  const stack = [startIdx]
  const visited = new Set()
  while (stack.length) {
    const idx = stack.pop()
    if (visited.has(idx)) continue
    visited.add(idx)
    if (next[idx] !== targetColor) continue
    next[idx] = fillColor
    const x = idx % size
    const y = Math.floor(idx / size)
    if (x > 0) stack.push(idx - 1)
    if (x < size - 1) stack.push(idx + 1)
    if (y > 0) stack.push(idx - size)
    if (y < size - 1) stack.push(idx + size)
  }
  return next
}

export function drawPixelCanvas(canvas, size, pixels, showGrid) {
  canvas.width = size * CELL_PX
  canvas.height = size * CELL_PX
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = false
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const checker = (x + y) % 2 === 0 ? '#2A2A32' : '#232329'
      ctx.fillStyle = checker
      ctx.fillRect(x * CELL_PX, y * CELL_PX, CELL_PX, CELL_PX)
    }
  }
  for (let i = 0; i < pixels.length; i++) {
    const color = pixels[i]
    if (!color) continue
    const x = i % size
    const y = Math.floor(i / size)
    ctx.fillStyle = color
    ctx.fillRect(x * CELL_PX, y * CELL_PX, CELL_PX, CELL_PX)
  }
  if (showGrid) {
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'
    ctx.lineWidth = 1
    for (let i = 0; i <= size; i++) {
      ctx.beginPath()
      ctx.moveTo(i * CELL_PX, 0)
      ctx.lineTo(i * CELL_PX, size * CELL_PX)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, i * CELL_PX)
      ctx.lineTo(size * CELL_PX, i * CELL_PX)
      ctx.stroke()
    }
  }
}

export function pixelsToPngDataUrl(size, pixels, scale) {
  const off = document.createElement('canvas')
  off.width = size * scale
  off.height = size * scale
  const ctx = off.getContext('2d')
  ctx.imageSmoothingEnabled = false
  for (let i = 0; i < pixels.length; i++) {
    const color = pixels[i]
    if (!color) continue
    const x = i % size
    const y = Math.floor(i / size)
    ctx.fillStyle = color
    ctx.fillRect(x * scale, y * scale, scale, scale)
  }
  return off.toDataURL('image/png')
}

export function downloadDataUrl(dataUrl, filename) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  a.click()
}

export function idxFromCanvasEvent(canvas, size, e) {
  const rect = canvas.getBoundingClientRect()
  const cx = ((e.clientX - rect.left) / rect.width) * size
  const cy = ((e.clientY - rect.top) / rect.height) * size
  const x = Math.floor(cx)
  const y = Math.floor(cy)
  if (x < 0 || y < 0 || x >= size || y >= size) return null
  return y * size + x
}
