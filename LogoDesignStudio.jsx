import { useMemo, useRef, useState } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import { useProgress } from './ProgressContext.jsx'
import { useLabToast } from './labs/useLabToast.js'
import LabToast from './labs/LabToast.jsx'
import NotFound from './NotFound.jsx'
import {
  makeDefaultElement, makeEmptyRequirement, SELF_SCORE_OPTIONS, LOGO_SUBCAT_SECTION,
} from './logoProject.js'
import {
  CANVAS_SIZE, regularPolygonPoints, trianglePoints, hexToGray, elementCenter, downloadSvg, downloadPngFromSvg,
} from './labs/logoEngine.js'
import { MODULES } from './modules.js'
import { getSubcategoriesByLevel } from './subcategories.js'

// Logo Design Studio — робочий простір за зразком Game Art/UX/Motion
// Studio: один спільний проєкт (LogoProject за :id), усі панелі читають і
// пишуть той самий запис через saveLogoProject({ id, ...patch }).
//
// На відміну від растрового Game Art Studio, "Конструктор" тут — реальні
// SVG-елементи (elements[]): можна додати фігуру чи текст, перетягнути,
// змінити розмір/колір/поворот у панелі властивостей — і експортувати
// результат як справжній .svg чи .png, а не знімок canvas.
//
// Чесна межа: "Кольорові варіанти" й "Перевірка масштабу" рендерять ТІ
// САМІ elements[] з обчисленою трансформацією кольору (та сама формула
// люмінансу, що й у Contrast Lab) — це не три окремі намальовані
// картинки, а чесна перевірка одного реального логотипа.

const TRACKS = getSubcategoriesByLevel('logo-design')

const SECTIONS = [
  { id: 'builder', emoji: '🏗️', label: 'Конструктор' },
  { id: 'variations', emoji: '🎨', label: 'Кольорові варіанти' },
  { id: 'scale', emoji: '🔍', label: 'Перевірка масштабу' },
  { id: 'requirements', emoji: '📋', label: 'Вимоги' },
  { id: 'review', emoji: '🖊️', label: 'Рев’ю' },
  { id: 'versions', emoji: '🕓', label: 'Версії' },
]

const SECTION_HELP = {
  builder: { tip: 'Додавай фігури та текст кнопками зліва над полотном, тягни елемент мишкою, щоб перемістити. Обраний елемент редагується в панелі властивостей праворуч: колір, обвідка, розмір, поворот, для тексту — сам напис і шрифт. Порядок шарів (що намальовано зверху) міняється кнопками ↑/↓ у списку шарів.', criteria: ['Є хоча б один елемент на полотні', 'Логотип впізнаваний навіть як простий силует'] },
  variations: { tip: 'Той самий логотип у чотирьох обов’язкових варіантах: повноколірний, чорний на білому, білий на темному (інверсія) і сірий (реальна люмінансна формула, як у Contrast Lab — не довільне освітлення). Якщо логотип «ламається» в одноколірному варіанті (деталі зливаються чи зникають), це сигнал повернутися в Конструктор і спростити форму.', criteria: ['Логотип залишається впізнаваним у чорно-білому варіанті', 'Усі чотири варіанти перевірено візуально'] },
  scale: { tip: 'Той самий логотип у фіксованих розмірах: 16, 32, 64, 128, 256 пікселів — це реальний тест масштабованості, яким перевіряють, чи виживе логотип як фавікон сайту чи іконка застосунку. Тонкі лінії й дрібний текст, що зникають на 16px, — ознака того, що деталізацію варто спростити.', criteria: ['Логотип розпізнається навіть на найменшому розмірі 16px'] },
  requirements: { tip: 'Занеси технічне завдання чи бриф клієнта як чекліст: цільова аудієнція, обмеження кольору, де використовується логотип, дедлайн.', criteria: ['Є щонайменше 3 пункти вимог'] },
  review: { tip: 'Пройди рубрику чесної самооцінки логотипа й залиш коментар із поясненням — студія не вигадує оцінку автоматично.', criteria: ['Є самооцінка щонайменше по половині критеріїв'] },
  versions: { tip: '«Зберегти версію» робить реальний знімок поточного стану elements[] з міткою часу — на відміну від вигаданих v1.0/v2.0, тут з’являються лише версії, які ти сам створив.', criteria: ['Збережено хоча б одну версію перед здачею роботи'] },
}

const SHAPE_BUTTONS = [
  { type: 'circle', emoji: '⭕', label: 'Коло' },
  { type: 'rect', emoji: '▭', label: 'Прямокутник' },
  { type: 'triangle', emoji: '▲', label: 'Трикутник' },
  { type: 'polygon', emoji: '⬡', label: 'Багатокутник' },
  { type: 'line', emoji: '➖', label: 'Лінія' },
  { type: 'text', emoji: '🔤', label: 'Текст' },
]

function scorePct(score) {
  if (score === 'Відмінно') return 100
  if (score === 'Непогано') return 60
  if (score === 'Потребує роботи') return 25
  return 0
}

function deriveStatus(project) {
  if (project.versions.length > 0) return '🕓 Версію збережено'
  if (project.elements.length > 0) return '✏️ У роботі'
  return '🆕 Новий проєкт'
}

// Колір елемента у заданому режимі перегляду — повертає undefined для
// 'none', щоб не малювати фарбу там, де елемент її свідомо не має.
function tintColor(value, mode) {
  if (!value || value === 'none') return 'none'
  if (mode === 'color') return value
  if (mode === 'dark') return '#1a1a1a'
  if (mode === 'light') return '#ffffff'
  if (mode === 'gray') return hexToGray(value)
  return value
}

function ShapeNode({ el, mode, interactive, selected, onDown }) {
  const fill = tintColor(el.fill, mode)
  const stroke = tintColor(el.stroke, mode)
  const { cx, cy } = elementCenter(el)
  const transform = el.rotation ? `rotate(${el.rotation} ${cx} ${cy})` : undefined
  const common = {
    opacity: el.opacity,
    transform,
    onPointerDown: interactive ? (e) => onDown(e, el.id) : undefined,
    style: interactive ? { cursor: 'move' } : undefined,
  }
  let shape = null
  if (el.type === 'circle') {
    shape = <ellipse cx={cx} cy={cy} rx={el.width / 2} ry={el.height / 2} fill={fill} stroke={stroke} strokeWidth={el.strokeWidth} {...common} />
  } else if (el.type === 'rect') {
    shape = <rect x={el.x} y={el.y} width={el.width} height={el.height} rx={el.rx || 0} fill={fill} stroke={stroke} strokeWidth={el.strokeWidth} {...common} />
  } else if (el.type === 'triangle') {
    shape = <polygon points={trianglePoints(cx, cy, el.width, el.height)} fill={fill} stroke={stroke} strokeWidth={el.strokeWidth} {...common} />
  } else if (el.type === 'polygon') {
    shape = <polygon points={regularPolygonPoints(cx, cy, el.width, el.height, el.sides)} fill={fill} stroke={stroke} strokeWidth={el.strokeWidth} {...common} />
  } else if (el.type === 'line') {
    shape = <line x1={el.x} y1={el.y} x2={el.x + el.width} y2={el.y + el.height} stroke={stroke === 'none' ? (fill === 'none' ? '#1a1a1a' : fill) : stroke} strokeWidth={el.strokeWidth || 4} fill="none" {...common} />
  } else if (el.type === 'text') {
    shape = <text x={el.x} y={el.y + el.fontSize} fontFamily={el.fontFamily} fontWeight={el.fontWeight} fontSize={el.fontSize} fill={fill} {...common}>{el.text}</text>
  }
  if (!interactive || !selected) return shape
  const b = { left: el.x, top: el.y, right: el.x + el.width, bottom: el.y + (el.type === 'line' ? (el.strokeWidth || 1) : el.height) }
  return (
    <g>
      {shape}
      <rect x={b.left - 4} y={b.top - 4} width={b.right - b.left + 8} height={b.bottom - b.top + 8} fill="none" stroke="#2e6dff" strokeDasharray="4 3" strokeWidth={1.5} pointerEvents="none" />
    </g>
  )
}

function LogoCanvas({ project, onPatch, canvasBg, selectedId, setSelectedId }) {
  const svgRef = useRef(null)
  const dragRef = useRef(null)

  function updateElement(id, patch) {
    onPatch({ elements: project.elements.map((e) => (e.id === id ? { ...e, ...patch } : e)) })
  }

  function onDown(e, id) {
    e.stopPropagation()
    setSelectedId(id)
    const el = project.elements.find((x) => x.id === id)
    const rect = svgRef.current.getBoundingClientRect()
    const scale = CANVAS_SIZE / rect.width
    dragRef.current = { id, startX: e.clientX, startY: e.clientY, elX: el.x, elY: el.y, scale }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }
  function onMove(e) {
    const d = dragRef.current
    if (!d) return
    const dx = (e.clientX - d.startX) * d.scale
    const dy = (e.clientY - d.startY) * d.scale
    updateElement(d.id, { x: Math.round(d.elX + dx), y: Math.round(d.elY + dy) })
  }
  function onUp() {
    dragRef.current = null
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}
      className="logo-canvas-svg"
      onPointerDown={() => setSelectedId(null)}
    >
      <rect x={0} y={0} width={CANVAS_SIZE} height={CANVAS_SIZE} fill={canvasBg} />
      {project.elements.map((el) => (
        <ShapeNode key={el.id} el={el} mode="color" interactive selected={el.id === selectedId} onDown={onDown} />
      ))}
    </svg>
  )
}

function StaticLogoPreview({ project, mode, size, bg }) {
  return (
    <svg viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`} width={size} height={size} className="logo-static-svg">
      <rect x={0} y={0} width={CANVAS_SIZE} height={CANVAS_SIZE} fill={bg} />
      {project.elements.map((el) => <ShapeNode key={el.id} el={el} mode={mode} interactive={false} />)}
    </svg>
  )
}

function PropertyField({ label, children }) {
  return <label className="gfx-field logo-prop-field">{label}{children}</label>
}

function BuilderSection({ project, onPatch, toastApi }) {
  const [selectedId, setSelectedId] = useState(null)
  const exportRef = useRef(null)
  const selected = project.elements.find((e) => e.id === selectedId) || null

  function addShape(type) {
    const el = makeDefaultElement(type, 140 + Math.random() * 80, 140 + Math.random() * 80)
    onPatch({ elements: [...project.elements, el] })
    setSelectedId(el.id)
  }
  function update(patch) {
    onPatch({ elements: project.elements.map((e) => (e.id === selected.id ? { ...e, ...patch } : e)) })
  }
  function remove(id) {
    onPatch({ elements: project.elements.filter((e) => e.id !== id) })
    if (selectedId === id) setSelectedId(null)
  }
  function duplicate(id) {
    const src = project.elements.find((e) => e.id === id)
    if (!src) return
    const copy = makeDefaultElement(src.type)
    const next = { ...copy, ...src, id: copy.id, x: src.x + 16, y: src.y + 16 }
    onPatch({ elements: [...project.elements, next] })
    setSelectedId(next.id)
  }
  function reorder(id, dir) {
    const idx = project.elements.findIndex((e) => e.id === id)
    const j = idx + dir
    if (j < 0 || j >= project.elements.length) return
    const next = [...project.elements]
    ;[next[idx], next[j]] = [next[j], next[idx]]
    onPatch({ elements: next })
  }

  return (
    <div className="branding-form">
      <p className="cl-section-title">Конструктор логотипа</p>
      <p className="cl-tab-desc">Справжній векторний (SVG) редактор форм і тексту. Жоден шар не "намальований растром" — тому результат можна чесно експортувати як масштабований .svg.</p>

      <div className="cl-btn-row logo-shape-row">
        {SHAPE_BUTTONS.map((s) => (
          <button key={s.type} type="button" className="cl-mini-btn" onClick={() => addShape(s.type)}>{s.emoji} {s.label}</button>
        ))}
      </div>

      <div className="logo-builder-layout">
        <div className="logo-canvas-wrap">
          <label className="logo-bg-row">
            Фон полотна
            <input type="color" value={project.canvasBg} onChange={(e) => onPatch({ canvasBg: e.target.value })} />
          </label>
          <LogoCanvas project={project} onPatch={onPatch} canvasBg={project.canvasBg} selectedId={selectedId} setSelectedId={setSelectedId} />
          <svg ref={exportRef} style={{ display: 'none' }} />
          <div className="cl-btn-row" style={{ marginTop: 10 }}>
            <button className="harmony-btn" onClick={() => {
              const svgEl = document.querySelector('.logo-canvas-svg')
              if (svgEl) { downloadSvg(svgEl, (project.name || 'logo') + '.svg'); toastApi.show('✓ SVG завантажено') }
            }}>⬇️ Експорт SVG</button>
            <button className="harmony-btn" onClick={() => {
              const svgEl = document.querySelector('.logo-canvas-svg')
              if (svgEl) { downloadPngFromSvg(svgEl, 512, (project.name || 'logo') + '.png'); toastApi.show('✓ PNG завантажено') }
            }}>⬇️ Експорт PNG</button>
          </div>
        </div>

        <div className="logo-layers-wrap">
          <p className="cl-section-title">Шари ({project.elements.length})</p>
          {project.elements.length === 0 && <p className="cl-tab-desc">Ще немає жодного елемента — додай фігуру чи текст кнопкою вище.</p>}
          <div className="ux-list-editor">
            {project.elements.map((el) => (
              <div key={el.id} className="ux-list-row">
                <button type="button" className={'cl-mini-btn' + (el.id === selectedId ? ' active' : '')} style={{ flex: 1, textAlign: 'left' }} onClick={() => setSelectedId(el.id)}>
                  {SHAPE_BUTTONS.find((s) => s.type === el.type)?.emoji} {el.type === 'text' ? (el.text || 'текст') : SHAPE_BUTTONS.find((s) => s.type === el.type)?.label}
                </button>
                <button type="button" className="cl-mini-btn" onClick={() => reorder(el.id, 1)} title="На шар вище">↑</button>
                <button type="button" className="cl-mini-btn" onClick={() => reorder(el.id, -1)} title="На шар нижче">↓</button>
                <button type="button" className="cl-mini-btn" onClick={() => duplicate(el.id)} title="Дублювати">⧉</button>
                <button type="button" className="cl-mini-btn" onClick={() => remove(el.id)} title="Видалити">×</button>
              </div>
            ))}
          </div>
        </div>

        <div className="logo-props-wrap">
          <p className="cl-section-title">Властивості</p>
          {!selected && <p className="cl-tab-desc">Обери елемент на полотні чи в списку шарів.</p>}
          {selected && (
            <div className="branding-name-card">
              {selected.type === 'text' && (
                <>
                  <PropertyField label="Текст">
                    <input className="cl-text-input" value={selected.text} onChange={(e) => update({ text: e.target.value })} />
                  </PropertyField>
                  <PropertyField label="Шрифт">
                    <select className="cl-text-input" value={selected.fontFamily} onChange={(e) => update({ fontFamily: e.target.value })}>
                      <option value="Arial, sans-serif">Arial (гротеск)</option>
                      <option value="Georgia, serif">Georgia (антиква)</option>
                      <option value="'Courier New', monospace">Courier New (моноширинний)</option>
                      <option value="'Brush Script MT', cursive">Brush Script (рукописний)</option>
                    </select>
                  </PropertyField>
                  <PropertyField label={`Жирність: ${selected.fontWeight}`}>
                    <input type="range" min="300" max="900" step="100" value={selected.fontWeight} onChange={(e) => update({ fontWeight: Number(e.target.value) })} />
                  </PropertyField>
                  <PropertyField label={`Розмір шрифту: ${selected.fontSize}px`}>
                    <input type="range" min="12" max="96" value={selected.fontSize} onChange={(e) => update({ fontSize: Number(e.target.value) })} />
                  </PropertyField>
                </>
              )}
              {selected.type === 'polygon' && (
                <PropertyField label={`Кутів: ${selected.sides}`}>
                  <input type="range" min="3" max="12" value={selected.sides} onChange={(e) => update({ sides: Number(e.target.value) })} />
                </PropertyField>
              )}
              {selected.type === 'rect' && (
                <PropertyField label={`Округлення кутів: ${selected.rx}`}>
                  <input type="range" min="0" max={Math.min(selected.width, selected.height) / 2} value={selected.rx} onChange={(e) => update({ rx: Number(e.target.value) })} />
                </PropertyField>
              )}
              <PropertyField label={`Ширина: ${Math.round(selected.width)}`}>
                <input type="range" min="10" max="360" value={selected.width} onChange={(e) => update({ width: Number(e.target.value) })} />
              </PropertyField>
              {selected.type !== 'line' && (
                <PropertyField label={`Висота: ${Math.round(selected.height)}`}>
                  <input type="range" min="10" max="360" value={selected.height} onChange={(e) => update({ height: Number(e.target.value) })} />
                </PropertyField>
              )}
              <PropertyField label={`Поворот: ${selected.rotation}°`}>
                <input type="range" min="0" max="360" value={selected.rotation} onChange={(e) => update({ rotation: Number(e.target.value) })} />
              </PropertyField>
              <PropertyField label={`Прозорість: ${Math.round(selected.opacity * 100)}%`}>
                <input type="range" min="0.1" max="1" step="0.05" value={selected.opacity} onChange={(e) => update({ opacity: Number(e.target.value) })} />
              </PropertyField>
              {selected.type !== 'line' && (
                <PropertyField label="Колір заповнення">
                  <div className="gfx-row">
                    <input type="color" value={selected.fill === 'none' ? '#1a1a1a' : selected.fill} onChange={(e) => update({ fill: e.target.value })} />
                    <button type="button" className="cl-mini-btn" onClick={() => update({ fill: selected.fill === 'none' ? '#1a1a1a' : 'none' })}>{selected.fill === 'none' ? 'Додати заповнення' : 'Без заповнення'}</button>
                  </div>
                </PropertyField>
              )}
              <PropertyField label="Колір обвідки">
                <div className="gfx-row">
                  <input type="color" value={selected.stroke === 'none' ? '#1a1a1a' : selected.stroke} onChange={(e) => update({ stroke: e.target.value })} />
                  <button type="button" className="cl-mini-btn" onClick={() => update({ stroke: selected.stroke === 'none' ? '#1a1a1a' : 'none' })}>{selected.stroke === 'none' ? 'Додати обвідку' : 'Без обвідки'}</button>
                </div>
              </PropertyField>
              {selected.stroke !== 'none' && (
                <PropertyField label={`Товщина обвідки: ${selected.strokeWidth}`}>
                  <input type="range" min="1" max="20" value={selected.strokeWidth} onChange={(e) => update({ strokeWidth: Number(e.target.value) })} />
                </PropertyField>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function VariationsSection({ project }) {
  const modes = [
    { key: 'color', label: 'Повноколірний', bg: '#ffffff' },
    { key: 'dark', label: 'Чорний на білому', bg: '#ffffff' },
    { key: 'light', label: 'Білий на темному (інверсія)', bg: '#1a1a1a' },
    { key: 'gray', label: 'Сірий (люмінанс)', bg: '#ffffff' },
  ]
  return (
    <div className="branding-form">
      <p className="cl-section-title">Кольорові варіанти</p>
      <p className="cl-tab-desc">Чотири обов’язкові варіанти того самого логотипа — реальна перевірка, а не три намальовані окремо картинки.</p>
      <div className="logo-variation-grid">
        {modes.map((m) => (
          <div key={m.key} className="logo-variation-card">
            <StaticLogoPreview project={project} mode={m.key} size={160} bg={m.bg} />
            <p className="cl-tab-desc">{m.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

const SCALE_SIZES = [16, 32, 64, 128, 256]

function ScaleSection({ project }) {
  return (
    <div className="branding-form">
      <p className="cl-section-title">Перевірка масштабу</p>
      <p className="cl-tab-desc">Той самий логотип у фіксованих розмірах — реальний тест, чи виживе він як фавікон чи іконка застосунку на найменшому розмірі.</p>
      <div className="logo-scale-row">
        {SCALE_SIZES.map((s) => (
          <div key={s} className="logo-scale-card">
            <div className="logo-scale-frame" style={{ width: Math.max(s, 48), height: Math.max(s, 48) }}>
              <StaticLogoPreview project={project} mode="color" size={s} bg={project.canvasBg} />
            </div>
            <span className="cl-tab-desc">{s}px</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function RequirementsSection({ project, onPatch }) {
  const items = project.requirements
  function commit(next) { onPatch({ requirements: next }) }
  function add() { commit([...items, makeEmptyRequirement()]) }
  function toggle(id) { commit(items.map((it) => (it.id === id ? { ...it, done: !it.done } : it))) }
  function updateText(id, title) { commit(items.map((it) => (it.id === id ? { ...it, title } : it))) }
  function remove(id) { commit(items.filter((it) => it.id !== id)) }
  return (
    <div className="branding-form">
      <p className="cl-section-title">Вимоги проєкту</p>
      <p className="cl-tab-desc">Бриф чи технічне завдання як чекліст: аудієнція, обмеження кольору, де використовується логотип, дедлайн.</p>
      {items.map((it) => (
        <div key={it.id} className="ux-audit-row">
          <label className="ux-audit-check">
            <input type="checkbox" checked={it.done} onChange={() => toggle(it.id)} />
            <input className="cl-text-input" defaultValue={it.title} placeholder="Напр.: працює в один колір, мінімум 32px" onBlur={(e) => { if (e.target.value !== it.title) updateText(it.id, e.target.value) }} />
          </label>
          <button type="button" className="cl-mini-btn" onClick={() => remove(it.id)}>×</button>
        </div>
      ))}
      <button className="harmony-btn" style={{ marginTop: 10 }} onClick={add}>+ Вимога</button>
    </div>
  )
}

function ReviewSection({ project, onPatch }) {
  const r = project.review
  function updateItem(id, patch) {
    onPatch({ review: { ...r, items: r.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) } })
  }
  function addComment() {
    onPatch({ review: { ...r, comments: [...r.comments, { id: crypto.randomUUID(), text: '' }] } })
  }
  function updateComment(id, text) {
    onPatch({ review: { ...r, comments: r.comments.map((c) => (c.id === id ? { ...c, text } : c)) } })
  }
  function removeComment(id) {
    onPatch({ review: { ...r, comments: r.comments.filter((c) => c.id !== id) } })
  }
  return (
    <div className="branding-form">
      <p className="cl-section-title">Рев’ю логотипа</p>
      <p className="cl-tab-desc"><strong>Чесна межа:</strong> це самооцінка й місце для нотаток реального ментора/фідбеку — студія не оцінює художню якість автоматично і не вигадує персону ментора чи бал.</p>
      {r.items.map((it) => (
        <div key={it.id} className="branding-name-card" style={{ marginTop: 10 }}>
          <strong>{it.criterion}</strong>
          <div className="cl-btn-row" style={{ marginTop: 6 }}>
            {SELF_SCORE_OPTIONS.map((opt) => (
              <button key={opt} className={'cl-mini-btn' + (it.selfScore === opt ? ' active' : '')} onClick={() => updateItem(it.id, { selfScore: opt })}>{opt}</button>
            ))}
          </div>
          <input className="cl-text-input" style={{ marginTop: 6 }} defaultValue={it.note} placeholder="Коментар / фідбек ментора" onBlur={(e) => { if (e.target.value !== it.note) updateItem(it.id, { note: e.target.value }) }} />
        </div>
      ))}
      <p className="cl-section-title" style={{ marginTop: 16 }}>Коментарі</p>
      {r.comments.map((c) => (
        <div key={c.id} className="ux-list-row">
          <input className="cl-text-input" defaultValue={c.text} placeholder="Загальний коментар до роботи" onBlur={(e) => { if (e.target.value !== c.text) updateComment(c.id, e.target.value) }} />
          <button type="button" className="cl-mini-btn" onClick={() => removeComment(c.id)}>×</button>
        </div>
      ))}
      <button className="cl-mini-btn" onClick={addComment}>+ Коментар</button>
    </div>
  )
}

function VersionsSection({ project, onPatch, toastApi }) {
  const [label, setLabel] = useState('')
  function saveVersion() {
    const { versions, ...snapshot } = project
    const entry = { id: crypto.randomUUID(), label: label.trim() || `Версія ${project.versions.length + 1}`, savedAt: new Date().toISOString(), snapshot }
    onPatch({ versions: [entry, ...project.versions] })
    setLabel('')
    toastApi.show('✓ Версію збережено')
  }
  function removeVersion(id) {
    onPatch({ versions: project.versions.filter((v) => v.id !== id) })
  }
  return (
    <div className="branding-form">
      <p className="cl-section-title">Версії проєкту</p>
      <p className="cl-tab-desc">Реальні знімки стану логотипа на момент збереження — список порожній, доки ти сам не натиснеш «Зберегти версію».</p>
      <div className="gfx-row">
        <input className="cl-text-input" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Назва версії (необов’язково)" />
        <button className="harmony-btn" onClick={saveVersion}>📌 Зберегти версію</button>
      </div>
      {project.versions.length === 0 && <p className="cl-tab-desc" style={{ marginTop: 12 }}>Ще немає жодної збереженої версії.</p>}
      <div className="ux-list-editor" style={{ marginTop: 12 }}>
        {project.versions.map((v) => (
          <div key={v.id} className="ux-list-row">
            <span className="motion-track-label" style={{ flex: 1, minWidth: 0 }}>{v.label} — {new Date(v.savedAt).toLocaleString('uk-UA')} · {v.snapshot.elements.length} елемент(ів)</span>
            <button type="button" className="cl-mini-btn" onClick={() => removeVersion(v.id)}>×</button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function LogoDesignStudio() {
  const { projectId } = useParams()
  const location = useLocation()
  const { logoProjects, saveLogoProject, completed, xp, level } = useProgress()
  const toastApi = useLabToast()
  const project = logoProjects.find((p) => p.id === projectId)
  const [section, setSection] = useState(location.state?.section || 'builder')
  const [activeTrackId, setActiveTrackId] = useState(() => {
    if (location.state?.subcategory) return location.state.subcategory
    const wanted = location.state?.section || 'builder'
    return TRACKS.find((t) => LOGO_SUBCAT_SECTION[t.id] === wanted)?.id || TRACKS[0]?.id
  })

  const trackLessons = useMemo(
    () => MODULES.filter((m) => m.subcategory === activeTrackId).sort((a, b) => a.id - b.id),
    [activeTrackId]
  )
  const activeTrack = TRACKS.find((t) => t.id === activeTrackId)

  if (!project) return <NotFound />

  function onPatch(patch) {
    saveLogoProject({ id: project.id, ...patch })
  }
  function selectTrack(trackId) {
    setActiveTrackId(trackId)
    setSection(LOGO_SUBCAT_SECTION[trackId] || 'builder')
  }

  const help = SECTION_HELP[section]

  return (
    <div className="branding-studio gfx-studio-wide">
      <div className="dict-breadcrumb">
        <Link to="/academy/logo-design">Logo Design Academy</Link> <span>→</span>
        {activeTrack && <><span>{activeTrack.emoji} {activeTrack.title}</span> <span>→</span></>}
        <span>{project.name}</span>
      </div>
      <div className="gfx-topbar motion-topbar-sticky">
        <input className="cl-text-input" style={{ flex: 1, minWidth: 160 }} defaultValue={project.name} onBlur={(e) => onPatch({ name: e.target.value || 'Новий проєкт логотипа' })} placeholder="Назва проєкту" />
        <span className="gfx-status-pill">{deriveStatus(project)}</span>
        <span className="gfx-xp-pill" title="Загальний прогрес на платформі (усі напрями)">Рівень {level} · {xp} XP</span>
        <button className="harmony-btn" onClick={() => { saveLogoProject(project); toastApi.show('✓ Збережено') }}>💾 Зберегти</button>
        <span className="motion-autosave-note">Кожна зміна зберігається автоматично — ця кнопка лише підтверджує збереження назви проєкту.</span>
      </div>

      <div className="branding-layout">
        <div className="gfx-track-panel">
          <p className="gfx-track-panel-title">Програма курсу · {TRACKS.length} треків</p>
          <div className="gfx-track-list">
            {TRACKS.map((t) => {
              const lessons = MODULES.filter((m) => m.subcategory === t.id)
              const doneCount = lessons.filter((m) => completed[m.id]).length
              const isActive = t.id === activeTrackId
              return (
                <div key={t.id} className="gfx-track-group">
                  <button type="button" className={'gfx-track-row' + (isActive ? ' active' : '')} onClick={() => selectTrack(t.id)}>
                    <span className="gfx-track-emoji">{t.emoji}</span>
                    <span className="gfx-track-info">
                      <span className="gfx-track-name">{t.title}</span>
                      <span className="gfx-track-progress">{doneCount}/{lessons.length} уроків</span>
                    </span>
                  </button>
                  {isActive && (
                    <div className="gfx-lesson-list">
                      {lessons.map((m) => (
                        <Link key={m.id} to={`/module/${m.id}`} className={'gfx-lesson-row' + (completed[m.id] ? ' done' : '')}>
                          <span className="gfx-lesson-dot">{completed[m.id] ? '✓' : '○'}</span>
                          <span className="gfx-lesson-title">{m.title}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="branding-center">
          <div className="gfx-view-tabs">
            {SECTIONS.map((s) => (
              <button key={s.id} className={'gfx-view-tab' + (section === s.id ? ' active' : '')} onClick={() => setSection(s.id)}>
                {s.emoji} {s.label}
              </button>
            ))}
          </div>

          {trackLessons.length > 0 && (
            <div className="gfx-stage-row">
              {trackLessons.map((m) => (
                <Link key={m.id} to={`/module/${m.id}`} className={'gfx-stage-chip' + (completed[m.id] ? ' done' : '')} title={m.title}>
                  {completed[m.id] ? '✓' : '○'} {m.title}
                </Link>
              ))}
            </div>
          )}

          {section === 'builder' && <BuilderSection project={project} onPatch={onPatch} toastApi={toastApi} />}
          {section === 'variations' && <VariationsSection project={project} />}
          {section === 'scale' && <ScaleSection project={project} />}
          {section === 'requirements' && <RequirementsSection project={project} onPatch={onPatch} />}
          {section === 'review' && <ReviewSection project={project} onPatch={onPatch} />}
          {section === 'versions' && <VersionsSection project={project} onPatch={onPatch} toastApi={toastApi} />}
        </div>

        <div className="branding-side">
          <p className="cl-section-title">Підказка</p>
          <p className="cl-tab-desc">{help?.tip}</p>
          {help?.criteria && (
            <>
              <p className="cl-section-title">Критерії перевірки</p>
              <ul className="branding-criteria-list">
                {help.criteria.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </>
          )}

          <div className="gfx-review-mini">
            <p className="cl-section-title">Самооцінка проєкту</p>
            {project.review.items.map((it) => (
              <div key={it.id} className="gfx-score-row">
                <span className="gfx-score-label">{it.criterion}</span>
                <div className="gfx-score-bar"><div className="gfx-score-fill" style={{ width: scorePct(it.selfScore) + '%' }} /></div>
              </div>
            ))}
            <button className="cl-mini-btn" style={{ marginTop: 10 }} onClick={() => setSection('review')}>Повне рев’ю →</button>
            {project.review.comments.length > 0 && (
              <p className="cl-tab-desc" style={{ marginTop: 10 }}>💬 {project.review.comments.length} коментар(ів) — останній: «{project.review.comments[project.review.comments.length - 1].text || '(порожній)'}»</p>
            )}
          </div>
        </div>
      </div>
      <LabToast message={toastApi.toast} />
    </div>
  )
}
