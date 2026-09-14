import { useState, useMemo } from 'react'
import { useProgress } from '../context/ProgressContext.jsx'

const HARMONIES = {
  complementary: 'Компліментарна',
  analogous: 'Аналогова',
  triadic: 'Тріадна',
  tetradic: 'Тетрадна',
  split: 'Split-complementary',
  monochromatic: 'Монохромна',
}

function hslToHex(h, s, l) {
  s /= 100; l /= 100
  const k = (n) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  const toHex = (x) => Math.round(255 * x).toString(16).padStart(2, '0')
  return '#' + toHex(f(0)) + toHex(f(8)) + toHex(f(4))
}

function harmonyHues(base, type) {
  switch (type) {
    case 'complementary': return [base, (base + 180) % 360]
    case 'analogous': return [(base - 30 + 360) % 360, base, (base + 30) % 360]
    case 'triadic': return [base, (base + 120) % 360, (base + 240) % 360]
    case 'tetradic': return [base, (base + 90) % 360, (base + 180) % 360, (base + 270) % 360]
    case 'split': return [base, (base + 150) % 360, (base + 210) % 360]
    case 'monochromatic': return [base]
    default: return [base]
  }
}

function paletteFromHues(hues, type) {
  if (type === 'monochromatic') {
    return [20, 35, 50, 65, 80].map((l) => hslToHex(hues[0], 55, l))
  }
  return hues.map((h) => hslToHex(h, 62, 50))
}

export default function ColorLab() {
  const { palettes, savePalette, removePalette } = useProgress()
  const [hue, setHue] = useState(245)
  const [harmony, setHarmony] = useState('complementary')

  const hexes = useMemo(() => paletteFromHues(harmonyHues(hue, harmony), harmony), [hue, harmony])

  function copy(hex) {
    if (navigator.clipboard) navigator.clipboard.writeText(hex).catch(() => {})
  }

  return (
    <div>
      <div className="lab-controls">
        <div className="hue-slider">
          <input
            type="range" min="0" max="360" value={hue}
            onChange={(e) => setHue(Number(e.target.value))}
          />
        </div>
        <div className="harmony-select">
          {Object.entries(HARMONIES).map(([key, label]) => (
            <button
              key={key}
              className={'harmony-btn' + (harmony === key ? ' active' : '')}
              onClick={() => setHarmony(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="palette-row">
        {hexes.map((hex, i) => (
          <div key={i} className="swatch" style={{ background: hex }} onClick={() => copy(hex)}>
            <span className="copy-hint">Копіювати</span>
            <span className="hex">{hex}</span>
          </div>
        ))}
      </div>

      <button className="save-btn" onClick={() => savePalette(hexes)}>Зберегти палітру</button>

      {palettes.length > 0 && (
        <>
          <div className="section-head"><h3>Збережені палітри</h3></div>
          <div className="saved-palettes">
            {palettes.map((p, i) => (
              <div key={i} className="saved-item">
                {p.map((hex, j) => <span key={j} style={{ background: hex }} />)}
                <button className="saved-del" onClick={() => removePalette(i)}>✕</button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
