import { useState, useMemo, useRef } from 'react'
import { useProgress } from './ProgressContext.jsx'
import * as C from './colorMath.js'

const TABS = [
  { key: 'picker', icon: '🎨', label: 'Color Picker' },
  { key: 'harmonies', icon: '🌈', label: 'Harmonies' },
  { key: 'palette', icon: '🎯', label: 'Palette' },
  { key: 'shades', icon: '🌗', label: 'Shades' },
  { key: 'contrast', icon: '♿', label: 'Contrast' },
  { key: 'gradient', icon: '🎨', label: 'Gradient' },
  { key: 'typography', icon: '🔤', label: 'Typography' },
  { key: 'preview', icon: '🖼', label: 'Design Preview' },
  { key: 'imageExtract', icon: '🖼', label: 'Image Extract' },
  { key: 'inspector', icon: '🔍', label: 'Inspector' },
  { key: 'lightDark', icon: '🌗', label: 'Light / Dark' },
  { key: 'experiment', icon: '🧪', label: 'Experiment' },
  { key: 'saved', icon: '💾', label: 'Saved' },
  { key: 'export', icon: '📤', label: 'Export' },
]

function copy(text) {
  if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {})
}

function safeHex(hex, fallback = '#808080') {
  return C.isValidHex(hex) ? (hex.startsWith('#') ? hex : '#' + hex) : fallback
}

// ---------- Small shared pieces ----------

function CopyField({ label, value }) {
  return (
    <button className="cl-copyfield" onClick={() => copy(value)} title="Копіювати">
      <span className="cl-copyfield-label">{label}</span>
      <span className="cl-copyfield-value">{value}</span>
    </button>
  )
}

function ColorFormatsTable({ hex }) {
  const { r, g, b } = C.hexToRgb(hex)
  const hsl = C.rgbToHsl(r, g, b)
  const hsv = C.rgbToHsv(r, g, b)
  const cmyk = C.rgbToCmyk(r, g, b)
  const lab = C.rgbToLab(r, g, b)
  const lch = C.rgbToLch(r, g, b)
  const name = C.nearestColorName(hex)
  const light = C.isLight(hex)
  const warm = C.isWarm(hex)

  return (
    <div>
      <div className="cl-tags">
        <span className="cl-tag">{name}</span>
        <span className="cl-tag">{light ? 'Light' : 'Dark'}</span>
        <span className="cl-tag">{warm ? 'Warm' : 'Cool'}</span>
      </div>
      <div className="cl-formats-grid">
        <CopyField label="HEX" value={hex.toUpperCase()} />
        <CopyField label="RGB" value={`rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`} />
        <CopyField label="RGBA" value={`rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, 1)`} />
        <CopyField label="HSL" value={`hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)`} />
        <CopyField label="HSLA" value={`hsla(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%, 1)`} />
        <CopyField label="HSV / HSB" value={`hsv(${Math.round(hsv.h)}, ${Math.round(hsv.s)}%, ${Math.round(hsv.v)}%)`} />
        <CopyField label="CMYK" value={`cmyk(${Math.round(cmyk.c)}%, ${Math.round(cmyk.m)}%, ${Math.round(cmyk.y)}%, ${Math.round(cmyk.k)}%)`} />
        <CopyField label="LAB" value={`lab(${lab.l.toFixed(1)}, ${lab.a.toFixed(1)}, ${lab.b.toFixed(1)})`} />
        <CopyField label="LCH" value={`lch(${lch.l.toFixed(1)}, ${lch.c.toFixed(1)}, ${lch.h.toFixed(1)})`} />
      </div>
    </div>
  )
}

// ---------- 1. Color Picker ----------

function PickerTab({ hex, setHex }) {
  const [text, setText] = useState(hex)
  const { saveColor } = useProgress()
  const { r, g, b } = C.hexToRgb(hex)
  const hsl = C.rgbToHsl(r, g, b)

  function commitText(v) {
    setText(v)
    if (C.isValidHex(v)) setHex(safeHex(v))
  }

  function setRgb(nr, ng, nb) {
    const h = C.rgbToHex(nr, ng, nb)
    setHex(h); setText(h)
  }
  function setHsl(nh, ns, nl) {
    const h = C.hslToHex(nh, ns, nl)
    setHex(h); setText(h)
  }

  function randomColor() {
    const h = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
    setHex(h); setText(h)
  }

  return (
    <div>
      <p className="cl-tab-desc">Базовий колір для всього Color Lab — гармонії, палітра, відтінки й превʼю нижче будуються саме з нього.</p>
      <div className="cl-picker-top">
        <input type="color" className="cl-swatch-input" value={safeHex(hex)} onChange={(e) => { setHex(e.target.value); setText(e.target.value) }} />
        <input
          className="cl-hex-input"
          value={text}
          onChange={(e) => commitText(e.target.value)}
          spellCheck={false}
        />
        <button className="harmony-btn" onClick={randomColor}>🎲 Random</button>
        <button className="harmony-btn" onClick={() => copy(hex.toUpperCase())}>Copy HEX</button>
        <button className="harmony-btn" onClick={() => copy(`rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`)}>Copy RGB</button>
        <button className="pf-add-btn" onClick={() => saveColor(hex)}>💾 Save</button>
      </div>

      <div className="cl-editrow">
        <label>R <input type="number" min="0" max="255" value={Math.round(r)} onChange={(e) => setRgb(Number(e.target.value), g, b)} /></label>
        <label>G <input type="number" min="0" max="255" value={Math.round(g)} onChange={(e) => setRgb(r, Number(e.target.value), b)} /></label>
        <label>B <input type="number" min="0" max="255" value={Math.round(b)} onChange={(e) => setRgb(r, g, Number(e.target.value))} /></label>
      </div>
      <div className="cl-editrow">
        <label>H <input type="number" min="0" max="360" value={Math.round(hsl.h)} onChange={(e) => setHsl(Number(e.target.value), hsl.s, hsl.l)} /></label>
        <label>S <input type="number" min="0" max="100" value={Math.round(hsl.s)} onChange={(e) => setHsl(hsl.h, Number(e.target.value), hsl.l)} /></label>
        <label>L <input type="number" min="0" max="100" value={Math.round(hsl.l)} onChange={(e) => setHsl(hsl.h, hsl.s, Number(e.target.value))} /></label>
      </div>

      <div className="cl-section-title">Усі формати</div>
      <ColorFormatsTable hex={hex} />
    </div>
  )
}

// ---------- 2. Harmonies ----------

const HARMONY_USES = {
  complementary: ['База', 'Акцент / CTA'],
  analogous: ['Ліворуч', 'База', 'Праворуч'],
  triadic: ['База', 'Друга роль', 'Третя роль'],
  tetradic: ['База', 'Акцент', 'Доповняльний', 'Другий акцент'],
  square: ['База', 'Роль 2', 'Роль 3', 'Роль 4'],
  split: ['База', 'Акцент 1', 'Акцент 2'],
  doubleComplementary: ['База', 'Сусід', 'Доповняльний', 'Сусід доповняльного'],
  monochromatic: ['Найтемніший', 'Темний', 'Базовий', 'Світлий', 'Найсвітліший'],
}

function HarmoniesTab({ hex, setHex }) {
  const [type, setType] = useState('complementary')
  const { saveColor, savePalette } = useProgress()
  const { r, g, b } = C.hexToRgb(hex)
  const { h: baseHue } = C.rgbToHsl(r, g, b)
  const hues = useMemo(() => C.harmonyHues(baseHue, type), [baseHue, type])
  const hexes = useMemo(() => C.paletteFromHues(hues, type), [hues, type])
  const uses = HARMONY_USES[type] || []
  const info = C.HARMONY_TYPES[type]

  return (
    <div>
      <p className="cl-tab-desc">Гармонії будуються з відтінку (hue) поточного базового кольору з вкладки Color Picker.</p>
      <div className="harmony-select">
        {Object.entries(C.HARMONY_TYPES).map(([key, val]) => (
          <button key={key} className={'harmony-btn' + (type === key ? ' active' : '')} onClick={() => setType(key)}>
            {val.label}
          </button>
        ))}
      </div>
      {info && <p className="cl-harmony-info">{info.desc}</p>}

      <div className="palette-row">
        {hexes.map((hx, i) => (
          <div key={i} className="swatch" style={{ background: hx }} onClick={() => copy(hx)}>
            <span className="copy-hint">Копіювати</span>
            <span className="hex">{hx}</span>
          </div>
        ))}
      </div>
      <div className="cl-harmony-uses">
        {hexes.map((hx, i) => (
          <div key={i} className="cl-harmony-use-row">
            <span className="cl-swatch-dot" style={{ background: hx }} /> {hx} — {uses[i] || `Роль ${i + 1}`}
            <button className="cl-mini-btn" onClick={() => setHex(hx)}>Base ⟶</button>
            <button className="cl-mini-btn" onClick={() => saveColor(hx)}>💾</button>
          </div>
        ))}
      </div>
      <button className="save-btn" onClick={() => savePalette(hexes)}>Зберегти цю гармонію як палітру</button>
    </div>
  )
}

// ---------- 3. Palette Generator ----------

function PaletteTab({ palette, onChange, onReset }) {
  const { savePalette } = useProgress()
  return (
    <div>
      <p className="cl-tab-desc">Семантична палітра, автоматично згенерована з базового кольору. Кожну роль можна перевизначити вручну.</p>
      <div className="cl-palette-grid">
        {Object.entries(C.SEMANTIC_LABELS).map(([role, label]) => (
          <div className="cl-role-card" key={role}>
            <div className="cl-role-swatch" style={{ background: palette[role] }} />
            <div className="cl-role-name">{label}</div>
            <input
              className="cl-role-hex"
              value={palette[role]}
              onChange={(e) => C.isValidHex(e.target.value) && onChange(role, safeHex(e.target.value))}
            />
            <input type="color" value={safeHex(palette[role])} onChange={(e) => onChange(role, e.target.value)} />
          </div>
        ))}
      </div>
      <div className="cl-picker-top" style={{ marginTop: 14 }}>
        <button className="harmony-btn" onClick={onReset}>Скинути до авто</button>
        <button className="pf-add-btn" onClick={() => savePalette(Object.values(palette))}>Зберегти палітру</button>
      </div>
    </div>
  )
}

// ---------- 4. Shades / Tints / Tones ----------

function ShadesTab({ hex }) {
  const { saveColor } = useProgress()
  const scale = useMemo(() => C.shadeScale(hex), [hex])
  const extras = [
    ['Lighter', C.lighter(hex)],
    ['Darker', C.darker(hex)],
    ['Muted', C.muted(hex)],
  ]
  return (
    <div>
      <p className="cl-tab-desc">Шкала 50–950 від базового кольору — як у Tailwind/Material: для фонів, бордерів, hover-станів.</p>
      <div className="cl-shade-row">
        {C.SHADE_STEPS.map((step) => (
          <div key={step} className="cl-shade-cell" style={{ background: scale[step] }} onClick={() => copy(scale[step])}>
            <span className="cl-shade-step">{step}</span>
            <span className="cl-shade-hex">{scale[step]}</span>
          </div>
        ))}
      </div>
      <div className="cl-section-title">Lighter / Darker / Muted</div>
      <div className="palette-row">
        {extras.map(([label, hx]) => (
          <div key={label} className="swatch" style={{ background: hx }} onClick={() => saveColor(hx)}>
            <span className="copy-hint">💾 Зберегти</span>
            <span className="hex">{label}: {hx}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------- 5. Contrast Checker ----------

function ContrastRow({ label, fg, bg }) {
  const ratio = C.contrastRatio(fg, bg)
  const normal = C.wcagLevel(ratio, false)
  const large = C.wcagLevel(ratio, true)
  return (
    <div className="cl-contrast-row">
      <div className="cl-contrast-preview" style={{ background: bg, color: fg }}>{label}</div>
      <div className="cl-contrast-meta">
        <div className="cl-contrast-ratio">{ratio.toFixed(2)}:1</div>
        <div className="cl-contrast-badges">
          <span className={normal.aa ? 'cl-badge pass' : 'cl-badge fail'}>AA {normal.aa ? '✓' : '✕'}</span>
          <span className={normal.aaa ? 'cl-badge pass' : 'cl-badge fail'}>AAA {normal.aaa ? '✓' : '✕'}</span>
          <span className={large.aa ? 'cl-badge pass' : 'cl-badge fail'}>AA Large {large.aa ? '✓' : '✕'}</span>
        </div>
      </div>
    </div>
  )
}

function ContrastTab({ palette }) {
  const [fg, setFg] = useState(palette.text)
  const [bg, setBg] = useState(palette.background)

  return (
    <div>
      <p className="cl-tab-desc">Перевірка контрастності за WCAG 2.1 — для тексту, кнопок і UI-елементів.</p>
      <div className="cl-editrow">
        <label>Текст <input type="color" value={safeHex(fg)} onChange={(e) => setFg(e.target.value)} /></label>
        <label>Фон <input type="color" value={safeHex(bg)} onChange={(e) => setBg(e.target.value)} /></label>
      </div>
      <ContrastRow label="Aa Текст на фоні" fg={fg} bg={bg} />

      <div className="cl-section-title">UI-елементи (мінімум 3:1)</div>
      <ContrastRow label="Border на Background" fg={palette.border} bg={palette.background} />

      <div className="cl-section-title">Кнопки — текст на кольорових ролях</div>
      {['primary', 'secondary', 'accent', 'success', 'warning', 'error', 'info'].map((role) => {
        const onWhite = C.contrastRatio('#FFFFFF', palette[role])
        const onBlack = C.contrastRatio('#000000', palette[role])
        const best = onWhite >= onBlack ? '#FFFFFF' : '#000000'
        return <ContrastRow key={role} label={`${C.SEMANTIC_LABELS[role]} — ${best === '#FFFFFF' ? 'білий' : 'чорний'} текст`} fg={best} bg={palette[role]} />
      })}
    </div>
  )
}

// ---------- 6. Gradient Lab ----------

function GradientTab({ baseHex }) {
  const { saveGradient } = useProgress()
  const [type, setType] = useState('linear')
  const [angle, setAngle] = useState(90)
  const [stops, setStops] = useState([
    { color: baseHex, pos: 0, opacity: 100 },
    { color: C.hslToHex((C.rgbToHsl(...Object.values(C.hexToRgb(baseHex))).h + 150) % 360, 62, 50), pos: 100, opacity: 100 },
  ])

  const css = C.gradientCss(type, angle, stops)
  const svg = C.gradientSvg(type, angle, stops)

  function updateStop(i, patch) {
    setStops((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)))
  }
  function addStop() {
    setStops((prev) => [...prev, { color: '#FFFFFF', pos: 50, opacity: 100 }])
  }
  function removeStop(i) {
    setStops((prev) => (prev.length > 2 ? prev.filter((_, idx) => idx !== i) : prev))
  }

  return (
    <div>
      <p className="cl-tab-desc">Лінійні, радіальні й конічні градієнти з кількома кольоровими точками — з готовим CSS та SVG.</p>
      <div className="harmony-select">
        {['linear', 'radial', 'conic'].map((t) => (
          <button key={t} className={'harmony-btn' + (type === t ? ' active' : '')} onClick={() => setType(t)}>{t}</button>
        ))}
      </div>
      {type !== 'radial' && (
        <div className="cl-editrow">
          <label>Кут {angle}° <input type="range" min="0" max="360" value={angle} onChange={(e) => setAngle(Number(e.target.value))} /></label>
        </div>
      )}

      <div className="cl-gradient-preview" style={{ background: css }} />

      <div className="cl-section-title">Кольорові точки</div>
      {stops.map((s, i) => (
        <div key={i} className="cl-gradient-stop">
          <input type="color" value={safeHex(s.color)} onChange={(e) => updateStop(i, { color: e.target.value })} />
          <label>Позиція {s.pos}% <input type="range" min="0" max="100" value={s.pos} onChange={(e) => updateStop(i, { pos: Number(e.target.value) })} /></label>
          <label>Прозорість {s.opacity}% <input type="range" min="0" max="100" value={s.opacity} onChange={(e) => updateStop(i, { opacity: Number(e.target.value) })} /></label>
          {stops.length > 2 && <button className="cl-mini-btn" onClick={() => removeStop(i)}>✕</button>}
        </div>
      ))}
      <button className="harmony-btn" onClick={addStop}>+ Додати точку</button>

      <div className="cl-section-title">Експорт</div>
      <CopyField label="CSS" value={`background: ${css};`} />
      <button className="harmony-btn" style={{ marginTop: 8 }} onClick={() => copy(svg)}>Копіювати SVG</button>
      <button className="pf-add-btn" style={{ marginTop: 8, marginLeft: 8 }} onClick={() => saveGradient({ type, angle, stops, css })}>💾 Зберегти градієнт</button>
    </div>
  )
}

// ---------- 7. Typography ----------

function TypographyTab({ palette }) {
  const items = [
    { tag: 'Heading', color: palette.text, size: 28, weight: 700 },
    { tag: 'Subheading', color: palette.muted, size: 18, weight: 600 },
    { tag: 'Body text', color: palette.text, size: 14, weight: 400 },
    { tag: 'Caption', color: palette.muted, size: 12, weight: 400 },
    { tag: 'Button', color: '#fff', size: 14, weight: 600, bg: palette.primary },
    { tag: 'Link', color: palette.accent, size: 14, weight: 500 },
    { tag: 'Quote', color: palette.muted, size: 15, weight: 400, italic: true },
  ]
  return (
    <div>
      <p className="cl-tab-desc">Типографічна ієрархія на кольорах поточної палітри, з перевіркою контрасту біля кожного стилю.</p>
      {items.map((it) => {
        const bg = it.bg || palette.background
        const ratio = C.contrastRatio(it.color, bg)
        return (
          <div key={it.tag} className="cl-typo-row" style={{ background: bg }}>
            <span style={{ color: it.color, fontSize: it.size, fontWeight: it.weight, fontStyle: it.italic ? 'italic' : 'normal' }}>
              {it.tag} — Design Lab UA
            </span>
            <span className={'cl-badge ' + (ratio >= 4.5 ? 'pass' : 'fail')}>{ratio.toFixed(1)}:1</span>
          </div>
        )
      })}
    </div>
  )
}

// ---------- 8. Design Preview ----------

const PREVIEW_TYPES = [
  { key: 'website', emoji: '🌐', label: 'Website' },
  { key: 'app', emoji: '📱', label: 'App' },
  { key: 'gameui', emoji: '🎮', label: 'Game UI' },
  { key: 'logo', emoji: '🏷', label: 'Logo' },
  { key: 'branding', emoji: '🏢', label: 'Branding' },
  { key: 'advertising', emoji: '📢', label: 'Advertising' },
  { key: 'social', emoji: '📱', label: 'Social Media' },
  { key: 'print', emoji: '🖨', label: 'Print' },
  { key: 'packaging', emoji: '📦', label: 'Packaging' },
  { key: 'motion', emoji: '🎬', label: 'Motion' },
  { key: '3d', emoji: '🧊', label: '3D' },
  { key: 'graphic', emoji: '🎨', label: 'Graphic Design' },
]

function PreviewWebsite({ p }) {
  return (
    <div className="cl-mock" style={{ background: p.background, color: p.text }}>
      <div className="cl-mock-navbar" style={{ background: p.surface, borderColor: p.border }}>
        <b style={{ color: p.primary }}>Brand</b>
        <span>Головна</span><span>Про нас</span><span>Контакти</span>
        <button style={{ background: p.primary, color: '#fff' }}>Почати</button>
      </div>
      <div className="cl-mock-hero">
        <h3>Заголовок сторінки</h3>
        <p style={{ color: p.muted }}>Короткий підзаголовок, що пояснює цінність продукту.</p>
        <button style={{ background: p.accent, color: '#fff' }}>Дізнатись більше</button>
      </div>
      <div className="cl-mock-cards">
        {[1, 2, 3].map((i) => (
          <div key={i} className="cl-mock-card" style={{ background: p.surface, borderColor: p.border }}>
            <div className="cl-mock-card-icon" style={{ background: p.accent }} />
            <div>Картка {i}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PreviewApp({ p }) {
  return (
    <div className="cl-mock-phone" style={{ background: p.background, color: p.text, borderColor: p.border }}>
      <div className="cl-mock-phone-header" style={{ background: p.primary, color: '#fff' }}>Головна</div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="cl-mock-list-item" style={{ borderColor: p.border }}>
          <div className="cl-mock-avatar" style={{ background: p.accent }} />
          <div>
            <div>Елемент {i}</div>
            <div style={{ color: p.muted, fontSize: 11 }}>Опис елемента</div>
          </div>
        </div>
      ))}
      <div className="cl-mock-phone-nav" style={{ background: p.surface, borderColor: p.border }}>
        {['🏠', '🔍', '❤️', '👤'].map((ic, i) => <span key={i} style={{ color: i === 0 ? p.primary : p.muted }}>{ic}</span>)}
      </div>
    </div>
  )
}

function PreviewGameUI({ p }) {
  return (
    <div className="cl-mock" style={{ background: '#111', color: '#fff' }}>
      <div className="cl-mock-hud">
        <div className="cl-mock-bar-wrap"><div className="cl-mock-bar" style={{ width: '70%', background: p.error }} /></div>
        <div className="cl-mock-bar-wrap"><div className="cl-mock-bar" style={{ width: '45%', background: p.info }} /></div>
        <div style={{ marginLeft: 'auto', color: p.warning }}>⭐ 1240</div>
      </div>
      <div className="cl-mock-inventory">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="cl-mock-slot" style={{ borderColor: p.border, background: i % 3 === 0 ? p.accent : 'transparent' }} />
        ))}
      </div>
      <button style={{ background: p.primary, color: '#fff' }}>Play</button>
    </div>
  )
}

function PreviewLogo({ p }) {
  return (
    <div className="cl-mock cl-mock-center" style={{ background: p.background }}>
      <div className="cl-mock-logo" style={{ background: `conic-gradient(${p.primary}, ${p.accent}, ${p.secondary}, ${p.primary})` }} />
      <div style={{ color: p.text, fontSize: 20, fontWeight: 700, marginTop: 10 }}>BRAND</div>
      <div style={{ color: p.muted, fontSize: 11 }}>tagline goes here</div>
    </div>
  )
}

function PreviewBranding({ p }) {
  return (
    <div className="cl-mock" style={{ background: p.surface }}>
      <div className="cl-mock-card cl-mock-bizcard" style={{ background: p.background, borderColor: p.border }}>
        <div className="cl-mock-logo-sm" style={{ background: p.primary }} />
        <div style={{ color: p.text, fontWeight: 700 }}>Оксана Дизайнер</div>
        <div style={{ color: p.muted, fontSize: 11 }}>Art Director</div>
        <div style={{ color: p.accent, fontSize: 11 }}>hello@brand.com</div>
      </div>
      <div className="cl-mock-letterhead" style={{ borderColor: p.primary, color: p.text }}>
        <div style={{ color: p.primary, fontWeight: 700 }}>BRAND</div>
        <div style={{ color: p.muted, fontSize: 10 }}>Офіційний лист — фірмовий бланк</div>
      </div>
    </div>
  )
}

function PreviewAdvertising({ p }) {
  return (
    <div className="cl-mock-banner" style={{ background: `linear-gradient(120deg, ${p.primary}, ${p.accent})` }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>Знижка -30%</div>
      <div style={{ color: '#fff', opacity: 0.9, fontSize: 12 }}>Лише до кінця тижня</div>
      <button style={{ background: '#fff', color: p.primary }}>Купити зараз</button>
    </div>
  )
}

function PreviewSocial({ p }) {
  return (
    <div className="cl-mock cl-mock-center" style={{ background: p.surface }}>
      <div className="cl-mock-post" style={{ background: p.background, borderColor: p.border }}>
        <div className="cl-mock-post-head">
          <div className="cl-mock-avatar" style={{ background: p.accent }} />
          <div style={{ color: p.text, fontWeight: 600, fontSize: 12 }}>brand_ua</div>
        </div>
        <div className="cl-mock-post-image" style={{ background: `linear-gradient(135deg, ${p.primary}, ${p.secondary})` }} />
        <div style={{ color: p.text, fontSize: 12 }}>❤️ 214 &nbsp; 💬 12</div>
      </div>
    </div>
  )
}

function PreviewPrint({ p }) {
  return (
    <div className="cl-mock cl-mock-center" style={{ background: p.surface }}>
      <div className="cl-mock-flyer" style={{ background: p.background, borderColor: p.border }}>
        <div style={{ background: p.primary, color: '#fff', padding: '10px 14px', fontWeight: 700 }}>ЛІТНІЙ ФЕСТИВАЛЬ</div>
        <div style={{ padding: 14, color: p.text, fontSize: 12 }}>15–17 липня · Центральний парк</div>
        <div style={{ padding: '0 14px 14px', color: p.accent, fontWeight: 700 }}>Квитки від 150₴</div>
      </div>
    </div>
  )
}

function PreviewPackaging({ p }) {
  return (
    <div className="cl-mock cl-mock-center" style={{ background: p.surface }}>
      <div className="cl-mock-box" style={{ background: p.primary }}>
        <div className="cl-mock-box-stripe" style={{ background: p.accent }} />
        <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>BRAND</div>
        <div style={{ color: '#fff', opacity: 0.85, fontSize: 10 }}>натуральний продукт</div>
      </div>
    </div>
  )
}

function PreviewMotion({ p }) {
  return (
    <div className="cl-mock cl-mock-motion" style={{ background: p.background }}>
      {[0, 1, 2].map((i) => (
        <div key={i} className="cl-mock-frame" style={{ background: p.surface, borderColor: p.border, animationDelay: `${i * 0.3}s` }}>
          <div className="cl-mock-frame-dot" style={{ background: i === 0 ? p.primary : i === 1 ? p.accent : p.secondary }} />
        </div>
      ))}
      <p style={{ color: p.muted, fontSize: 11 }}>Розкадровка кольорових акцентів між кадрами</p>
    </div>
  )
}

function Preview3D({ p }) {
  return (
    <div className="cl-mock cl-mock-center" style={{ background: '#0d0d0f' }}>
      <div
        className="cl-mock-cube"
        style={{
          background: `linear-gradient(135deg, ${p.accent}, ${p.primary})`,
          boxShadow: `20px 20px 0 -4px ${p.secondary}, inset -8px -8px 20px rgba(0,0,0,.4)`,
        }}
      />
      <p style={{ color: '#999', fontSize: 11, marginTop: 20 }}>CSS-імітація об'єму (без 3D-рушія)</p>
    </div>
  )
}

function PreviewGraphic({ p }) {
  return (
    <div className="cl-mock cl-mock-poster" style={{ background: p.primary }}>
      <div style={{ color: '#fff', fontSize: 34, fontWeight: 700, lineHeight: 1 }}>DESIGN<br />MATTERS</div>
      <div className="cl-mock-poster-shape" style={{ background: p.accent }} />
    </div>
  )
}

const PREVIEW_COMPONENTS = {
  website: PreviewWebsite, app: PreviewApp, gameui: PreviewGameUI, logo: PreviewLogo,
  branding: PreviewBranding, advertising: PreviewAdvertising, social: PreviewSocial,
  print: PreviewPrint, packaging: PreviewPackaging, motion: PreviewMotion, '3d': Preview3D,
  graphic: PreviewGraphic,
}

function DesignPreviewTab({ palette }) {
  const [type, setType] = useState('website')
  const Comp = PREVIEW_COMPONENTS[type]
  return (
    <div>
      <p className="cl-tab-desc">Як поточна палітра виглядає у справжньому макеті — обери напрямок.</p>
      <div className="harmony-select">
        {PREVIEW_TYPES.map((t) => (
          <button key={t.key} className={'harmony-btn' + (type === t.key ? ' active' : '')} onClick={() => setType(t.key)}>
            {t.emoji} {t.label}
          </button>
        ))}
      </div>
      <div className="cl-preview-frame">
        <Comp p={palette} />
      </div>
    </div>
  )
}

// ---------- 9. Image Extractor ----------

function ImageExtractTab({ onPick }) {
  const [colors, setColors] = useState([])
  const [imgSrc, setImgSrc] = useState(null)
  const [error, setError] = useState('')
  const { saveColor, savePalette } = useProgress()
  const canvasRef = useRef(null)

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setError('')
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const canvas = canvasRef.current
        const size = 120
        canvas.width = size; canvas.height = size
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, size, size)
        try {
          const data = ctx.getImageData(0, 0, size, size)
          setColors(C.extractDominantColors(data, 6))
          setImgSrc(reader.result)
        } catch (err) {
          setError('Не вдалося прочитати зображення: ' + err.message)
        }
      }
      img.onerror = () => setError('Не вдалося завантажити зображення')
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  }

  return (
    <div>
      <p className="cl-tab-desc">Завантаж зображення — Color Lab знайде домінантні кольори й побудує з них палітру.</p>
      <input type="file" accept="image/*" onChange={handleFile} />
      {error && <p className="pf-upload-error">{error}</p>}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      {imgSrc && <img src={imgSrc} alt="" className="cl-image-preview" />}
      {colors.length > 0 && (
        <>
          <div className="palette-row" style={{ marginTop: 14 }}>
            {colors.map((hx, i) => (
              <div key={i} className="swatch" style={{ background: hx }} onClick={() => onPick(hx)}>
                <span className="copy-hint">Set as base</span>
                <span className="hex">{hx}</span>
              </div>
            ))}
          </div>
          <div className="cl-picker-top" style={{ marginTop: 10 }}>
            <button className="harmony-btn" onClick={() => colors.forEach(saveColor)}>💾 Зберегти всі кольори</button>
            <button className="pf-add-btn" onClick={() => savePalette(colors)}>Зберегти як палітру</button>
          </div>
        </>
      )}
    </div>
  )
}

// ---------- 10. Inspector ----------

function InspectorTab() {
  const [hex, setHex] = useState('#3E37E0')
  const [text, setText] = useState(hex)
  return (
    <div>
      <p className="cl-tab-desc">Встав будь-який колір і отримай повний розбір — незалежно від базового кольору вкладки Picker.</p>
      <div className="cl-picker-top">
        <input type="color" className="cl-swatch-input" value={safeHex(hex)} onChange={(e) => { setHex(e.target.value); setText(e.target.value) }} />
        <input className="cl-hex-input" value={text} onChange={(e) => { setText(e.target.value); if (C.isValidHex(e.target.value)) setHex(safeHex(e.target.value)) }} spellCheck={false} />
      </div>
      <ColorFormatsTable hex={safeHex(hex)} />
    </div>
  )
}

// ---------- 11. Light / Dark ----------

function ThemeMini({ label, theme }) {
  return (
    <div className="cl-theme-mini" style={{ background: theme.background, borderColor: theme.border }}>
      <div className="cl-theme-mini-head" style={{ color: theme.text }}>{label}</div>
      <div className="cl-theme-mini-card" style={{ background: theme.surface, borderColor: theme.border }}>
        <div style={{ color: theme.text, fontWeight: 600 }}>Заголовок</div>
        <div style={{ color: theme.text, opacity: 0.7, fontSize: 11 }}>Текст картки</div>
        <button style={{ background: theme.primary, color: '#fff', marginTop: 6 }}>Кнопка</button>
      </div>
      <div className="cl-theme-mini-vars">
        {Object.entries(theme).map(([k, v]) => <CopyField key={k} label={k} value={v} />)}
      </div>
    </div>
  )
}

function LightDarkTab({ hex }) {
  const { light, dark } = useMemo(() => C.themePair(hex), [hex])
  const cssBlock = `:root {\n${Object.entries(light).map(([k, v]) => `  --${k}: ${v};`).join('\n')}\n}\n\n[data-theme="dark"] {\n${Object.entries(dark).map(([k, v]) => `  --${k}: ${v};`).join('\n')}\n}`
  return (
    <div>
      <p className="cl-tab-desc">Автоматично згенеровані світла й темна теми з одного базового кольору.</p>
      <div className="cl-theme-pair">
        <ThemeMini label="☀️ Light" theme={light} />
        <ThemeMini label="🌙 Dark" theme={dark} />
      </div>
      <div className="cl-section-title">CSS-змінні</div>
      <button className="harmony-btn" onClick={() => copy(cssBlock)}>Копіювати весь блок CSS</button>
      <pre className="cl-code-block">{cssBlock}</pre>
    </div>
  )
}

// ---------- 12. Experiment ----------

function ExperimentTab({ hex, setHex }) {
  const { r, g, b } = C.hexToRgb(hex)
  const base = C.rgbToHsl(r, g, b)
  const [h, setH] = useState(base.h)
  const [s, setS] = useState(base.s)
  const [l, setL] = useState(base.l)
  const [opacity, setOpacity] = useState(100)
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)

  const computed = C.hslToHex(h, s, l)

  return (
    <div>
      <p className="cl-tab-desc">Живі повзунки — експериментуй, не змінюючи базовий колір, поки не натиснеш «Застосувати».</p>
      <div className="cl-experiment-preview" style={{ background: computed, opacity: opacity / 100, filter: `brightness(${brightness}%) contrast(${contrast}%)` }} />
      <div className="cl-editrow"><label>Hue {Math.round(h)}° <input type="range" min="0" max="360" value={h} onChange={(e) => setH(Number(e.target.value))} /></label></div>
      <div className="cl-editrow"><label>Saturation {Math.round(s)}% <input type="range" min="0" max="100" value={s} onChange={(e) => setS(Number(e.target.value))} /></label></div>
      <div className="cl-editrow"><label>Lightness {Math.round(l)}% <input type="range" min="0" max="100" value={l} onChange={(e) => setL(Number(e.target.value))} /></label></div>
      <div className="cl-editrow"><label>Opacity {opacity}% <input type="range" min="0" max="100" value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} /></label></div>
      <div className="cl-editrow"><label>Brightness {brightness}% <input type="range" min="30" max="170" value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} /></label></div>
      <div className="cl-editrow"><label>Contrast {contrast}% <input type="range" min="30" max="170" value={contrast} onChange={(e) => setContrast(Number(e.target.value))} /></label></div>
      <div className="cl-picker-top">
        <CopyField label="HEX" value={computed} />
        <button className="pf-add-btn" onClick={() => setHex(computed)}>Застосувати як базовий колір</button>
      </div>
    </div>
  )
}

// ---------- 13. Saved ----------

function SavedTab({ onPick }) {
  const { savedColors, removeColor, palettes, removePalette, savedGradients, removeGradient } = useProgress()
  return (
    <div>
      <div className="cl-section-title">Кольори</div>
      {savedColors.length === 0 && <div className="empty-state">Ще немає збережених кольорів.</div>}
      <div className="cl-saved-colors">
        {savedColors.map((hx) => (
          <div key={hx} className="cl-saved-chip" style={{ background: hx }} onClick={() => onPick(hx)}>
            <span>{hx}</span>
            <button onClick={(e) => { e.stopPropagation(); removeColor(hx) }}>✕</button>
          </div>
        ))}
      </div>

      <div className="cl-section-title">Палітри</div>
      {palettes.length === 0 && <div className="empty-state">Ще немає збережених палітр.</div>}
      <div className="saved-palettes">
        {palettes.map((p, i) => (
          <div key={i} className="saved-item">
            {p.map((hx, j) => <span key={j} style={{ background: hx }} />)}
            <button className="saved-del" onClick={() => removePalette(i)}>✕</button>
          </div>
        ))}
      </div>

      <div className="cl-section-title">Градієнти</div>
      {savedGradients.length === 0 && <div className="empty-state">Ще немає збережених градієнтів.</div>}
      {savedGradients.map((g) => (
        <div key={g.id} className="cl-saved-gradient">
          <div className="cl-saved-gradient-bar" style={{ background: g.css }} />
          <button className="harmony-btn" onClick={() => copy(`background: ${g.css};`)}>Copy CSS</button>
          <button className="cl-mini-btn" onClick={() => removeGradient(g.id)}>✕</button>
        </div>
      ))}
    </div>
  )
}

// ---------- 14. Export ----------

function paletteToPng(palette) {
  const roles = Object.keys(C.SEMANTIC_LABELS)
  const w = 600, h = 80
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h * roles.length
  const ctx = canvas.getContext('2d')
  roles.forEach((role, i) => {
    ctx.fillStyle = palette[role]
    ctx.fillRect(0, i * h, w, h)
    ctx.fillStyle = C.isLight(palette[role]) ? '#000' : '#fff'
    ctx.font = '16px sans-serif'
    ctx.fillText(`${C.SEMANTIC_LABELS[role]} — ${palette[role]}`, 16, i * h + h / 2 + 5)
  })
  return canvas.toDataURL('image/png')
}

function downloadDataUrl(dataUrl, filename) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  a.click()
}

function downloadText(text, filename, mime = 'text/plain') {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  downloadDataUrl(url, filename)
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

function ExportTab({ palette, baseHex }) {
  const cssVars = `:root {\n${Object.entries(palette).map(([k, v]) => `  --${k}: ${v};`).join('\n')}\n}`
  const cssSnippet = `.button {\n  background: ${palette.primary};\n  color: #fff;\n}\n\n.card {\n  background: ${palette.surface};\n  border: 1px solid ${palette.border};\n  color: ${palette.text};\n}`
  const json = JSON.stringify(palette, null, 2)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="${80 * Object.keys(palette).length}">${
    Object.entries(palette).map(([k, v], i) => `<rect y="${i * 80}" width="600" height="80" fill="${v}" /><text x="16" y="${i * 80 + 45}" font-family="sans-serif" font-size="16" fill="${C.isLight(v) ? '#000' : '#fff'}">${C.SEMANTIC_LABELS[k]} — ${v}</text>`).join('')
  }</svg>`

  return (
    <div>
      <p className="cl-tab-desc">Експорт поточної палітри (з вкладки Palette) у зручному форматі.</p>
      <div className="cl-section-title">Текст</div>
      <CopyField label="HEX (base)" value={baseHex.toUpperCase()} />
      <div className="cl-picker-top" style={{ marginTop: 10 }}>
        <button className="harmony-btn" onClick={() => copy(cssVars)}>Copy CSS Variables</button>
        <button className="harmony-btn" onClick={() => copy(cssSnippet)}>Copy CSS</button>
        <button className="harmony-btn" onClick={() => copy(json)}>Copy JSON</button>
      </div>
      <div className="cl-section-title">Файли</div>
      <div className="cl-picker-top">
        <button className="harmony-btn" onClick={() => downloadText(svg, 'palette.svg', 'image/svg+xml')}>⬇ SVG</button>
        <button className="harmony-btn" onClick={() => downloadDataUrl(paletteToPng(palette), 'palette.png')}>⬇ PNG</button>
        <button className="harmony-btn" onClick={() => downloadText(json, 'palette.json', 'application/json')}>⬇ JSON</button>
      </div>
      <pre className="cl-code-block">{cssVars}</pre>
    </div>
  )
}

// ---------- Root ----------

export default function ColorLab() {
  const [baseHex, setBaseHex] = useState('#3E37E0')
  const [tab, setTab] = useState('picker')
  const [paletteOverrides, setPaletteOverrides] = useState({})

  const palette = useMemo(() => ({ ...C.semanticPalette(baseHex), ...paletteOverrides }), [baseHex, paletteOverrides])

  function setPaletteColor(role, hx) {
    setPaletteOverrides((prev) => ({ ...prev, [role]: hx }))
  }
  function resetPaletteOverrides() {
    setPaletteOverrides({})
  }
  function pickAsBase(hx) {
    setBaseHex(safeHex(hx))
    setTab('picker')
  }

  return (
    <div className="cl">
      <div className="cl-tabs">
        {TABS.map((t) => (
          <button key={t.key} className={'cl-tab' + (tab === t.key ? ' active' : '')} onClick={() => setTab(t.key)}>
            <span className="cl-tab-icon">{t.icon}</span>{t.label}
          </button>
        ))}
      </div>
      <div className="cl-panel">
        {tab === 'picker' && <PickerTab hex={baseHex} setHex={setBaseHex} />}
        {tab === 'harmonies' && <HarmoniesTab hex={baseHex} setHex={setBaseHex} />}
        {tab === 'palette' && <PaletteTab palette={palette} onChange={setPaletteColor} onReset={resetPaletteOverrides} />}
        {tab === 'shades' && <ShadesTab hex={baseHex} />}
        {tab === 'contrast' && <ContrastTab palette={palette} />}
        {tab === 'gradient' && <GradientTab baseHex={baseHex} />}
        {tab === 'typography' && <TypographyTab palette={palette} />}
        {tab === 'preview' && <DesignPreviewTab palette={palette} />}
        {tab === 'imageExtract' && <ImageExtractTab onPick={pickAsBase} />}
        {tab === 'inspector' && <InspectorTab />}
        {tab === 'lightDark' && <LightDarkTab hex={baseHex} />}
        {tab === 'experiment' && <ExperimentTab hex={baseHex} setHex={setBaseHex} />}
        {tab === 'saved' && <SavedTab onPick={pickAsBase} />}
        {tab === 'export' && <ExportTab palette={palette} baseHex={baseHex} />}
      </div>
    </div>
  )
}
