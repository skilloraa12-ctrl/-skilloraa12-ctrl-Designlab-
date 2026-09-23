import { useState, useMemo, useRef, useEffect } from 'react'
import { useProgress } from './ProgressContext.jsx'
import * as C from './colorMath.js'
import LabShell from './labs/LabShell.jsx'
import LabInfoTip from './labs/LabInfoTip.jsx'
import { useLabHistory } from './labs/useLabHistory.js'
import { useLabFavorites } from './labs/useLabFavorites.js'
import { useLabRecent } from './labs/useLabRecent.js'
import { useLabMode } from './labs/useLabMode.js'
import { useLabToast } from './labs/useLabToast.js'
import { useLabShortcuts } from './labs/useLabShortcuts.js'
import { simulateColorBlindness, CVD_TYPES, CVD_DESCRIPTIONS } from './labs/colorBlindness.js'

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

function ColorFormatsTable({ hex, alpha = 1, isPro = true }) {
  const { r, g, b } = C.hexToRgb(hex)
  const hsl = C.rgbToHsl(r, g, b)
  const hsv = C.rgbToHsv(r, g, b)
  const cmyk = C.rgbToCmyk(r, g, b)
  const hwb = C.rgbToHwb(r, g, b)
  const lab = C.rgbToLab(r, g, b)
  const lch = C.rgbToLch(r, g, b)
  const oklab = C.rgbToOklab(r, g, b)
  const oklch = C.rgbToOklch(r, g, b)
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
        <CopyField label="HEXA" value={C.rgbaToHexa(r, g, b, alpha).toUpperCase()} />
        <CopyField label="RGB" value={`rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`} />
        <CopyField label="RGBA" value={`rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${alpha})`} />
        <CopyField label="HSL" value={`hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)`} />
        <CopyField label="HSLA" value={`hsla(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%, ${alpha})`} />
        <CopyField label="HSV / HSB" value={`hsv(${Math.round(hsv.h)}, ${Math.round(hsv.s)}%, ${Math.round(hsv.v)}%)`} />
        <CopyField label="CMYK" value={`cmyk(${Math.round(cmyk.c)}%, ${Math.round(cmyk.m)}%, ${Math.round(cmyk.y)}%, ${Math.round(cmyk.k)}%)`} />
        {isPro && <CopyField label="HWB" value={`hwb(${Math.round(hwb.h)}, ${Math.round(hwb.w)}%, ${Math.round(hwb.b)}%)`} />}
        {isPro && <CopyField label="LAB" value={`lab(${lab.l.toFixed(1)}, ${lab.a.toFixed(1)}, ${lab.b.toFixed(1)})`} />}
        {isPro && <CopyField label="LCH" value={`lch(${lch.l.toFixed(1)}, ${lch.c.toFixed(1)}, ${lch.h.toFixed(1)})`} />}
        {isPro && <CopyField label="OKLAB" value={`oklab(${oklab.l.toFixed(3)} ${oklab.a.toFixed(3)} ${oklab.b.toFixed(3)})`} />}
        {isPro && <CopyField label="OKLCH" value={`oklch(${oklch.l.toFixed(3)} ${oklch.c.toFixed(3)} ${oklch.h.toFixed(1)})`} />}
      </div>
      {!isPro && (
        <p className="cl-beginner-note">
          У режимі Beginner приховано точні формати (LAB, LCH, OKLAB, OKLCH, HWB) — перемкни на 🔵 Pro вгорі сторінки, щоб побачити їх.
        </p>
      )}
    </div>
  )
}

function HelpBox({ children }) {
  return (
    <details className="cl-help">
      <summary>❓ Як це працює (пояснення простими словами)</summary>
      <div className="cl-help-body">{children}</div>
    </details>
  )
}

// ---------- 1. Color Picker ----------

const PICKER_PRESETS = [
  { label: 'Modern Blue', hex: '#3E63DD' },
  { label: 'Warm', hex: '#E0673E' },
  { label: 'Neutral', hex: '#6B7280' },
  { label: 'Dark UI', hex: '#7C5CFF' },
  { label: 'Light UI', hex: '#2F6FED' },
  { label: 'Accessibility-safe', hex: '#0B5FFF' },
]

function PickerTab({ hex, setHex, isPro }) {
  const [text, setText] = useState(hex)
  const [alpha, setAlpha] = useState(1)
  const { saveColor } = useProgress()
  const { toggle: toggleFavorite, isFavorite } = useLabFavorites('color')
  const { items: recentColors, push: pushRecent } = useLabRecent('color')
  const { r, g, b } = C.hexToRgb(hex)
  const hsl = C.rgbToHsl(r, g, b)
  const eyedropperSupported = typeof window !== 'undefined' && 'EyeDropper' in window

  // hex can change from outside this tab too (Undo/Redo, presets applied
  // via keyboard, a color picked on another tab) - keep the text field in
  // sync whenever that happens, without fighting the user's own typing
  // (commitText only calls setHex once the typed value is a valid hex,
  // at which point hex === what they just typed, so this is a no-op then).
  useEffect(() => {
    setText(hex)
  }, [hex])

  useEffect(() => {
    const t = setTimeout(() => pushRecent(hex), 800)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hex])

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

  function applyPreset(p) {
    setHex(p.hex); setText(p.hex)
  }

  async function pickWithEyedropper() {
    try {
      const ed = new window.EyeDropper()
      const result = await ed.open()
      setHex(result.sRGBHex); setText(result.sRGBHex)
    } catch {
      // користувач скасував вибір піпеткою — нічого робити не треба
    }
  }

  return (
    <div>
      <p className="cl-tab-desc">Базовий колір для всього Color Lab — гармонії, палітра, відтінки й превʼю нижче будуються саме з нього.</p>
      <HelpBox>
        <ol>
          <li>Обери колір трьома способами: клікни на кольоровий квадратик зліва, впиши HEX-код у поле (наприклад <code>#3E37E0</code>), або зміни цифри R/G/B чи H/S/L нижче.</li>
          <li>Цей колір — <b>головний (базовий)</b> для всього Color Lab. Щойно він зміниться — автоматично перерахуються вкладки Harmonies, Palette, Shades, Contrast, Typography і Design Preview.</li>
          <li>Кнопка <b>💧 Піпетка</b> (якщо браузер підтримує) бере колір із будь-якого місця на екрані. Кнопка <b>🎲 Random</b> підбирає випадковий колір.</li>
          <li>Кнопка <b>☆ Обране</b> зберігає колір у персональний список обраного (окремо від проєктних збережень), а <b>💾 Save</b> кладе колір у вкладку Saved.</li>
          <li>Нижче — пресети (готові стартові кольори) і «Недавні» — останні кольори, якими ти користувалась(-ся) тут.</li>
          <li>Таблиця «Усі формати» внизу — це той самий колір, записаний різними «мовами»: RGB/HSL для сайтів, CMYK для друку, LAB/LCH/OKLAB/OKLCH для точних розрахунків (видно в режимі 🔵 Pro). Клікни на будь-яке поле, щоб скопіювати саме той запис.</li>
        </ol>
      </HelpBox>
      <div className="cl-picker-top">
        <input type="color" className="cl-swatch-input" value={safeHex(hex)} onChange={(e) => { setHex(e.target.value); setText(e.target.value) }} />
        <input
          className="cl-hex-input"
          value={text}
          onChange={(e) => commitText(e.target.value)}
          spellCheck={false}
        />
        {eyedropperSupported && <button className="harmony-btn" onClick={pickWithEyedropper}>💧 Піпетка</button>}
        <button className="harmony-btn" onClick={randomColor}>🎲 Random</button>
        <button className="harmony-btn" onClick={() => copy(hex.toUpperCase())}>Copy HEX</button>
        <button className={'harmony-btn' + (isFavorite(hex) ? ' active' : '')} onClick={() => toggleFavorite(hex)}>
          {isFavorite(hex) ? '★' : '☆'} Обране
        </button>
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
      <div className="cl-editrow">
        <label>Alpha {Math.round(alpha * 100)}% <input type="range" min="0" max="100" value={Math.round(alpha * 100)} onChange={(e) => setAlpha(Number(e.target.value) / 100)} /></label>
      </div>

      <div className="cl-section-title">Пресети</div>
      <div className="cl-preset-row">
        {PICKER_PRESETS.map((p) => (
          <button key={p.label} className="cl-preset-btn" style={{ background: p.hex }} onClick={() => applyPreset(p)} title={p.hex}>
            <span>{p.label}</span>
          </button>
        ))}
      </div>

      {recentColors.length > 0 && (
        <>
          <div className="cl-section-title">Недавні</div>
          <div className="cl-recent-row">
            {recentColors.map((hx) => (
              <button key={hx} className="cl-recent-swatch" style={{ background: hx }} onClick={() => { setHex(hx); setText(hx) }} title={hx} />
            ))}
          </div>
        </>
      )}

      <div className="cl-section-title">Усі формати</div>
      <ColorFormatsTable hex={hex} alpha={alpha} isPro={isPro} />
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
      <HelpBox>
        <p>Уяви кольорове коло (веселку, замкнену в круг). «Гармонія» — це набір кольорів, розташованих на цьому колі за певною математичною схемою відносно твого базового кольору — тому вони автоматично добре поєднуються.</p>
        <ol>
          <li>Обери тип гармонії кнопками вгорі — кожен тип дає інший настрій і різну кількість кольорів (наприклад «Комплементарна» дає 2 контрастні кольори, а «Тріадна» — 3 збалансовані).</li>
          <li>Під кожним кольором підписано, для чого він зазвичай підходить (База, Акцент, CTA-кнопка і т.д.) — це підказка, а не жорстке правило.</li>
          <li>Кнопка <b>«Base ⟶»</b> робить цей колір новим базовим — переносить тебе на вкладку Color Picker з уже вибраним кольором.</li>
          <li>Кнопка <b>💾</b> зберігає один конкретний колір, а кнопка «Зберегти цю гармонію як палітру» внизу — всі кольори одразу.</li>
        </ol>
      </HelpBox>
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

const ROLE_NOTES = {
  primary: 'Головний колір бренду. З’являється на найважливіших кнопках («Почати», «Play»), у шапці сайту/застосунку, в лого.',
  secondary: 'Другий колір бренду. Підтримує primary — частина лого, другорядні акценти.',
  accent: 'Яскравий «зачіпний» колір. Іконки карток, аватарки, CTA-кнопки («Дізнатись більше»), підсвітка активних елементів.',
  background: 'Фон усієї сторінки або екрана — те, що під усім іншим.',
  surface: 'Фон карток, панелей, навбару — трохи відрізняється від background, щоб елементи «піднімались» над фоном.',
  text: 'Основний колір тексту — заголовки, звичайний текст.',
  muted: 'Приглушений колір — підписи, описи, другорядна інформація, яка не має перетягувати увагу.',
  border: 'Колір рамок карток і ліній-роздільників.',
  success: 'Колір «все добре»: успішні дії, позитивні повідомлення.',
  warning: 'Колір попередження: обережно, зверни увагу.',
  error: 'Колір помилки: щось пішло не так, обов’язкові поля тощо.',
  info: 'Колір інформаційних підказок і нейтральних повідомлень.',
}

function PaletteTab({ palette, onChange, onReset }) {
  const { savePalette } = useProgress()
  return (
    <div>
      <p className="cl-tab-desc">Семантична палітра, автоматично згенерована з базового кольору. Кожну роль можна перевизначити вручну.</p>
      <HelpBox>
        <p><b>Це «пульт керування» кольорами всього Color Lab.</b> Замість одного кольору тут 12 «ролей» — кожна відповідає за свою частину дизайну. Зміниш роль тут — і скрізь, де вона використовується (Design Preview, Typography, Contrast), одразу оновиться.</p>
        <ol>
          <li>Клікни на кольоровий квадратик картки, щоб відкрити вибір кольору, або впиши HEX-код у поле під ним.</li>
          <li>Кожна роль незалежна — можеш поміняти, наприклад, тільки Primary, а решта залишиться як була згенерована автоматично.</li>
          <li>Кнопка <b>«Скинути до авто»</b> прибирає всі твої ручні зміни й повертає палітру, згенеровану з базового кольору (вкладка Color Picker).</li>
        </ol>
        <p className="cl-help-legend-title">За що відповідає кожна роль:</p>
        <ul className="cl-help-legend">
          {Object.entries(C.SEMANTIC_LABELS).map(([role, label]) => (
            <li key={role}>
              <span className="cl-legend-swatch" style={{ background: palette[role] }} />
              <span><b>{label}</b> ({role}) — {ROLE_NOTES[role]}</span>
            </li>
          ))}
        </ul>
      </HelpBox>
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
      <HelpBox>
        <p>Це один і той самий колір, але освітлений або затемнений у 11 кроків — як сходинки. 50 — майже білий, 500 — приблизно твій базовий колір, 950 — майже чорний.</p>
        <ol>
          <li>Світлі кроки (50–200) зазвичай беруть для фонів блоків, підсвітки при наведенні.</li>
          <li>Середні кроки (400–600) — для кнопок, іконок, основних акцентів.</li>
          <li>Темні кроки (700–950) — для тексту на світлому фоні або темної теми.</li>
          <li>Клікни на будь-яку клітинку, щоб скопіювати її HEX-код.</li>
        </ol>
      </HelpBox>
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

const CVD_ROLES = ['primary', 'secondary', 'accent', 'success', 'warning', 'error', 'info']

function ColorBlindSimulator({ palette }) {
  const [type, setType] = useState('protanopia')
  return (
    <div>
      <div className="harmony-select">
        {Object.entries(CVD_TYPES).filter(([key]) => key !== 'none').map(([key, label]) => (
          <button key={key} className={'harmony-btn' + (type === key ? ' active' : '')} onClick={() => setType(key)}>
            {label}
          </button>
        ))}
      </div>
      <p className="cl-harmony-info">{CVD_DESCRIPTIONS[type]}</p>
      <div className="cl-cvd-grid">
        {CVD_ROLES.map((role) => {
          const original = palette[role]
          const simulated = simulateColorBlindness(original, type)
          return (
            <div key={role} className="cl-cvd-row">
              <div className="cl-cvd-label">{C.SEMANTIC_LABELS[role]}</div>
              <div className="cl-cvd-swatch" style={{ background: original }}>Норма</div>
              <span className="cl-cvd-arrow">→</span>
              <div className="cl-cvd-swatch" style={{ background: simulated }}>Симуляція</div>
            </div>
          )
        })}
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
      <HelpBox>
        <p>Контраст — це наскільки сильно відрізняються колір тексту й колір фону. Якщо контраст малий (наприклад, жовтий текст на білому фоні), текст важко прочитати — особливо людям з поганим зором.</p>
        <ol>
          <li>WCAG — це міжнародний стандарт доступності. Він каже: для звичайного тексту потрібне співвідношення контрасту мінімум <b>4.5:1</b> (рівень AA) або <b>7:1</b> (суворіший рівень AAA); для великого тексту вимоги мʼякші.</li>
          <li>Зелена галочка ✓ = пройшло перевірку, можна використовувати. Червоний хрестик ✕ = текст буде важко читати, варто замінити колір фону або тексту.</li>
          <li>Обери колір тексту й фону вгорі, щоб перевірити довільну пару кольорів, або дивись автоматичну перевірку кожної кнопки нижче.</li>
          <li>Внизу — симуляція дальтонізму: показує, як твою палітру бачить людина з тим чи іншим типом порушення кольорового зору.</li>
        </ol>
      </HelpBox>
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

      <div className="cl-section-title">Симуляція дальтонізму</div>
      <ColorBlindSimulator palette={palette} />
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
      <HelpBox>
        <p>Градієнт — плавний перехід від одного кольору до іншого (наприклад, від фіолетового до рожевого). «Точка» — це один колір у цьому переході.</p>
        <ol>
          <li>Обери тип: <b>linear</b> — перехід по прямій лінії під кутом, <b>radial</b> — розходиться колами з центру, <b>conic</b> — обертається навколо центру, як циферблат.</li>
          <li>Для linear/conic крути повзунок «Кут», щоб змінити напрямок переходу.</li>
          <li>У кожної точки є колір, «Позиція» (де саме на градієнті вона знаходиться, у %) і «Прозорість».</li>
          <li>«+ Додати точку» додає ще один колір у перехід, ✕ прибирає точку (мінімум дві точки завжди залишаються).</li>
          <li>Готовий код CSS і SVG внизу можна скопіювати прямо в сайт, а кнопка 💾 зберігає градієнт у вкладку Saved.</li>
        </ol>
      </HelpBox>
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
      <HelpBox>
        <p>Тут показано, як текст різних «рівнів» (заголовок, звичайний текст, підпис, посилання, текст кнопки) буде виглядати кольорами твоєї палітри.</p>
        <ol>
          <li>Число праворуч від кожного рядка (наприклад «5.2:1») — це контраст тексту з фоном під ним. Чим більше — тим краще видно.</li>
          <li>Щоб змінити ці кольори, не редагуй тут нічого — йди на вкладку 🎯 Palette і зміни ролі <b>text</b>, <b>muted</b>, <b>accent</b> або <b>primary</b> (кнопка бере колір з primary).</li>
        </ol>
      </HelpBox>
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

function DesignPreviewTab({ palette, goTo }) {
  const [type, setType] = useState('website')
  const Comp = PREVIEW_COMPONENTS[type]
  return (
    <div>
      <p className="cl-tab-desc">Як поточна палітра виглядає у справжньому макеті — обери напрямок.</p>
      <HelpBox>
        <p><b>Головне: ця вкладка нічого сама не редагує.</b> Вона тільки ПОКАЗУЄ, як твоя палітра виглядає у справжньому макеті — сайті, застосунку, упаковці тощо.</p>
        <ol>
          <li>Кнопки вгорі (Website, App, Game UI, Logo…) — перемикають лише ТИП макета, який показується. Кольори від цього не змінюються.</li>
          <li>Щоб <b>змінити кольорову гаму</b> у макеті, є два способи:
            <ul>
              <li><b>Швидко, все одразу:</b> відкрий вкладку 🎨 Color Picker і зміни базовий колір (нове фото, HEX-код чи повзунки) — уся палітра перерахується сама, і тут одразу з’являться нові кольори.</li>
              <li><b>Точково, один колір:</b> відкрий вкладку 🎯 Palette і зміни одну конкретну роль, наприклад тільки «Основний» (primary) — тоді в макеті зміниться лише те, що використовує саме цю роль (наприклад, тільки кнопки й шапка), а решта залишиться як є.</li>
            </ul>
          </li>
          <li>Нічого зберігати не треба — щойно змінив колір на Palette чи Picker, повертайся сюди (або просто перемкни вкладку назад) і побачиш оновлений макет.</li>
        </ol>
        <div className="cl-picker-top" style={{ marginTop: 6 }}>
          <button className="harmony-btn" onClick={() => goTo('palette')}>🎯 Відкрити Palette (змінити окремі кольори)</button>
          <button className="harmony-btn" onClick={() => goTo('picker')}>🎨 Відкрити Color Picker (змінити все одразу)</button>
        </div>
        <p className="cl-help-legend-title">Який колір за що відповідає в макетах нижче:</p>
        <ul className="cl-help-legend">
          {Object.entries(C.SEMANTIC_LABELS).map(([role, label]) => (
            <li key={role}>
              <span className="cl-legend-swatch" style={{ background: palette[role] }} />
              <span><b>{label}</b> ({role}) — {ROLE_NOTES[role]}</span>
            </li>
          ))}
        </ul>
      </HelpBox>
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
      <HelpBox>
        <p>Маєш фото, логотип чи референс, і хочеш побудувати палітру саме з нього? Ця вкладка автоматично знаходить, які кольори на картинці зустрічаються найчастіше.</p>
        <ol>
          <li>Натисни на поле вибору файлу й обери зображення на своєму пристрої.</li>
          <li>Color Lab проаналізує картинку й покаже 6 найголовніших кольорів.</li>
          <li>Клікни на будь-який знайдений колір, щоб зробити його новим базовим (переходить на Color Picker), або збережи все кнопками нижче.</li>
        </ol>
      </HelpBox>
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
      <HelpBox>
        <p>Ця вкладка не звʼязана з рештою Color Lab — вона не впливає на палітру чи превʼю. Зручно, коли просто хочеш подивитись інформацію про якийсь окремий колір (наприклад, побачений на чужому сайті), не чіпаючи свій робочий базовий колір.</p>
        <p>Введи HEX-код або вибери колір — і одразу побачиш усі його формати (RGB, HSL, CMYK, LAB, LCH), назву та теги «теплий/холодний», «світлий/темний».</p>
      </HelpBox>
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
      <HelpBox>
        <p>Багато сайтів і застосунків мають перемикач ☀️/🌙 (світла/темна тема). Тут з одного базового кольору (вкладка Color Picker) автоматично будуються обидві версії одразу — так, щоб текст залишався читабельним на обох фонах.</p>
        <ol>
          <li>Зліва — світла тема, справа — темна. Обидві живі: клацни по CopyField, щоб скопіювати окрему змінну.</li>
          <li>Щоб поміняти кольори теми — зміни базовий колір на Color Picker, теми перерахуються самі.</li>
          <li>Готовий блок CSS унизу можна вставити прямо в проєкт: <code>:root</code> — стилі за замовчуванням (світла тема), <code>[data-theme="dark"]</code> — застосовуються, коли на сторінці стоїть темна тема.</li>
        </ol>
      </HelpBox>
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
      <HelpBox>
        <p>Це «пісочниця» — можна крутити будь-який повзунок і одразу бачити результат у квадратику прев’ю вище, нічого при цьому не ламаючи. Базовий колір Color Lab не зміниться, поки сам не натиснеш кнопку.</p>
        <ul>
          <li><b>Hue</b> — відтінок (положення на кольоровому колі: червоний → жовтий → зелений → синій → фіолетовий → знову червоний).</li>
          <li><b>Saturation</b> — насиченість: 0% = сірий, 100% = максимально яскравий колір.</li>
          <li><b>Lightness</b> — світлота: 0% = чорний, 100% = білий, 50% = «чистий» колір.</li>
          <li><b>Opacity</b> — прозорість квадратика прев’ю (не впливає на сам HEX-код).</li>
          <li><b>Brightness / Contrast</b> — візуальні фільтри, як у фоторедакторі, теж лише для попереднього перегляду.</li>
        </ul>
        <p>Коли підібрав(ла) те, що подобається — натисни <b>«Застосувати як базовий колір»</b>, і саме цей колір стане новим базовим для всього Color Lab.</p>
      </HelpBox>
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
      <HelpBox>
        <p>Усе, що ти зберігав(ла) кнопкою 💾 на будь-якій вкладці — окремі кольори, готові гармонії/палітри, градієнти — опиняється тут. Це твоя особиста колекція.</p>
        <ol>
          <li>Клікни на збережений колір, щоб одразу зробити його новим базовим (переходить на Color Picker).</li>
          <li>✕ видаляє елемент назавжди.</li>
          <li>Усе зберігається у твоєму акаунті (через Supabase) — доступно з будь-якого пристрою, де ти увійшла в акаунт, нічого не втратиться при перезавантаженні сторінки.</li>
        </ol>
      </HelpBox>
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
      <HelpBox>
        <p>Коли палітра готова — тут можна забрати її з собою, у форматі, який підходить для роботи.</p>
        <ul>
          <li><b>Copy CSS Variables</b> — список кольорів як CSS-змінні (<code>--primary: ...</code>), вставляється в <code>:root</code> будь-якого сайту.</li>
          <li><b>Copy CSS</b> — готовий приклад стилів кнопки й картки, які вже використовують палітру.</li>
          <li><b>Copy JSON</b> — палітра у форматі даних, зручно для розробника, який підключає її в код.</li>
          <li><b>⬇ SVG / ⬇ PNG</b> — качає картинку з кольоровими прямокутниками й підписами (для показу клієнту чи в презентації).</li>
          <li><b>⬇ JSON</b> — той самий JSON, але одразу файлом на диск.</li>
        </ul>
        <p>Кнопки з написом «Copy» кладуть текст у буфер обміну — просто натисни Ctrl+V (Cmd+V на Mac) там, куди хочеш вставити.</p>
      </HelpBox>
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
  const [baseHex, setBaseHexState] = useState('#3E37E0')
  const [paletteOverrides, setPaletteOverridesState] = useState({})
  const [tab, setTab] = useState('picker')
  const { savePalette } = useProgress()

  // Undo/redo history: rapid edits (dragging a slider, typing digit by
  // digit) are debounced into one history entry instead of flooding the
  // stack, but every commit is a real, restorable snapshot.
  const hist = useLabHistory({ baseHex: '#3E37E0', paletteOverrides: {} })
  const baseHexRef = useRef(baseHex)
  const overridesRef = useRef(paletteOverrides)
  const debounceRef = useRef(null)

  function scheduleHistoryCommit() {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      hist.set({ baseHex: baseHexRef.current, paletteOverrides: overridesRef.current })
    }, 400)
  }

  function setBaseHex(hexValue) {
    baseHexRef.current = hexValue
    setBaseHexState(hexValue)
    scheduleHistoryCommit()
  }
  function setPaletteColor(role, hx) {
    overridesRef.current = { ...overridesRef.current, [role]: hx }
    setPaletteOverridesState(overridesRef.current)
    scheduleHistoryCommit()
  }
  function resetPaletteOverrides() {
    overridesRef.current = {}
    setPaletteOverridesState({})
    scheduleHistoryCommit()
  }
  function handleUndo() {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    hist.undo()
  }
  function handleRedo() {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    hist.redo()
  }
  useEffect(() => {
    baseHexRef.current = hist.value.baseHex
    overridesRef.current = hist.value.paletteOverrides
    setBaseHexState(hist.value.baseHex)
    setPaletteOverridesState(hist.value.paletteOverrides)
  }, [hist.value])

  const labMode = useLabMode()
  const toastApi = useLabToast()
  const { push: pushRecentLab } = useLabRecent('lab')

  useEffect(() => {
    pushRecentLab('color')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const palette = useMemo(() => ({ ...C.semanticPalette(baseHex), ...paletteOverrides }), [baseHex, paletteOverrides])

  function pickAsBase(hx) {
    setBaseHex(safeHex(hx))
    setTab('picker')
  }

  useLabShortcuts({
    onUndo: hist.canUndo ? handleUndo : undefined,
    onRedo: hist.canRedo ? handleRedo : undefined,
    onSave: () => { savePalette(Object.values(palette)); toastApi.show('✓ Палітру збережено') },
    onCopy: () => { copy(baseHex.toUpperCase()); toastApi.show('✓ HEX скопійовано') },
  })

  return (
    <LabShell
      title="Color Lab"
      subtitle="Повноцінна кольорова лабораторія для всіх напрямків дизайну — від вибору кольору до готової палітри, градієнтів і превʼю в реальних макетах."
      icon="🎨"
      mode={labMode.mode}
      onToggleMode={labMode.toggle}
      canUndo={hist.canUndo}
      canRedo={hist.canRedo}
      onUndo={handleUndo}
      onRedo={handleRedo}
      toast={toastApi.toast}
      extra={
        <LabInfoTip title="Гарячі клавіші">
          Ctrl/Cmd+Z — Undo · Ctrl/Cmd+Shift+Z — Redo · Ctrl/Cmd+S — зберегти палітру · Ctrl/Cmd+C — скопіювати HEX (поза текстовими полями).
        </LabInfoTip>
      }
    >
      <div className="cl">
        <div className="cl-tabs">
          {TABS.map((t) => (
            <button key={t.key} className={'cl-tab' + (tab === t.key ? ' active' : '')} onClick={() => setTab(t.key)}>
              <span className="cl-tab-icon">{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
        <div className="cl-panel">
          {tab === 'picker' && <PickerTab hex={baseHex} setHex={setBaseHex} isPro={labMode.isPro} />}
          {tab === 'harmonies' && <HarmoniesTab hex={baseHex} setHex={setBaseHex} />}
          {tab === 'palette' && <PaletteTab palette={palette} onChange={setPaletteColor} onReset={resetPaletteOverrides} />}
          {tab === 'shades' && <ShadesTab hex={baseHex} />}
          {tab === 'contrast' && <ContrastTab palette={palette} />}
          {tab === 'gradient' && <GradientTab baseHex={baseHex} />}
          {tab === 'typography' && <TypographyTab palette={palette} />}
          {tab === 'preview' && <DesignPreviewTab palette={palette} goTo={setTab} />}
          {tab === 'imageExtract' && <ImageExtractTab onPick={pickAsBase} />}
          {tab === 'inspector' && <InspectorTab />}
          {tab === 'lightDark' && <LightDarkTab hex={baseHex} />}
          {tab === 'experiment' && <ExperimentTab hex={baseHex} setHex={setBaseHex} />}
          {tab === 'saved' && <SavedTab onPick={pickAsBase} />}
          {tab === 'export' && <ExportTab palette={palette} baseHex={baseHex} />}
        </div>
      </div>
    </LabShell>
  )
}
