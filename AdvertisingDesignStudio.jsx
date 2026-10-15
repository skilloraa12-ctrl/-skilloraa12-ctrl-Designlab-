import { useMemo, useRef, useState } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import { useProgress } from './ProgressContext.jsx'
import { useLabToast } from './labs/useLabToast.js'
import LabToast from './labs/LabToast.jsx'
import NotFound from './NotFound.jsx'
import {
  AD_SIZES, makeDefaultElement, makeEmptyRequirement, SELF_SCORE_OPTIONS, AD_SUBCAT_SECTION,
} from './adProject.js'
import { downloadSvg, downloadPngFromSvg } from './labs/logoEngine.js'
import { MODULES } from './modules.js'
import { getSubcategoriesByLevel } from './subcategories.js'

// Advertising Design Studio — робочий простір за зразком Logo Design/
// Game Art Studio: один спільний проєкт (AdProject за :id), усі панелі
// читають і пишуть той самий запис через saveAdProject({ id, ...patch }).
//
// На відміну від логотипа, рекламне оголошення завжди прив'язане до
// конкретного стандартного формату (adSize — банер, соцмережі, друк,
// OOH): «Конструктор» будує композицію саме в рамці обраного формату,
// а «Перевірка форматів» чесно показує ТУ САМУ композицію (без
// автоматичної адаптації) у рамках інших стандартних розмірів — це
// навмисно: демонструє студенту реальну проблему "один банер не working
// automatically в усіх розмірах", яку вирішують створенням окремої
// версії під кожен формат, а не вигаданим авто-fit.
//
// Чесна межа: «A/B-варіанти» — реальні збережені знімки композиції
// (variants[]), які студент сам створює кнопкою «Зберегти варіант»;
// студія не вигадує статистику кліків чи конверсії.

const TRACKS = getSubcategoriesByLevel('advertising-design')

const SECTIONS = [
  { id: 'builder', emoji: '🏗️', label: 'Конструктор' },
  { id: 'formats', emoji: '📐', label: 'Перевірка форматів' },
  { id: 'variants', emoji: '🔀', label: 'A/B-варіанти' },
  { id: 'requirements', emoji: '📋', label: 'Вимоги' },
  { id: 'review', emoji: '🖊️', label: 'Рев’ю' },
  { id: 'versions', emoji: '🕓', label: 'Версії' },
]

const SECTION_HELP = {
  builder: { tip: 'Обери формат оголошення вгорі, додавай заголовок/текст/CTA/фігури кнопками над полотном, тягни елемент мишкою, щоб перемістити. Обраний елемент редагується в панелі властивостей праворуч.', criteria: ['Є хоча б заголовок і CTA на полотні', 'Композиція вкладається в рамку формату без критичного обрізання'] },
  formats: { tip: 'Той самий банер, вставлений у рамки інших стандартних розмірів БЕЗ автоматичної адаптації — чесно показує, що один розмір рідко підходить всюди. Якщо щось критично обрізається чи зникає, твоя задача на практиці — створити окрему версію композиції під цей формат (новий проєкт з іншим Форматом), а не сподіватися на авто-fit.', criteria: ['Перевірено хоча б 3 різні формати', 'Зрозуміло, які формати потребують окремої версії композиції'] },
  variants: { tip: '«Зберегти варіант» робить реальний знімок поточної композиції під міткою — для порівняння кількох версій одного банера (A/B), наприклад різний заголовок чи колір CTA. Тут немає вигаданої статистики кліків — лише порівняння самих композицій.', criteria: ['Збережено щонайменше 2 варіанти для порівняння'] },
  requirements: { tip: 'Занеси бриф чи технічне завдання кампанії як чекліст: цільова аудіенція, обов’язкові елементи, дедлайн, обмеження бренду.', criteria: ['Є щонайменше 3 пункти вимог'] },
  review: { tip: 'Пройди рубрику чесної самооцінки оголошення й залиш коментар із поясненням.', criteria: ['Є самооцінка щонайменше по половині критеріїв'] },
  versions: { tip: '«Зберегти версію» робить реальний знімок поточного стану elements[] з міткою часу.', criteria: ['Збережено хоча б одну версію перед здачею роботи'] },
}

const ELEMENT_BUTTONS = [
  { type: 'headline', emoji: '🔤', label: 'Заголовок' },
  { type: 'body', emoji: '📝', label: 'Текст' },
  { type: 'cta', emoji: '🖱️', label: 'CTA-кнопка' },
  { type: 'shape', emoji: '◻️', label: 'Фігура' },
  { type: 'logoMark', emoji: '🔵', label: 'Плашка логотипа' },
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

function getAdSize(key) {
  return AD_SIZES.find((s) => s.key === key) || AD_SIZES[0]
}

function ElementNode({ el, interactive, selected, onDown }) {
  const transform = el.rotation ? `rotate(${el.rotation} ${el.x + el.width / 2} ${el.y + el.height / 2})` : undefined
  const common = {
    opacity: el.opacity,
    transform,
    onPointerDown: interactive ? (e) => onDown(e, el.id) : undefined,
    style: interactive ? { cursor: 'move' } : undefined,
  }
  let node = null
  if (el.type === 'headline' || el.type === 'body') {
    node = (
      <text x={el.x} y={el.y + el.fontSize} fontFamily={el.fontFamily} fontWeight={el.fontWeight} fontSize={el.fontSize} fill={el.fill} {...common}>
        {el.text}
      </text>
    )
  } else if (el.type === 'cta') {
    node = (
      <g {...common}>
        <rect x={el.x} y={el.y} width={el.width} height={el.height} rx={el.height / 2} fill={el.ctaBg} />
        <text x={el.x + el.width / 2} y={el.y + el.height / 2 + el.fontSize / 3} textAnchor="middle" fontFamily={el.fontFamily} fontWeight={el.fontWeight} fontSize={el.fontSize} fill={el.fill}>
          {el.text}
        </text>
      </g>
    )
  } else if (el.type === 'shape' || el.type === 'logoMark') {
    if (el.shapeType === 'circle') {
      node = <ellipse cx={el.x + el.width / 2} cy={el.y + el.height / 2} rx={el.width / 2} ry={el.height / 2} fill={el.fill} stroke={el.stroke} strokeWidth={el.strokeWidth} {...common} />
    } else {
      node = <rect x={el.x} y={el.y} width={el.width} height={el.height} fill={el.fill} stroke={el.stroke} strokeWidth={el.strokeWidth} {...common} />
    }
  }
  if (!interactive || !selected) return node
  return (
    <g>
      {node}
      <rect x={el.x - 4} y={el.y - 4} width={el.width + 8} height={el.height + 8} fill="none" stroke="#2e6dff" strokeDasharray="4 3" strokeWidth={1.5} pointerEvents="none" />
    </g>
  )
}

function AdCanvas({ project, onPatch, selectedId, setSelectedId }) {
  const svgRef = useRef(null)
  const dragRef = useRef(null)
  const size = getAdSize(project.adSize)

  function updateElement(id, patch) {
    onPatch({ elements: project.elements.map((e) => (e.id === id ? { ...e, ...patch } : e)) })
  }
  function onDown(e, id) {
    e.stopPropagation()
    setSelectedId(id)
    const el = project.elements.find((x) => x.id === id)
    const rect = svgRef.current.getBoundingClientRect()
    const scale = size.w / rect.width
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
      viewBox={`0 0 ${size.w} ${size.h}`}
      className="ad-canvas-svg"
      style={{ aspectRatio: `${size.w} / ${size.h}` }}
      onPointerDown={() => setSelectedId(null)}
    >
      <rect x={0} y={0} width={size.w} height={size.h} fill={project.canvasBg} />
      {project.elements.map((el) => (
        <ElementNode key={el.id} el={el} interactive selected={el.id === selectedId} onDown={onDown} />
      ))}
    </svg>
  )
}

function StaticAdPreview({ project, targetSize, maxDim = 180 }) {
  const scale = Math.min(maxDim / targetSize.w, maxDim / targetSize.h, 1)
  return (
    <svg viewBox={`0 0 ${targetSize.w} ${targetSize.h}`} width={targetSize.w * scale} height={targetSize.h * scale} className="ad-static-svg">
      <rect x={0} y={0} width={targetSize.w} height={targetSize.h} fill={project.canvasBg} />
      {project.elements.map((el) => <ElementNode key={el.id} el={el} interactive={false} />)}
    </svg>
  )
}

function PropertyField({ label, children }) {
  return <label className="gfx-field logo-prop-field">{label}{children}</label>
}

function BuilderSection({ project, onPatch, toastApi }) {
  const [selectedId, setSelectedId] = useState(null)
  const selected = project.elements.find((e) => e.id === selectedId) || null
  const size = getAdSize(project.adSize)

  function addElement(type) {
    const el = makeDefaultElement(type, 20 + Math.random() * 40, 20 + Math.random() * 40)
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
      <p className="cl-section-title">Конструктор оголошення</p>
      <p className="cl-tab-desc">Композиція будується всередині рамки обраного формату — зміна формату одразу показує, чи вміщається поточний макет у новий розмір.</p>

      <PropertyField label="Формат оголошення">
        <select className="cl-text-input" value={project.adSize} onChange={(e) => onPatch({ adSize: e.target.value })}>
          {AD_SIZES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
      </PropertyField>

      <div className="cl-btn-row logo-shape-row">
        {ELEMENT_BUTTONS.map((b) => (
          <button key={b.type} type="button" className="cl-mini-btn" onClick={() => addElement(b.type)}>{b.emoji} {b.label}</button>
        ))}
      </div>

      <div className="logo-builder-layout">
        <div className="logo-canvas-wrap">
          <label className="logo-bg-row">
            Фон полотна
            <input type="color" value={project.canvasBg} onChange={(e) => onPatch({ canvasBg: e.target.value })} />
          </label>
          <AdCanvas project={project} onPatch={onPatch} selectedId={selectedId} setSelectedId={setSelectedId} />
          <div className="cl-btn-row" style={{ marginTop: 10 }}>
            <button className="harmony-btn" onClick={() => {
              const svgEl = document.querySelector('.ad-canvas-svg')
              if (svgEl) { downloadSvg(svgEl, (project.name || 'ad') + '.svg'); toastApi.show('✓ SVG завантажено') }
            }}>⬇️ Експорт SVG</button>
            <button className="harmony-btn" onClick={() => {
              const svgEl = document.querySelector('.ad-canvas-svg')
              if (svgEl) { downloadPngFromSvg(svgEl, size.w, (project.name || 'ad') + '.png'); toastApi.show('✓ PNG завантажено') }
            }}>⬇️ Експорт PNG</button>
          </div>
        </div>

        <div className="logo-layers-wrap">
          <p className="cl-section-title">Шари ({project.elements.length})</p>
          {project.elements.length === 0 && <p className="cl-tab-desc">Ще немає жодного елемента.</p>}
          <div className="ux-list-editor">
            {project.elements.map((el) => (
              <div key={el.id} className="ux-list-row">
                <button type="button" className={'cl-mini-btn' + (el.id === selectedId ? ' active' : '')} style={{ flex: 1, textAlign: 'left' }} onClick={() => setSelectedId(el.id)}>
                  {ELEMENT_BUTTONS.find((b) => b.type === el.type)?.emoji} {el.text || ELEMENT_BUTTONS.find((b) => b.type === el.type)?.label}
                </button>
                <button type="button" className="cl-mini-btn" onClick={() => reorder(el.id, 1)} title="На шар вище">↑</button>
                <button type="button" className="cl-mini-btn" onClick={() => reorder(el.id, -1)} title="На шар нижче">↓</button>
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
              {(selected.type === 'headline' || selected.type === 'body' || selected.type === 'cta') && (
                <PropertyField label="Текст">
                  <input className="cl-text-input" value={selected.text} onChange={(e) => update({ text: e.target.value })} />
                </PropertyField>
              )}
              {selected.type === 'cta' && (
                <PropertyField label="Колір кнопки">
                  <input type="color" value={selected.ctaBg} onChange={(e) => update({ ctaBg: e.target.value })} />
                </PropertyField>
              )}
              {(selected.type === 'headline' || selected.type === 'body' || selected.type === 'cta') && (
                <>
                  <PropertyField label={`Розмір шрифту: ${selected.fontSize}px`}>
                    <input type="range" min="10" max="64" value={selected.fontSize} onChange={(e) => update({ fontSize: Number(e.target.value) })} />
                  </PropertyField>
                  <PropertyField label={`Жирність: ${selected.fontWeight}`}>
                    <input type="range" min="300" max="900" step="100" value={selected.fontWeight} onChange={(e) => update({ fontWeight: Number(e.target.value) })} />
                  </PropertyField>
                  <PropertyField label="Колір тексту">
                    <input type="color" value={selected.fill} onChange={(e) => update({ fill: e.target.value })} />
                  </PropertyField>
                </>
              )}
              {(selected.type === 'shape' || selected.type === 'logoMark') && (
                <>
                  <PropertyField label="Форма">
                    <div className="cl-btn-row">
                      <button type="button" className={'cl-mini-btn' + (selected.shapeType === 'rect' ? ' active' : '')} onClick={() => update({ shapeType: 'rect' })}>Прямокутник</button>
                      <button type="button" className={'cl-mini-btn' + (selected.shapeType === 'circle' ? ' active' : '')} onClick={() => update({ shapeType: 'circle' })}>Коло</button>
                    </div>
                  </PropertyField>
                  <PropertyField label="Колір">
                    <input type="color" value={selected.fill} onChange={(e) => update({ fill: e.target.value })} />
                  </PropertyField>
                </>
              )}
              <PropertyField label={`Ширина: ${Math.round(selected.width)}`}>
                <input type="range" min="10" max={size.w} value={selected.width} onChange={(e) => update({ width: Number(e.target.value) })} />
              </PropertyField>
              <PropertyField label={`Висота: ${Math.round(selected.height)}`}>
                <input type="range" min="10" max={size.h} value={selected.height} onChange={(e) => update({ height: Number(e.target.value) })} />
              </PropertyField>
              <PropertyField label={`Поворот: ${selected.rotation}°`}>
                <input type="range" min="0" max="360" value={selected.rotation} onChange={(e) => update({ rotation: Number(e.target.value) })} />
              </PropertyField>
              <PropertyField label={`Прозорість: ${Math.round(selected.opacity * 100)}%`}>
                <input type="range" min="0.1" max="1" step="0.05" value={selected.opacity} onChange={(e) => update({ opacity: Number(e.target.value) })} />
              </PropertyField>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function FormatsSection({ project }) {
  return (
    <div className="branding-form">
      <p className="cl-section-title">Перевірка форматів</p>
      <p className="cl-tab-desc">Та сама композиція (без автоматичної адаптації) у рамках інших стандартних розмірів — реальна перевірка, чи витримує макет зміну формату, а не вигадане авто-масштабування.</p>
      <div className="logo-variation-grid">
        {AD_SIZES.map((s) => (
          <div key={s.key} className="logo-variation-card">
            <StaticAdPreview project={project} targetSize={s} />
            <p className="cl-tab-desc">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function VariantsSection({ project, onPatch, toastApi }) {
  const [label, setLabel] = useState('')
  function saveVariant() {
    const entry = { id: crypto.randomUUID(), label: label.trim() || `Варіант ${project.variants.length + 1}`, savedAt: new Date().toISOString(), elements: project.elements, canvasBg: project.canvasBg, adSize: project.adSize }
    onPatch({ variants: [entry, ...project.variants] })
    setLabel('')
    toastApi.show('✓ Варіант збережено')
  }
  function removeVariant(id) {
    onPatch({ variants: project.variants.filter((v) => v.id !== id) })
  }
  return (
    <div className="branding-form">
      <p className="cl-section-title">A/B-варіанти</p>
      <p className="cl-tab-desc">Реальні знімки поточної композиції для порівняння — наприклад, різний заголовок чи колір CTA. Без вигаданої статистики кліків чи конверсії.</p>
      <div className="gfx-row">
        <input className="cl-text-input" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Назва варіанту (напр.: синій CTA)" />
        <button className="harmony-btn" onClick={saveVariant}>📌 Зберегти варіант</button>
      </div>
      {project.variants.length === 0 && <p className="cl-tab-desc" style={{ marginTop: 12 }}>Ще немає жодного збереженого варіанту.</p>}
      <div className="logo-variation-grid" style={{ marginTop: 12 }}>
        {project.variants.map((v) => (
          <div key={v.id} className="logo-variation-card">
            <StaticAdPreview project={{ ...project, elements: v.elements, canvasBg: v.canvasBg }} targetSize={getAdSize(v.adSize)} />
            <p className="cl-tab-desc">{v.label}</p>
            <button type="button" className="cl-mini-btn" onClick={() => removeVariant(v.id)}>× Видалити</button>
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
      <p className="cl-tab-desc">Бриф чи технічне завдання кампанії як чекліст: аудієнція, обов’язкові елементи, дедлайн, обмеження бренду.</p>
      {items.map((it) => (
        <div key={it.id} className="ux-audit-row">
          <label className="ux-audit-check">
            <input type="checkbox" checked={it.done} onChange={() => toggle(it.id)} />
            <input className="cl-text-input" defaultValue={it.title} placeholder="Напр.: обов'язковий логотип у правому верхньому куті" onBlur={(e) => { if (e.target.value !== it.title) updateText(it.id, e.target.value) }} />
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
      <p className="cl-section-title">Рев’ю оголошення</p>
      <p className="cl-tab-desc"><strong>Чесна межа:</strong> це самооцінка й місце для нотаток реального ментора/фідбеку — студія не оцінює ефективність реклами автоматично й не вигадує статистику кліків.</p>
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
      <p className="cl-tab-desc">Реальні знімки стану оголошення на момент збереження.</p>
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

export default function AdvertisingDesignStudio() {
  const { projectId } = useParams()
  const location = useLocation()
  const { adProjects, saveAdProject, completed, xp, level } = useProgress()
  const toastApi = useLabToast()
  const project = adProjects.find((p) => p.id === projectId)
  const [section, setSection] = useState(location.state?.section || 'builder')
  const [activeTrackId, setActiveTrackId] = useState(() => {
    if (location.state?.subcategory) return location.state.subcategory
    const wanted = location.state?.section || 'builder'
    return TRACKS.find((t) => AD_SUBCAT_SECTION[t.id] === wanted)?.id || TRACKS[0]?.id
  })

  const trackLessons = useMemo(
    () => MODULES.filter((m) => m.subcategory === activeTrackId).sort((a, b) => a.id - b.id),
    [activeTrackId]
  )
  const activeTrack = TRACKS.find((t) => t.id === activeTrackId)

  if (!project) return <NotFound />

  function onPatch(patch) {
    saveAdProject({ id: project.id, ...patch })
  }
  function selectTrack(trackId) {
    setActiveTrackId(trackId)
    setSection(AD_SUBCAT_SECTION[trackId] || 'builder')
  }

  const help = SECTION_HELP[section]

  return (
    <div className="branding-studio gfx-studio-wide">
      <div className="dict-breadcrumb">
        <Link to="/academy/advertising-design">Advertising Design Academy</Link> <span>→</span>
        {activeTrack && <><span>{activeTrack.emoji} {activeTrack.title}</span> <span>→</span></>}
        <span>{project.name}</span>
      </div>
      <div className="gfx-topbar motion-topbar-sticky">
        <input className="cl-text-input" style={{ flex: 1, minWidth: 160 }} defaultValue={project.name} onBlur={(e) => onPatch({ name: e.target.value || 'Новий рекламний проєкт' })} placeholder="Назва проєкту" />
        <span className="gfx-status-pill">{deriveStatus(project)}</span>
        <span className="gfx-xp-pill" title="Загальний прогрес на платформі (усі напрями)">Рівень {level} · {xp} XP</span>
        <button className="harmony-btn" onClick={() => { saveAdProject(project); toastApi.show('✓ Збережено') }}>💾 Зберегти</button>
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
          {section === 'formats' && <FormatsSection project={project} />}
          {section === 'variants' && <VariantsSection project={project} onPatch={onPatch} toastApi={toastApi} />}
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
