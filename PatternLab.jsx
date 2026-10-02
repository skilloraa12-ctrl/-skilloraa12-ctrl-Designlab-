import { useEffect, useRef, useState } from 'react'
import LabShell from './labs/LabShell.jsx'
import LabInfoTip from './labs/LabInfoTip.jsx'
import { useLabHistory } from './labs/useLabHistory.js'
import { useLabMode } from './labs/useLabMode.js'
import { useLabToast } from './labs/useLabToast.js'
import { useLabShortcuts } from './labs/useLabShortcuts.js'
import { useLabRecent } from './labs/useLabRecent.js'
import { buildDotsCss, buildStripesCss, buildWaveSvg, buildTrianglesSvg, buildCheckerboardCss, buildGraphPaperCss } from './labs/patternBuilder.js'

const TABS = [
  { key: 'dots', icon: '⚫', label: 'Крапки' },
  { key: 'lines', icon: '📏', label: 'Лінії' },
  { key: 'waves', icon: '🌊', label: 'Хвилі' },
  { key: 'geometric', icon: '🔷', label: 'Геометрія' },
  { key: 'checkerboard', icon: '🏁', label: 'Шахівниця' },
  { key: 'graphpaper', icon: '⊞', label: 'Сітка' },
]

function copy(text) {
  if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {})
}
function downloadText(text, filename, mime = 'text/plain') {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

function HelpBox({ children }) {
  return (
    <details className="cl-help" open>
      <summary>❓ Як це працює (пояснення простими словами)</summary>
      <div className="cl-help-body">{children}</div>
    </details>
  )
}

function DotsTab({ state, patch, toastApi }) {
  const css = buildDotsCss(state.dots)
  return (
    <div>
      <p className="cl-tab-desc">Патерн із крапок — поширений фоновий візерунок, зроблений чистим CSS без жодної картинки.</p>
      <HelpBox>
        <p>Трюк — <code>radial-gradient</code>, що малює одне коло, і <code>background-size</code>, менший за саму картинку, через що браузер повторює (тайлить) цей квадрат по всій площі.</p>
        <p>Важливо, що «Відстань» має бути більшою за «Розмір крапки» × 2 — інакше сусідні крапки почнуть перекриватись і зіллються у суцільні смуги замість окремих крапок. Такий патерн добре працює і як фон <code>&lt;body&gt;</code>, і як текстура всередині SVG-маски.</p>
        <p>Наприклад, при розмірі крапки 3px і відстані 24px щільність патерну низька — крапки виглядають як рідкий «пунктир» на великому фоні. Якщо зменшити відстань до 10px (майже впритул до подвоєного розміру), фон стане набагато щільнішим і почне нагадувати текстуру наждачного паперу — це корисний орієнтир, коли підбираєте баланс між «ледь помітним» і «виразним» патерном.</p>
      </HelpBox>

      <div className="cl-editrow"><label>Розмір крапки<input type="range" min={1} max={20} value={state.dots.size} onChange={(e) => patch('dots', { size: parseInt(e.target.value, 10) })} /><span>{state.dots.size}px</span></label></div>
      <div className="cl-editrow"><label>Відстань<input type="range" min={10} max={80} value={state.dots.spacing} onChange={(e) => patch('dots', { spacing: parseInt(e.target.value, 10) })} /><span>{state.dots.spacing}px</span></label></div>
      <div className="cl-picker-top">
        <span style={{ fontSize: 12, color: 'var(--muted)', width: 70, flex: 'none' }}>Крапка</span>
        <input type="color" className="cl-swatch-input" value={state.dots.color} onChange={(e) => patch('dots', { color: e.target.value })} />
        <input className="cl-hex-input" value={state.dots.color} onChange={(e) => patch('dots', { color: e.target.value })} />
      </div>
      <div className="cl-picker-top">
        <span style={{ fontSize: 12, color: 'var(--muted)', width: 70, flex: 'none' }}>Фон</span>
        <input type="color" className="cl-swatch-input" value={state.dots.bg} onChange={(e) => patch('dots', { bg: e.target.value })} />
        <input className="cl-hex-input" value={state.dots.bg} onChange={(e) => patch('dots', { bg: e.target.value })} />
      </div>

      <div className="cl-section-title">Превʼю</div>
      <div className="pt-preview" style={{ backgroundColor: state.dots.bg, backgroundImage: `radial-gradient(circle, ${state.dots.color} ${state.dots.size}px, transparent ${state.dots.size}px)`, backgroundSize: `${state.dots.spacing}px ${state.dots.spacing}px` }} />

      <div className="cl-picker-top"><button className="harmony-btn" onClick={() => { copy(css); toastApi.show('✓ CSS скопійовано') }}>Copy CSS</button></div>
      <pre className="cl-code-block">{css}</pre>
    </div>
  )
}

function LinesTab({ state, patch, toastApi }) {
  const css = buildStripesCss(state.lines)
  const bgImage = `repeating-linear-gradient(${state.lines.angle}deg, ${state.lines.color} 0px, ${state.lines.color} ${state.lines.width}px, transparent ${state.lines.width}px, transparent ${state.lines.width + state.lines.gap}px)`
  return (
    <div>
      <p className="cl-tab-desc">Смугастий патерн — ще один CSS-only трюк, цього разу на <code>repeating-linear-gradient</code>.</p>
      <HelpBox>
        <p>Градієнт повторюється кожні (ширина смуги + проміжок) пікселів. Кут 0° — вертикальні смуги, 90° — горизонтальні, 45° — по діагоналі.</p>
        <p>На відміну від крапок, тут не потрібен окремий <code>background-size</code> — повторення вбудоване прямо в <code>repeating-linear-gradient</code>. Це найлегший (за розміром коду) з усіх CSS-патернів і часто використовується для прогрес-смуг (striped progress bar) чи попереджувальних "construction tape" візерунків.</p>
        <p>Період повтору — це сума «Ширина смуги» + «Проміжок»: наприклад, ширина 6px і проміжок 10px дають період 16px, тобто новий цикл смуги починається кожні 16px уздовж градієнта. При куті 45° ширина смуги + проміжок все одно вимірюються вздовж напрямку лінії, а не по горизонталі — тому на око діагональні смуги виглядають «тоншими» за ту саму цифру в пікселях, ніж вертикальні.</p>
      </HelpBox>

      <div className="cl-editrow"><label>Кут<input type="range" min={0} max={180} value={state.lines.angle} onChange={(e) => patch('lines', { angle: parseInt(e.target.value, 10) })} /><span>{state.lines.angle}°</span></label></div>
      <div className="cl-editrow"><label>Ширина смуги<input type="range" min={1} max={40} value={state.lines.width} onChange={(e) => patch('lines', { width: parseInt(e.target.value, 10) })} /><span>{state.lines.width}px</span></label></div>
      <div className="cl-editrow"><label>Проміжок<input type="range" min={1} max={40} value={state.lines.gap} onChange={(e) => patch('lines', { gap: parseInt(e.target.value, 10) })} /><span>{state.lines.gap}px</span></label></div>
      <div className="cl-picker-top">
        <span style={{ fontSize: 12, color: 'var(--muted)', width: 70, flex: 'none' }}>Лінія</span>
        <input type="color" className="cl-swatch-input" value={state.lines.color} onChange={(e) => patch('lines', { color: e.target.value })} />
        <input className="cl-hex-input" value={state.lines.color} onChange={(e) => patch('lines', { color: e.target.value })} />
      </div>
      <div className="cl-picker-top">
        <span style={{ fontSize: 12, color: 'var(--muted)', width: 70, flex: 'none' }}>Фон</span>
        <input type="color" className="cl-swatch-input" value={state.lines.bg} onChange={(e) => patch('lines', { bg: e.target.value })} />
        <input className="cl-hex-input" value={state.lines.bg} onChange={(e) => patch('lines', { bg: e.target.value })} />
      </div>

      <div className="cl-section-title">Превʼю</div>
      <div className="pt-preview" style={{ backgroundColor: state.lines.bg, backgroundImage: bgImage }} />

      <div className="cl-picker-top"><button className="harmony-btn" onClick={() => { copy(css); toastApi.show('✓ CSS скопійовано') }}>Copy CSS</button></div>
      <pre className="cl-code-block">{css}</pre>
    </div>
  )
}

function WavesTab({ state, patch, toastApi }) {
  const svg = buildWaveSvg({ ...state.waves, cols: 6, rows: 4 })
  return (
    <div>
      <p className="cl-tab-desc">Хвилястий патерн — реальний тайлований SVG (<code>&lt;pattern&gt;</code>), а не наближення через CSS-градієнт.</p>
      <HelpBox>
        <p>Wavelength — довжина однієї хвилі. Amplitude — висота хвилі (наскільки сильно вигинається). SVG <code>&lt;pattern&gt;</code> сам повторює один сегмент хвилі по всій площі.</p>
        <p>Чому SVG, а не CSS-градієнт? Справжню плавну криву (не прямі лінії) CSS-градієнтами відтворити неможливо — вони вміють лише прямі переходи між кольорами. SVG <code>&lt;path&gt;</code> з кривою Безьє малює реальну хвилю, а <code>&lt;pattern&gt;</code> її тайлить так само, як <code>background-size</code> тайлить CSS-фон.</p>
        <p>Наприклад, wavelength 60px і amplitude 14px дають доволі пологу, «океанічну» хвилю. Якщо зменшити wavelength до 20px при тій самій amplitude, хвилі стиснуться по горизонталі й патерн почне виглядати різкіше, майже як зигзаг — тому ці два параметри завжди варто крутити разом, а не окремо.</p>
      </HelpBox>

      <div className="cl-editrow"><label>Wavelength<input type="range" min={20} max={120} value={state.waves.wavelength} onChange={(e) => patch('waves', { wavelength: parseInt(e.target.value, 10) })} /><span>{state.waves.wavelength}px</span></label></div>
      <div className="cl-editrow"><label>Amplitude<input type="range" min={4} max={40} value={state.waves.amplitude} onChange={(e) => patch('waves', { amplitude: parseInt(e.target.value, 10) })} /><span>{state.waves.amplitude}px</span></label></div>
      <div className="cl-editrow"><label>Товщина лінії<input type="range" min={1} max={8} value={state.waves.strokeWidth} onChange={(e) => patch('waves', { strokeWidth: parseInt(e.target.value, 10) })} /><span>{state.waves.strokeWidth}px</span></label></div>
      <div className="cl-picker-top">
        <span style={{ fontSize: 12, color: 'var(--muted)', width: 70, flex: 'none' }}>Лінія</span>
        <input type="color" className="cl-swatch-input" value={state.waves.color} onChange={(e) => patch('waves', { color: e.target.value })} />
        <input className="cl-hex-input" value={state.waves.color} onChange={(e) => patch('waves', { color: e.target.value })} />
      </div>
      <div className="cl-picker-top">
        <span style={{ fontSize: 12, color: 'var(--muted)', width: 70, flex: 'none' }}>Фон</span>
        <input type="color" className="cl-swatch-input" value={state.waves.bg} onChange={(e) => patch('waves', { bg: e.target.value })} />
        <input className="cl-hex-input" value={state.waves.bg} onChange={(e) => patch('waves', { bg: e.target.value })} />
      </div>

      <div className="cl-section-title">Превʼю</div>
      <div className="pt-preview-svg" dangerouslySetInnerHTML={{ __html: svg }} />

      <div className="cl-picker-top">
        <button className="harmony-btn" onClick={() => { copy(svg); toastApi.show('✓ SVG скопійовано') }}>Copy SVG</button>
        <button className="harmony-btn" onClick={() => downloadText(svg, 'waves.svg', 'image/svg+xml')}>⬇ SVG</button>
      </div>
      <pre className="cl-code-block">{svg}</pre>
    </div>
  )
}

function GeometricTab({ state, patch, toastApi }) {
  const svg = buildTrianglesSvg({ ...state.geometric, cols: 10, rows: 6 })
  return (
    <div>
      <p className="cl-tab-desc">Мозаїка з трикутників — кожна клітинка сітки поділена по діагоналі на два трикутники почергових кольорів.</p>
      <HelpBox>
        <p>Класичний «геометричний» фон для брендингу й обкладинок — два кольори в шаховому порядку створюють відчуття об'єму без жодної тіні чи градієнта.</p>
        <p>Кожна квадратна клітинка ділиться діагоналлю навпіл на 2 трикутники, і колір чергується не лінійно, а по формулі "парність (ряд + колонка)" — тому сусідні клітинки по горизонталі й вертикалі завжди відрізняються, як у шаховій дошці.</p>
        <p>Розмір клітинки 36px дає дрібну, щільну мозаїку, яка добре працює як фоновий шум на всю ширину сторінки. Збільшення до 80px робить кожен трикутник візуально окремим елементом — такий масштаб частіше використовують для одного великого фонового патерну в hero-секції, а не як дрібну текстуру.</p>
      </HelpBox>

      <div className="cl-editrow"><label>Розмір клітинки<input type="range" min={16} max={80} value={state.geometric.cellSize} onChange={(e) => patch('geometric', { cellSize: parseInt(e.target.value, 10) })} /><span>{state.geometric.cellSize}px</span></label></div>
      <div className="cl-picker-top">
        <span style={{ fontSize: 12, color: 'var(--muted)', width: 70, flex: 'none' }}>Колір A</span>
        <input type="color" className="cl-swatch-input" value={state.geometric.colorA} onChange={(e) => patch('geometric', { colorA: e.target.value })} />
        <input className="cl-hex-input" value={state.geometric.colorA} onChange={(e) => patch('geometric', { colorA: e.target.value })} />
      </div>
      <div className="cl-picker-top">
        <span style={{ fontSize: 12, color: 'var(--muted)', width: 70, flex: 'none' }}>Колір B</span>
        <input type="color" className="cl-swatch-input" value={state.geometric.colorB} onChange={(e) => patch('geometric', { colorB: e.target.value })} />
        <input className="cl-hex-input" value={state.geometric.colorB} onChange={(e) => patch('geometric', { colorB: e.target.value })} />
      </div>

      <div className="cl-section-title">Превʼю</div>
      <div className="pt-preview-svg" dangerouslySetInnerHTML={{ __html: svg }} />

      <div className="cl-picker-top">
        <button className="harmony-btn" onClick={() => { copy(svg); toastApi.show('✓ SVG скопійовано') }}>Copy SVG</button>
        <button className="harmony-btn" onClick={() => downloadText(svg, 'triangles.svg', 'image/svg+xml')}>⬇ SVG</button>
      </div>
      <pre className="cl-code-block">{svg}</pre>
    </div>
  )
}

function CheckerboardTab({ state, patch, toastApi }) {
  const css = buildCheckerboardCss(state.checkerboard)
  const half = state.checkerboard.size / 2
  const bgImage = [
    `linear-gradient(45deg, ${state.checkerboard.color} 25%, transparent 25%)`,
    `linear-gradient(-45deg, ${state.checkerboard.color} 25%, transparent 25%)`,
    `linear-gradient(45deg, transparent 75%, ${state.checkerboard.color} 75%)`,
    `linear-gradient(-45deg, transparent 75%, ${state.checkerboard.color} 75%)`,
  ].join(', ')
  return (
    <div>
      <p className="cl-tab-desc">Шахова дошка — найстаріший CSS-only патерн, відомий ще з ранніх 2000-х, і досі зустрічається як фон для прозорості (alpha checkerboard) у графічних редакторах.</p>
      <HelpBox>
        <p>Трюк складніший за дотс/лінії: чотири діагональні градієнти накладаються один на одного зі зсувом, так що в сумі кожна клітинка сітки виявляється або повністю зафарбованою, або повністю прозорою — без жодного SVG чи картинки.</p>
        <p>Той самий патерн (зазвичай сірий у відтінках #FFF/#CCC) використовують Photoshop, Figma й браузерні інспектори, щоб показати прозорий фон (alpha channel) у PNG — тепер ти знаєш, з чого саме він зроблений.</p>
        <p>Розмір клітинки тут — це розмір ОДНІЄЇ клітинки шахівниці (а не пари), тож «Розмір 40px» означає, що повний цикл «світла+темна» клітинка займає 80px по горизонталі й вертикалі. При дуже малих розмірах (10-15px) патерн на звичайних екранах починає зливатись у суцільний сірий через моаре-ефект — для alpha-індикатора прозорості варто лишати 16-20px.</p>
      </HelpBox>

      <div className="cl-editrow"><label>Розмір клітинки<input type="range" min={10} max={80} value={state.checkerboard.size} onChange={(e) => patch('checkerboard', { size: parseInt(e.target.value, 10) })} /><span>{state.checkerboard.size}px</span></label></div>
      <div className="cl-picker-top">
        <span style={{ fontSize: 12, color: 'var(--muted)', width: 70, flex: 'none' }}>Клітинка</span>
        <input type="color" className="cl-swatch-input" value={state.checkerboard.color} onChange={(e) => patch('checkerboard', { color: e.target.value })} />
        <input className="cl-hex-input" value={state.checkerboard.color} onChange={(e) => patch('checkerboard', { color: e.target.value })} />
      </div>
      <div className="cl-picker-top">
        <span style={{ fontSize: 12, color: 'var(--muted)', width: 70, flex: 'none' }}>Фон</span>
        <input type="color" className="cl-swatch-input" value={state.checkerboard.bg} onChange={(e) => patch('checkerboard', { bg: e.target.value })} />
        <input className="cl-hex-input" value={state.checkerboard.bg} onChange={(e) => patch('checkerboard', { bg: e.target.value })} />
      </div>

      <div className="cl-section-title">Превʼю</div>
      <div
        className="pt-preview"
        style={{
          backgroundColor: state.checkerboard.bg,
          backgroundImage: bgImage,
          backgroundSize: `${state.checkerboard.size}px ${state.checkerboard.size}px`,
          backgroundPosition: `0 0, 0 ${half}px, ${half}px -${half}px, -${half}px 0`,
        }}
      />

      <div className="cl-picker-top"><button className="harmony-btn" onClick={() => { copy(css); toastApi.show('✓ CSS скопійовано') }}>Copy CSS</button></div>
      <pre className="cl-code-block">{css}</pre>
    </div>
  )
}

function GraphPaperTab({ state, patch, toastApi }) {
  const css = buildGraphPaperCss(state.graphpaper)
  const { cellSize, majorEvery, lineWidth, color, majorColor, bg } = state.graphpaper
  const majorSize = cellSize * majorEvery
  const bgImage = [
    `linear-gradient(${majorColor} ${lineWidth}px, transparent ${lineWidth}px)`,
    `linear-gradient(90deg, ${majorColor} ${lineWidth}px, transparent ${lineWidth}px)`,
    `linear-gradient(${color} ${lineWidth}px, transparent ${lineWidth}px)`,
    `linear-gradient(90deg, ${color} ${lineWidth}px, transparent ${lineWidth}px)`,
  ].join(', ')
  const bgSize = `${majorSize}px ${majorSize}px, ${majorSize}px ${majorSize}px, ${cellSize}px ${cellSize}px, ${cellSize}px ${cellSize}px`
  return (
    <div>
      <p className="cl-tab-desc">Сітка для нотаток чи полотна — тонкі лінії кожну клітинку й жирніші "опорні" лінії кожні N клітинок, як у зошиті в клітинку або на канвасі Figma.</p>
      <HelpBox>
        <p>Трюк — чотири шари <code>linear-gradient</code>: два тонкі (вертикальний + горизонтальний) повторюються кожні «Розмір клітинки» пікселів, і два товстіші поверх них повторюються кожні «Розмір клітинки» × «Кожна N-та» пікселів. Шар, вказаний першим у CSS, малюється зверху — тому жирні лінії йдуть першими в коді, щоб перекривати тонкі в місцях перетину.</p>
        <p>Це та сама ідея, що й лінійка в Figma чи Photoshop: дрібна сітка для точного вирівнювання (наприклад, кожні 8px — поширений spacing-крок у дизайн-системах), і жирна «кілометрова» лінія кожні 5-10 кроків, щоб око могло швидко порахувати відстань, не рахуючи кожну клітинку окремо.</p>
        <p>Наприклад, розмір клітинки 20px і «Кожна N-та» = 5 дають тонку сітку з кроком 20px і жирні лінії кожні 100px — зручний масштаб для розмітки макета на основі 8-/20-піксельної сітки відступів. Для зошитового «паперу в клітинку» (формат А4, клітинка 5мм) типове значення — близько 19px при 96 DPI.</p>
      </HelpBox>

      <div className="cl-editrow"><label>Розмір клітинки<input type="range" min={8} max={60} value={cellSize} onChange={(e) => patch('graphpaper', { cellSize: parseInt(e.target.value, 10) })} /><span>{cellSize}px</span></label></div>
      <div className="cl-editrow"><label>Кожна N-та — жирна<input type="range" min={2} max={10} value={majorEvery} onChange={(e) => patch('graphpaper', { majorEvery: parseInt(e.target.value, 10) })} /><span>{majorEvery}</span></label></div>
      <div className="cl-editrow"><label>Товщина лінії<input type="range" min={1} max={3} value={lineWidth} onChange={(e) => patch('graphpaper', { lineWidth: parseInt(e.target.value, 10) })} /><span>{lineWidth}px</span></label></div>
      <div className="cl-picker-top">
        <span style={{ fontSize: 12, color: 'var(--muted)', width: 70, flex: 'none' }}>Тонка лінія</span>
        <input type="color" className="cl-swatch-input" value={color} onChange={(e) => patch('graphpaper', { color: e.target.value })} />
        <input className="cl-hex-input" value={color} onChange={(e) => patch('graphpaper', { color: e.target.value })} />
      </div>
      <div className="cl-picker-top">
        <span style={{ fontSize: 12, color: 'var(--muted)', width: 70, flex: 'none' }}>Жирна лінія</span>
        <input type="color" className="cl-swatch-input" value={majorColor} onChange={(e) => patch('graphpaper', { majorColor: e.target.value })} />
        <input className="cl-hex-input" value={majorColor} onChange={(e) => patch('graphpaper', { majorColor: e.target.value })} />
      </div>
      <div className="cl-picker-top">
        <span style={{ fontSize: 12, color: 'var(--muted)', width: 70, flex: 'none' }}>Фон</span>
        <input type="color" className="cl-swatch-input" value={bg} onChange={(e) => patch('graphpaper', { bg: e.target.value })} />
        <input className="cl-hex-input" value={bg} onChange={(e) => patch('graphpaper', { bg: e.target.value })} />
      </div>

      <div className="cl-section-title">Превʼю</div>
      <div className="pt-preview" style={{ backgroundColor: bg, backgroundImage: bgImage, backgroundSize: bgSize }} />

      <div className="cl-picker-top"><button className="harmony-btn" onClick={() => { copy(css); toastApi.show('✓ CSS скопійовано') }}>Copy CSS</button></div>
      <pre className="cl-code-block">{css}</pre>
    </div>
  )
}

function defaultState() {
  return {
    dots: { size: 3, spacing: 24, color: '#3E37E0', bg: '#FFFFFF' },
    lines: { angle: 45, width: 6, gap: 10, color: '#3E37E0', bg: '#FFFFFF' },
    waves: { wavelength: 60, amplitude: 14, strokeWidth: 3, color: '#3E37E0', bg: '#FFFFFF' },
    geometric: { cellSize: 36, colorA: '#3E37E0', colorB: '#6B62FF' },
    checkerboard: { size: 40, color: '#D5D5DB', bg: '#FFFFFF' },
    graphpaper: { cellSize: 20, majorEvery: 5, lineWidth: 1, color: '#E4E4EC', majorColor: '#B9B9C9', bg: '#FFFFFF' },
  }
}

export default function PatternLab() {
  const initial = useRef(defaultState()).current
  const [state, setStateLive] = useState(initial)
  const [tab, setTab] = useState('dots')
  const stateRef = useRef(state)
  const debounceRef = useRef(null)
  const hist = useLabHistory(initial)

  function scheduleCommit() {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => hist.set(stateRef.current), 400)
  }
  function patch(section, partial) {
    const next = { ...stateRef.current, [section]: { ...stateRef.current[section], ...partial } }
    stateRef.current = next
    setStateLive(next)
    scheduleCommit()
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
    stateRef.current = hist.value
    setStateLive(hist.value)
  }, [hist.value])

  const labMode = useLabMode()
  const toastApi = useLabToast()
  const { push: pushRecentLab } = useLabRecent('lab')
  useEffect(() => {
    pushRecentLab('pattern')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useLabShortcuts({
    onUndo: hist.canUndo ? handleUndo : undefined,
    onRedo: hist.canRedo ? handleRedo : undefined,
  })

  return (
    <LabShell
      title="Pattern Lab"
      subtitle="Крапки, лінії, хвилі, геометрія й сітка для канвасу — з експортом у CSS або SVG."
      icon="🔳"
      mode={labMode.mode}
      onToggleMode={labMode.toggle}
      canUndo={hist.canUndo}
      canRedo={hist.canRedo}
      onUndo={handleUndo}
      onRedo={handleRedo}
      toast={toastApi.toast}
      extra={
        <LabInfoTip title="Гарячі клавіші">
          Ctrl/Cmd+Z — Undo · Ctrl/Cmd+Shift+Z — Redo.
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
          {tab === 'dots' && <DotsTab state={state} patch={patch} toastApi={toastApi} />}
          {tab === 'lines' && <LinesTab state={state} patch={patch} toastApi={toastApi} />}
          {tab === 'waves' && <WavesTab state={state} patch={patch} toastApi={toastApi} />}
          {tab === 'geometric' && <GeometricTab state={state} patch={patch} toastApi={toastApi} />}
          {tab === 'checkerboard' && <CheckerboardTab state={state} patch={patch} toastApi={toastApi} />}
          {tab === 'graphpaper' && <GraphPaperTab state={state} patch={patch} toastApi={toastApi} />}
        </div>
      </div>
    </LabShell>
  )
}
