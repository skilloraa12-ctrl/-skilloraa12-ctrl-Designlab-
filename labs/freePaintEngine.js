// Чисті (без React) функції довільного цифрового малювання — на відміну
// від pixelArtEngine.js (жорстка сітка пікселів для Pixel Art), тут
// пензель малює плавний безперервний мазок на canvas потрібної
// роздільної здатності — реальний digital painting, а не блоки.

export const BRUSH_SIZES = [4, 10, 20, 36]

export const DEFAULT_PALETTE = [
  '#000000', '#3a3a3a', '#7a7a7a', '#b8b8b8', '#ffffff',
  '#7a3b2e', '#c1502e', '#e8a33d', '#f3d54e', '#8bbf4f',
  '#3f9142', '#2e8b8b', '#3a6fb0', '#5b4ba3', '#9b4fb0',
  '#d6477e', '#e87ca0', '#f0c8a0', '#8a5a3c', '#2b2b2b',
]

// Внутрішня роздільна здатність (CANVAS_W×CANVAS_H у логічних одиницях)
// лишається фіксованою для якості малюнка, а CSS-розмір на екрані — ні:
// немає inline canvas.style.width/height, тож `.fpc-canvas { width:100% }`
// вільно масштабує полотно під контейнер (вузьку колонку студії чи весь
// екран у повноекранному режимі), зберігаючи співвідношення сторін із
// власних атрибутів width/height. pointFromEvent нижче перераховує клік у
// логічні координати з урахуванням цього масштабування.
export function setupCanvas(canvas, width, height) {
  const ratio = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = width * ratio
  canvas.height = height * ratio
  const ctx = canvas.getContext('2d')
  ctx.scale(ratio, ratio)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  return ctx
}

export function clearToWhite(ctx, width, height) {
  ctx.save()
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  ctx.restore()
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
}

export function loadImageToCanvas(ctx, width, height, dataUrl, cb) {
  clearToWhite(ctx, width, height)
  if (!dataUrl) { cb?.(); return }
  const img = new Image()
  img.onload = () => {
    ctx.drawImage(img, 0, 0, width, height)
    cb?.()
  }
  img.onerror = () => cb?.()
  img.src = dataUrl
}

// Один сегмент мазка: пензель-штамп (коло) уздовж лінії від (x0,y0) до
// (x1,y1), з м'яким (радіальний градієнт) чи твердим краєм.
export function strokeSegment(ctx, x0, y0, x1, y1, { size, color, opacity, soft, erase }) {
  ctx.save()
  ctx.globalCompositeOperation = erase ? 'destination-out' : 'source-over'
  ctx.globalAlpha = opacity
  ctx.strokeStyle = color
  ctx.lineWidth = size
  if (soft) {
    const grad = ctx.createLinearGradient(x0, y0, x1, y1)
    ctx.shadowColor = erase ? '#000000' : color
    ctx.shadowBlur = size * 0.4
  }
  ctx.beginPath()
  ctx.moveTo(x0, y0)
  ctx.lineTo(x1, y1)
  ctx.stroke()
  ctx.restore()
}

export function dot(ctx, x, y, { size, color, opacity, soft, erase }) {
  strokeSegment(ctx, x, y, x + 0.01, y + 0.01, { size, color, opacity, soft, erase })
}

export function canvasToDataUrl(canvas) {
  return canvas.toDataURL('image/png')
}

// Переводить клієнтські координати курсора в логічні координати полотна
// (0..logicalWidth / 0..logicalHeight), незалежно від того, яким реально
// є CSS-розмір canvas на екрані зараз (вузька колонка студії чи весь
// екран — рендерений розмір може бути геть іншим за внутрішню роздільну
// здатність).
export function pointFromEvent(canvas, e, logicalWidth, logicalHeight) {
  const rect = canvas.getBoundingClientRect()
  const scaleX = logicalWidth / rect.width
  const scaleY = logicalHeight / rect.height
  return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }
}
