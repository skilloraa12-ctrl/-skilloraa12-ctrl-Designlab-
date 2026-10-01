// Pure helpers for Ratio Lab: aspect-ratio math and a catalog of common
// screen/print/social presets. No DOM, no React.

function gcd(a, b) {
  a = Math.round(Math.abs(a))
  b = Math.round(Math.abs(b))
  while (b) {
    ;[a, b] = [b, a % b]
  }
  return a || 1
}

export function simplifyRatio(w, h) {
  const d = gcd(w, h)
  return { w: Math.round(w / d), h: Math.round(h / d) }
}

export function ratioDecimal(w, h) {
  return h === 0 ? 0 : w / h
}

export function heightFromWidth(width, ratioW, ratioH) {
  if (ratioW === 0) return 0
  return (width * ratioH) / ratioW
}

export function widthFromHeight(height, ratioW, ratioH) {
  if (ratioH === 0) return 0
  return (height * ratioW) / ratioH
}

// Scales a ratioW:ratioH rectangle to fit inside a maxW x maxH box,
// preserving the aspect ratio, for a visual preview.
export function fitRect(ratioW, ratioH, maxW, maxH) {
  if (ratioW <= 0 || ratioH <= 0) return { width: maxW, height: maxH }
  const scale = Math.min(maxW / ratioW, maxH / ratioH)
  return {
    width: Math.round(ratioW * scale),
    height: Math.round(ratioH * scale),
  }
}

// How much of a source image gets cropped away when it's placed into a
// target aspect ratio with object-fit: cover (fills the box completely,
// crops the overflow, centered) — the single most common real-world crop
// operation (thumbnails, avatars, hero banners from an arbitrary photo).
export function coverCrop(srcW, srcH, targetRatioW, targetRatioH) {
  if (srcW <= 0 || srcH <= 0 || targetRatioW <= 0 || targetRatioH <= 0) {
    return { cropW: 0, cropH: 0, offsetX: 0, offsetY: 0, axis: 'none', croppedPct: 0 }
  }
  const srcRatio = srcW / srcH
  const targetRatio = targetRatioW / targetRatioH
  let cropW, cropH, axis
  if (srcRatio > targetRatio) {
    // source is relatively wider than target -> crop off the sides
    cropH = srcH
    cropW = srcH * targetRatio
    axis = 'width'
  } else {
    // source is relatively taller than target -> crop off top/bottom
    cropW = srcW
    cropH = srcW / targetRatio
    axis = 'height'
  }
  const offsetX = (srcW - cropW) / 2
  const offsetY = (srcH - cropH) / 2
  const srcArea = srcW * srcH
  const cropArea = cropW * cropH
  const croppedPct = srcArea === 0 ? 0 : (1 - cropArea / srcArea) * 100
  return { cropW, cropH, offsetX, offsetY, axis, croppedPct }
}

export const PRESETS = [
  { key: 'square', icon: '⬛', label: '1:1 Квадрат', w: 1, h: 1, group: 'Екран' },
  { key: 'hd', icon: '🖥️', label: '16:9 Widescreen', w: 16, h: 9, group: 'Екран' },
  { key: 'classic', icon: '📺', label: '4:3 Класичний', w: 4, h: 3, group: 'Екран' },
  { key: 'ultrawide', icon: '🖥️', label: '21:9 Ultrawide', w: 21, h: 9, group: 'Екран' },
  { key: 'story', icon: '📱', label: '9:16 Stories/Reels', w: 9, h: 16, group: 'Соцмережі' },
  { key: 'ig-post', icon: '📷', label: '4:5 Instagram пост', w: 4, h: 5, group: 'Соцмережі' },
  { key: 'yt-thumb', icon: '▶️', label: '16:9 YouTube обкладинка', w: 16, h: 9, group: 'Соцмережі' },
  { key: 'twitter-header', icon: '🐦', label: '3:1 Twitter банер', w: 3, h: 1, group: 'Соцмережі' },
  { key: 'a4', icon: '📄', label: 'A4 (210×297мм)', w: 210, h: 297, group: 'Друк' },
  { key: 'a3', icon: '📄', label: 'A3 (297×420мм)', w: 297, h: 420, group: 'Друк' },
  { key: 'letter', icon: '📄', label: 'US Letter (8.5×11″)', w: 85, h: 110, group: 'Друк' },
  { key: 'business-card', icon: '💳', label: 'Візитка (85×55мм)', w: 85, h: 55, group: 'Друк' },
  { key: 'golden', icon: '✨', label: 'Золотий перетин 1.618:1', w: 1618, h: 1000, group: 'Класичні' },
  { key: 'silver', icon: '✨', label: 'Срібний перетин √2:1', w: 1414, h: 1000, group: 'Класичні' },
]
