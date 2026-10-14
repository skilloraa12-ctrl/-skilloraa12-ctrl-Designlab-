import { useEffect, useRef, useState } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import { useProgress } from './ProgressContext.jsx'
import { useLabToast } from './labs/useLabToast.js'
import LabToast from './labs/LabToast.jsx'
import NotFound from './NotFound.jsx'
import { UX_STAGES } from './uxProject.js'
import {
  WF_TYPES, defaultWfObject, wfLabel, drawWfObject, wfHitTest, wfHitHandle, wfDrawHandles, wfResize,
  FLOW_TYPES, defaultFlowBlock, flowHitTest, drawFlowBlock, drawFlowEdge, validateFlow,
} from './uxEngine.js'

// UX Design Studio — робочий простір за зразком Motion/Branding Studio:
// ліва панель етапів, центральна робоча область (залежить від етапу),
// права панель підказки. Один проєкт за раз (UxProject за :id), усі
// етапи пишуть у той самий спільний запис.

const STAGE_HELP = {
  research: { tip: 'Опиши мету дослідження, сформулюй запитання, додай нотатки й виведи з них інсайти. Дані тут навчальні — не видавай їх за реальне дослідження.', criteria: ['Є мета дослідження', 'Запитання не підказують відповідь', 'Інсайти відрізняються від припущень'] },
  persona: { tip: 'Заповни персону на основі дослідження (чи навчального сценарію): цілі, потреби, мотивація, бар’єри.', criteria: ['Є ціль і контекст', 'Описані потреби й бар’єри', 'Персона пов’язана з реальною проблемою'] },
  journey: { tip: 'Додай етапи шляху користувача (кнопка «+ Етап»): дія, думки, емоція, проблема, можливість, пріоритет на кожен рядок.', criteria: ['Є щонайменше 3 етапи', 'Позначені проблемні точки', 'Є хоч одна можливість покращення'] },
  problem: { tip: 'Відрізни симптом від справжньої проблеми, сформулюй Problem Statement і How Might We.', criteria: ['Problem Statement сформульовано', 'Є бодай одне How Might We'] },
  ia: { tip: 'Додай розділи сайту/застосунку з рівнем вкладеності (0 — корінь, 1 — підрозділ, 2 — під-підрозділ).', criteria: ['Є щонайменше 5 розділів', 'Структура має більше ніж 1 рівень'] },
  flow: { tip: 'Додай блоки (Початок/Дія/Рішення/Завершення/Помилка), перетягни їх, потім клікни по одному й по другому блоку — зʼявиться з’єднання. «Перевірити потік» показує, чи немає тупиків.', criteria: ['Є блок «Початок»', 'Є блок «Завершення»', 'Усі блоки з’єднані, немає тупиків (перевір кнопкою)'] },
  wireframe: { tip: 'Додай екран, перетягни елементи з панелі інструментів на канву, розмісти їх ручками.', criteria: ['Є щонайменше 1 екран', 'На екрані є основні елементи (навігація, дія, контент)'] },
  prototype: { tip: 'Обери екран і елемент на ньому, признач, куди він веде. Познач стартовий екран. Натисни «▶ Прев’ю» — переходи мають реально працювати.', criteria: ['Визначено стартовий екран', 'Є щонайменше 1 робочий перехід', 'Сценарій проходиться в прев’ю без глухих кутів'] },
  testing: { tip: 'Опиши сценарій тестування, завдання учаснику, і занеси реальні знахідки (не вигадуй результати — якщо тестування не проводилось, залиш чесну позначку).', criteria: ['Є сценарій і завдання', 'Знахідки мають severity'] },
  audit: { tip: 'Пройди чек-лист чесно — став галочку, лише якщо справді перевірив, і залишай коментар де є сумнів.', criteria: ['Пройдено весь чек-лист', 'Є коментарі до проблемних пунктів'] },
  presentation: { tip: 'Зведи UX-кейс докупи: що в автозведенні — реальні дані з попередніх етапів. Додай власний підсумок.', criteria: ['Є підсумок і висновки', 'У кейсі представлені всі етапи процесу'] },
}

function TextField({ label, value, onCommit, textarea, placeholder }) {
  const [local, setLocal] = useState(value || '')
  const Tag = textarea ? 'textarea' : 'input'
  return (
    <label className="gfx-field">
      {label}
      <Tag
        className={textarea ? 'gfx-textarea' : 'cl-text-input'}
        rows={textarea ? 3 : undefined}
        value={local}
        placeholder={placeholder}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => { if (local !== (value || '')) onCommit(local) }}
      />
    </label>
  )
}

// Проста повторно-використовувана редагована колонка рядків (питання
// дослідження, нотатки, інсайти, завдання, знахідки) — додати/
// редагувати/видалити, той самий патерн у кількох етапах замість
// дублювання.
function ListEditor({ items, onAdd, onUpdate, onRemove, placeholder, addLabel }) {
  return (
    <div className="ux-list-editor">
      {items.map((it, i) => (
        <div key={it.id} className="ux-list-row">
          <input
            className="cl-text-input"
            defaultValue={it.text}
            placeholder={placeholder}
            onBlur={(e) => { if (e.target.value !== it.text) onUpdate(it.id, { text: e.target.value }) }}
          />
          <button type="button" className="cl-mini-btn" onClick={() => onRemove(it.id)}>×</button>
        </div>
      ))}
      <button type="button" className="cl-mini-btn" onClick={onAdd}>+ {addLabel}</button>
    </div>
  )
}

function ResearchStage({ project, onPatch }) {
  const r = project.research
  function addTo(key) { onPatch({ research: { ...r, [key]: [...r[key], { id: crypto.randomUUID(), text: '' }] } }) }
  function updateIn(key, id, patch) { onPatch({ research: { ...r, [key]: r[key].map((x) => (x.id === id ? { ...x, ...patch } : x)) } }) }
  function removeFrom(key, id) { onPatch({ research: { ...r, [key]: r[key].filter((x) => x.id !== id) } }) }
  return (
    <div className="branding-form">
      <p className="cl-section-title">UX-дослідження</p>
      <p className="cl-tab-desc">Дані тут навчальні — познач це чесно, якщо це не справжнє дослідження реальних людей.</p>
      <TextField label="Мета дослідження" value={r.goal} onCommit={(v) => onPatch({ research: { ...r, goal: v } })} placeholder="Що саме хочемо дізнатись і навіщо" />
      <p className="cl-section-title" style={{ marginTop: 16 }}>Запитання до користувачів</p>
      <ListEditor items={r.questions} onAdd={() => addTo('questions')} onUpdate={(id, p) => updateIn('questions', id, p)} onRemove={(id) => removeFrom('questions', id)} placeholder="Відкрите запитання, що не підказує відповідь" addLabel="Запитання" />
      <p className="cl-section-title" style={{ marginTop: 16 }}>Нотатки</p>
      <ListEditor items={r.notes} onAdd={() => addTo('notes')} onUpdate={(id, p) => updateIn('notes', id, p)} onRemove={(id) => removeFrom('notes', id)} placeholder="Спостереження, цитата, факт" addLabel="Нотатку" />
      <p className="cl-section-title" style={{ marginTop: 16 }}>Інсайти</p>
      <ListEditor items={r.insights} onAdd={() => addTo('insights')} onUpdate={(id, p) => updateIn('insights', id, p)} onRemove={(id) => removeFrom('insights', id)} placeholder="Висновок, що випливає з нотаток (не припущення)" addLabel="Інсайт" />
    </div>
  )
}

function PersonaStage({ project, onPatch }) {
  const p = project.persona
  const set = (field) => (val) => onPatch({ persona: { ...p, [field]: val } })
  return (
    <div className="branding-form">
      <p className="cl-section-title">User Persona</p>
      <p className="cl-tab-desc">Познач джерела: реальне дослідження чи навчальний сценарій — не видавай умовний приклад за реальні дані.</p>
      <TextField label="Ім’я персони" value={p.name} onCommit={set('name')} placeholder="Умовне ім’я для зручності" />
      <TextField label="Контекст" value={p.context} onCommit={set('context')} textarea placeholder="Хто ця людина, в якій ситуації користується продуктом" />
      <TextField label="Цілі" value={p.goals} onCommit={set('goals')} textarea />
      <TextField label="Потреби (User Needs)" value={p.needs} onCommit={set('needs')} textarea />
      <TextField label="Мотивація" value={p.motivation} onCommit={set('motivation')} textarea />
      <TextField label="Болі (Pain Points)" value={p.painPoints} onCommit={set('painPoints')} textarea />
      <TextField label="Бар’єри" value={p.barriers} onCommit={set('barriers')} textarea />
      <TextField label="Типові сценарії використання" value={p.scenarios} onCommit={set('scenarios')} textarea />
      <TextField label="Джерела інформації" value={p.sources} onCommit={set('sources')} placeholder="Реальне інтерв’ю / навчальний сценарій / припущення" />
    </div>
  )
}

const JOURNEY_COLS = [
  { key: 'stage', label: 'Етап' },
  { key: 'action', label: 'Дія' },
  { key: 'thoughts', label: 'Думки' },
  { key: 'emotion', label: 'Емоція' },
  { key: 'painPoint', label: 'Проблема' },
  { key: 'opportunity', label: 'Можливість' },
]
const PRIORITIES = ['Низький', 'Середній', 'Високий']

function JourneyStage({ project, onPatch }) {
  const rows = project.journey.rows
  function add() {
    onPatch({ journey: { rows: [...rows, { id: crypto.randomUUID(), stage: '', action: '', thoughts: '', emotion: '', painPoint: '', opportunity: '', priority: 'Середній' }] } })
  }
  function update(id, patch) { onPatch({ journey: { rows: rows.map((r) => (r.id === id ? { ...r, ...patch } : r)) } }) }
  function remove(id) { onPatch({ journey: { rows: rows.filter((r) => r.id !== id) } }) }
  function move(id, dir) {
    const idx = rows.findIndex((r) => r.id === id)
    const swap = idx + dir
    if (idx < 0 || swap < 0 || swap >= rows.length) return
    const next = [...rows]
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    onPatch({ journey: { rows: next } })
  }
  return (
    <div className="branding-form">
      <p className="cl-section-title">User Journey Map</p>
      <button className="harmony-btn" onClick={add}>+ Етап</button>
      {rows.length === 0 && <p className="cl-tab-desc">Ще немає жодного етапу.</p>}
      {rows.map((r, i) => (
        <div key={r.id} className="branding-name-card ux-journey-row">
          <div className="gfx-row" style={{ alignItems: 'center' }}>
            <strong style={{ flex: 1 }}>Етап {i + 1}</strong>
            <button className="cl-mini-btn" disabled={i === 0} onClick={() => move(r.id, -1)}>▲</button>
            <button className="cl-mini-btn" disabled={i === rows.length - 1} onClick={() => move(r.id, 1)}>▼</button>
            <button className="cl-mini-btn" onClick={() => remove(r.id)}>Видалити</button>
          </div>
          {JOURNEY_COLS.map((c) => (
            <TextField key={c.key} label={c.label} value={r[c.key]} onCommit={(v) => update(r.id, { [c.key]: v })} />
          ))}
          <label className="gfx-field">Пріоритет
            <select className="cl-text-input" value={r.priority} onChange={(e) => update(r.id, { priority: e.target.value })}>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
        </div>
      ))}
    </div>
  )
}

function ProblemStage({ project, onPatch }) {
  const pr = project.problem
  const set = (field) => (val) => onPatch({ problem: { ...pr, [field]: val } })
  return (
    <div className="branding-form">
      <p className="cl-section-title">Визначення проблеми</p>
      <TextField label="Симптом (що помітно на поверхні)" value={pr.symptom} onCommit={set('symptom')} textarea />
      <TextField label="Problem Statement" value={pr.statement} onCommit={set('statement')} textarea placeholder="[Персона] потребує способу [дія], тому що [причина], але [перешкода]." />
      <TextField label="How Might We" value={pr.hmw} onCommit={set('hmw')} textarea placeholder="Як ми могли б..." />
      <TextField label="Критерії успіху" value={pr.successCriteria} onCommit={set('successCriteria')} textarea />
    </div>
  )
}

function IAStage({ project, onPatch }) {
  const nodes = project.ia.nodes
  function add() { onPatch({ ia: { nodes: [...nodes, { id: crypto.randomUUID(), title: '', level: 0 }] } }) }
  function update(id, patch) { onPatch({ ia: { nodes: nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)) } }) }
  function remove(id) { onPatch({ ia: { nodes: nodes.filter((n) => n.id !== id) } }) }
  return (
    <div className="branding-form">
      <p className="cl-section-title">Інформаційна архітектура</p>
      <p className="cl-tab-desc">Рівень 0 — корінь (головні розділи), 1 — підрозділ, 2 — під-підрозділ.</p>
      <button className="harmony-btn" onClick={add}>+ Розділ</button>
      {nodes.map((n) => (
        <div key={n.id} className="ux-ia-row" style={{ marginLeft: n.level * 24 }}>
          <select className="cl-text-input" style={{ maxWidth: 70 }} value={n.level} onChange={(e) => update(n.id, { level: Number(e.target.value) })}>
            {[0, 1, 2].map((l) => <option key={l} value={l}>{'— '.repeat(l) || '●'}</option>)}
          </select>
          <input className="cl-text-input" defaultValue={n.title} placeholder="Назва розділу" onBlur={(e) => { if (e.target.value !== n.title) update(n.id, { title: e.target.value }) }} />
          <button type="button" className="cl-mini-btn" onClick={() => remove(n.id)}>×</button>
        </div>
      ))}
    </div>
  )
}

function TestingStage({ project, onPatch }) {
  const t = project.testing
  function addFinding() { onPatch({ testing: { ...t, findings: [...t.findings, { id: crypto.randomUUID(), text: '', severity: 'Середня' }] } }) }
  function updateFinding(id, patch) { onPatch({ testing: { ...t, findings: t.findings.map((f) => (f.id === id ? { ...f, ...patch } : f)) } }) }
  function removeFinding(id) { onPatch({ testing: { ...t, findings: t.findings.filter((f) => f.id !== id) } }) }
  return (
    <div className="branding-form">
      <p className="cl-section-title">UX-тестування</p>
      <p className="cl-tab-desc"><strong>Чесна межа:</strong> студія не може достовірно оцінити поведінку реальних людей — знахідки нижче мають походити з реального тестування (тобою чи кимось) або бути позначені як навчальний приклад.</p>
      <TextField label="Сценарій тестування" value={t.scenario} onCommit={(v) => onPatch({ testing: { ...t, scenario: v } })} textarea />
      <p className="cl-section-title" style={{ marginTop: 16 }}>Знахідки</p>
      {t.findings.map((f) => (
        <div key={f.id} className="ux-list-row">
          <input className="cl-text-input" defaultValue={f.text} placeholder="Що саме пішло не так" onBlur={(e) => { if (e.target.value !== f.text) updateFinding(f.id, { text: e.target.value }) }} />
          <select className="cl-text-input" style={{ maxWidth: 110 }} value={f.severity} onChange={(e) => updateFinding(f.id, { severity: e.target.value })}>
            {['Низька', 'Середня', 'Висока', 'Критична'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button type="button" className="cl-mini-btn" onClick={() => removeFinding(f.id)}>×</button>
        </div>
      ))}
      <button type="button" className="cl-mini-btn" onClick={addFinding}>+ Знахідка</button>
    </div>
  )
}

function AuditStage({ project, onPatch }) {
  const a = project.audit
  function toggle(id) { onPatch({ audit: { items: a.items.map((it) => (it.id === id ? { ...it, checked: !it.checked } : it)) } }) }
  function note(id, val) { onPatch({ audit: { items: a.items.map((it) => (it.id === id ? { ...it, note: val } : it)) } }) }
  const done = a.items.filter((it) => it.checked).length
  return (
    <div className="branding-form">
      <p className="cl-section-title">UX Audit</p>
      <p className="cl-tab-desc">{done}/{a.items.length} пунктів пройдено</p>
      {a.items.map((it) => (
        <div key={it.id} className="ux-audit-row">
          <label className="ux-audit-check">
            <input type="checkbox" checked={it.checked} onChange={() => toggle(it.id)} />
            {it.label}
          </label>
          <input className="cl-text-input" defaultValue={it.note} placeholder="Коментар (якщо є сумнів)" onBlur={(e) => { if (e.target.value !== it.note) note(it.id, e.target.value) }} />
        </div>
      ))}
    </div>
  )
}

function PresentationStage({ project, onPatch }) {
  const pr = project.presentation
  const flowCheck = validateFlow(project.flow.blocks, project.flow.edges)
  const autoSummary = [
    project.research.goal && `Мета дослідження: ${project.research.goal}`,
    project.persona.name && `Персона: ${project.persona.name}`,
    project.problem.statement && `Problem Statement сформульовано`,
    project.journey.rows.length > 0 && `User Journey: ${project.journey.rows.length} етапів`,
    project.ia.nodes.length > 0 && `Інформаційна архітектура: ${project.ia.nodes.length} розділів`,
    project.flow.blocks.length > 0 && `User Flow: ${project.flow.blocks.length} блоків, ${flowCheck.isValid ? 'без тупиків' : 'є незавершені переходи'}`,
    project.wireframe.screens.length > 0 && `Wireframes: ${project.wireframe.screens.length} екранів`,
    project.prototype.startScreenId && `Прототип: стартовий екран визначено, ${project.prototype.links.length} переходів`,
    project.testing.findings.length > 0 && `Тестування: ${project.testing.findings.length} знахідок`,
  ].filter(Boolean)
  return (
    <div className="branding-form">
      <p className="cl-section-title">UX-кейс</p>
      {autoSummary.length > 0 && (
        <div className="branding-name-card">
          <strong>Автоматично з проєкту:</strong>
          <ul>{autoSummary.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </div>
      )}
      <TextField label="Підсумок кейсу" value={pr.summary} onCommit={(v) => onPatch({ presentation: { ...pr, summary: v } })} textarea placeholder="Коротко: яку проблему вирішували і як" />
      <TextField label="Висновки й наступні кроки" value={pr.conclusions} onCommit={(v) => onPatch({ presentation: { ...pr, conclusions: v } })} textarea />
    </div>
  )
}

// ---------- Етап «User Flow»: реальний граф вузлів і з’єднань ----------

const FLOW_CANVAS = { w: 900, h: 520 }

function FlowStage({ project, onPatch, toastApi }) {
  const canvasRef = useRef(null)
  const dragRef = useRef(null)
  const blocks = project.flow.blocks
  const edges = project.flow.edges
  const [selectedId, setSelectedId] = useState(null)
  const [connectFrom, setConnectFrom] = useState(null)
  const selected = blocks.find((b) => b.id === selectedId) || null

  function commit(patch) { onPatch({ flow: { ...project.flow, ...patch } }) }
  function addBlock(type) {
    const b = defaultFlowBlock(type, { x: 60 + blocks.length * 20, y: 60 + (blocks.length % 4) * 40 })
    commit({ blocks: [...blocks, b] })
    setSelectedId(b.id)
  }
  function deleteSelected() {
    if (!selected) return
    commit({ blocks: blocks.filter((b) => b.id !== selected.id), edges: edges.filter((e) => e.from !== selected.id && e.to !== selected.id) })
    setSelectedId(null)
  }
  function updateLabel(val) {
    if (!selected) return
    commit({ blocks: blocks.map((b) => (b.id === selected.id ? { ...b, label: val } : b)) })
  }
  function updateEdgeLabel(id, val) {
    commit({ edges: edges.map((e) => (e.id === id ? { ...e, label: val } : e)) })
  }
  function removeEdge(id) { commit({ edges: edges.filter((e) => e.id !== id) }) }

  function pos(e) {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return { x: (clientX - rect.left) * (canvas.width / rect.width), y: (clientY - rect.top) * (canvas.height / rect.height) }
  }

  function start(e) {
    const p = pos(e)
    const hit = flowHitTest(blocks, p)
    if (connectFrom) {
      if (hit && hit.id !== connectFrom) {
        commit({ edges: [...edges, { id: crypto.randomUUID(), from: connectFrom, to: hit.id, label: '' }] })
        toastApi.show('✓ З’єднання створено')
      }
      setConnectFrom(null)
      return
    }
    if (hit) {
      setSelectedId(hit.id)
      dragRef.current = { id: hit.id, offX: p.x - hit.x, offY: p.y - hit.y }
    } else {
      setSelectedId(null)
    }
  }
  function move(e) {
    if (!dragRef.current) return
    const p = pos(e)
    const { id, offX, offY } = dragRef.current
    commit({ blocks: blocks.map((b) => (b.id === id ? { ...b, x: p.x - offX, y: p.y - offY } : b)) })
  }
  function end() { dragRef.current = null }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = FLOW_CANVAS.w
    canvas.height = FLOW_CANVAS.h
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    for (const e of edges) {
      const from = blocks.find((b) => b.id === e.from)
      const to = blocks.find((b) => b.id === e.to)
      if (from && to) drawFlowEdge(ctx, from, to, e.label)
    }
    for (const b of blocks) drawFlowBlock(ctx, b, b.id === selectedId || b.id === connectFrom)
  })

  const check = validateFlow(blocks, edges)

  return (
    <div className="motion-anim-stage">
      <p className="cl-tab-desc motion-howto">
        <strong>Як це працює:</strong> додай блоки (Початок/Дія/Рішення/Завершення/Помилка), перетягни їх мишею. Щоб з’єднати два блоки — клікни перший блок (виділиться), натисни «🔗 З’єднати», потім клікни другий блок.
      </p>
      <div className="motion-anim-toolbar">
        {FLOW_TYPES.map((t) => (
          <button key={t.key} className="cl-mini-btn" onClick={() => addBlock(t.key)}>+ {t.label}</button>
        ))}
        <button className={'cl-mini-btn' + (connectFrom ? ' active' : '')} onClick={() => setConnectFrom(connectFrom ? null : (selectedId || blocks[0]?.id))} disabled={blocks.length < 2}>🔗 З’єднати</button>
        {selected && <button className="cl-mini-btn" onClick={deleteSelected}>🗑 Видалити</button>}
        <button className="cl-mini-btn" style={{ marginLeft: 'auto' }} onClick={() => toastApi.show(check.isValid ? '✓ Потік валідний: є початок, завершення, усі блоки з’єднані' : `⚠ Проблеми: ${!check.hasStart ? 'немає блоку «Початок»; ' : ''}${!check.hasEnd ? 'немає блоку «Завершення»; ' : ''}${check.unreachable.length ? `недосяжні блоки: ${check.unreachable.length}; ` : ''}${check.deadEnds.length ? `тупики: ${check.deadEnds.length}` : ''}`)}>
          ✓ Перевірити потік
        </button>
      </div>

      <div className="motion-anim-primary">
        <div className="motion-canvas-wrap ux-flow-canvas" style={{ maxWidth: Math.min(FLOW_CANVAS.w, 820), aspectRatio: `${FLOW_CANVAS.w} / ${FLOW_CANVAS.h}` }}>
          <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerLeave={end} />
        </div>
      </div>

      <div className="motion-props-panel">
        {!selected && <p className="cl-tab-desc">Обери блок на схемі, щоб редагувати підпис.</p>}
        {selected && (
          <label className="gfx-field">Текст блоку
            <input className="cl-text-input" defaultValue={selected.label} onBlur={(e) => { if (e.target.value !== selected.label) updateLabel(e.target.value) }} />
          </label>
        )}
        {edges.length > 0 && (
          <>
            <p className="cl-section-title" style={{ marginTop: 10 }}>З’єднання</p>
            {edges.map((e) => {
              const from = blocks.find((b) => b.id === e.from)
              const to = blocks.find((b) => b.id === e.to)
              return (
                <div key={e.id} className="ux-list-row">
                  <span className="motion-track-label" style={{ minWidth: 0, flex: 1 }}>{from?.label || '?'} → {to?.label || '?'}</span>
                  <input className="cl-text-input" style={{ maxWidth: 90 }} defaultValue={e.label} placeholder="підпис" onBlur={(ev) => { if (ev.target.value !== e.label) updateEdgeLabel(e.id, ev.target.value) }} />
                  <button type="button" className="cl-mini-btn" onClick={() => removeEdge(e.id)}>×</button>
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}

// ---------- Етап «Wireframes»: реальний канвас, кілька екранів ----------

const WF_SCREEN_PRESETS = [
  { id: 'mobile', label: 'Мобільний (375×667)', w: 375, h: 667 },
  { id: 'tablet', label: 'Планшет (768×1024)', w: 768, h: 1024 },
  { id: 'desktop', label: 'Десктоп (1280×800)', w: 1280, h: 800 },
]

function WireframeStage({ project, onPatch }) {
  const screens = project.wireframe.screens
  const [activeScreenId, setActiveScreenId] = useState(screens[0]?.id || null)
  const [selectedObjId, setSelectedObjId] = useState(null)
  const canvasRef = useRef(null)
  const dragRef = useRef(null)
  const activeScreen = screens.find((s) => s.id === activeScreenId) || null
  const objects = activeScreen?.objects || []
  const selected = objects.find((o) => o.id === selectedObjId) || null

  function commitScreens(next) { onPatch({ wireframe: { screens: next } }) }
  function addScreen() {
    const preset = WF_SCREEN_PRESETS[0]
    const s = { id: crypto.randomUUID(), name: `Екран ${screens.length + 1}`, w: preset.w, h: preset.h, objects: [] }
    commitScreens([...screens, s])
    setActiveScreenId(s.id)
  }
  function removeScreen(id) {
    commitScreens(screens.filter((s) => s.id !== id))
    if (activeScreenId === id) setActiveScreenId(screens.find((s) => s.id !== id)?.id || null)
  }
  function renameScreen(id, name) { commitScreens(screens.map((s) => (s.id === id ? { ...s, name } : s))) }
  function resizeScreen(id, w, h) { commitScreens(screens.map((s) => (s.id === id ? { ...s, w, h } : s))) }
  function commitObjects(next) { commitScreens(screens.map((s) => (s.id === activeScreenId ? { ...s, objects: next } : s))) }

  function addShape(type) {
    const o = defaultWfObject(type, { x: 20, y: 20 })
    commitObjects([...objects, o])
    setSelectedObjId(o.id)
  }
  function deleteSelected() {
    if (!selected) return
    commitObjects(objects.filter((o) => o.id !== selected.id))
    setSelectedObjId(null)
  }
  function duplicateSelected() {
    if (!selected) return
    const copy = { ...selected, id: crypto.randomUUID(), x: selected.x + 14, y: selected.y + 14 }
    commitObjects([...objects, copy])
    setSelectedObjId(copy.id)
  }
  function setBaseProp(patch) {
    if (!selected) return
    commitObjects(objects.map((o) => (o.id === selected.id ? { ...o, ...patch } : o)))
  }

  function pos(e) {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return { x: (clientX - rect.left) * (canvas.width / rect.width), y: (clientY - rect.top) * (canvas.height / rect.height) }
  }
  function start(e) {
    const p = pos(e)
    if (selected) {
      const h = wfHitHandle(selected, p)
      if (h) { dragRef.current = { mode: 'resize', handle: h, orig: selected }; return }
    }
    const hit = wfHitTest(objects, p)
    if (hit) {
      setSelectedObjId(hit.id)
      dragRef.current = { mode: 'move', orig: hit, offX: p.x - hit.x, offY: p.y - hit.y }
    } else {
      setSelectedObjId(null)
    }
  }
  function move(e) {
    if (!dragRef.current) return
    e.preventDefault()
    const p = pos(e)
    const drag = dragRef.current
    let next = null
    if (drag.mode === 'move') next = { ...drag.orig, x: p.x - drag.offX, y: p.y - drag.offY }
    if (drag.mode === 'resize') next = wfResize(drag.orig, drag.handle, p)
    if (!next) return
    commitObjects(objects.map((o) => (o.id === next.id ? next : o)))
  }
  function end() { dragRef.current = null }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !activeScreen) return
    canvas.width = activeScreen.w
    canvas.height = activeScreen.h
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    for (const o of objects) {
      drawWfObject(ctx, o)
      if (o.id === selectedObjId) wfDrawHandles(ctx, o)
    }
  })

  const maxDisplayW = activeScreen ? Math.min(activeScreen.w, 480) : 480

  return (
    <div className="motion-anim-stage">
      <p className="cl-tab-desc motion-howto">
        <strong>Як це працює:</strong> додай екран, обери розмір, перетягни елементи з панелі на канву, розмісти ручками. Кожен урок просить конкретні елементи — не лишай екран порожнім.
      </p>
      <div className="ux-screen-tabs">
        {screens.map((s) => (
          <button key={s.id} className={'cl-mini-btn' + (s.id === activeScreenId ? ' active' : '')} onClick={() => setActiveScreenId(s.id)}>{s.name}</button>
        ))}
        <button className="cl-mini-btn" onClick={addScreen}>+ Екран</button>
      </div>

      {activeScreen && (
        <>
          <div className="motion-anim-toolbar">
            <input className="cl-text-input" style={{ maxWidth: 160 }} defaultValue={activeScreen.name} onBlur={(e) => { if (e.target.value !== activeScreen.name) renameScreen(activeScreen.id, e.target.value || activeScreen.name) }} />
            <select className="cl-text-input" style={{ maxWidth: 190 }} value={WF_SCREEN_PRESETS.find((p) => p.w === activeScreen.w && p.h === activeScreen.h)?.id || ''} onChange={(e) => { const p = WF_SCREEN_PRESETS.find((x) => x.id === e.target.value); if (p) resizeScreen(activeScreen.id, p.w, p.h) }}>
              <option value="" disabled>Розмір екрана…</option>
              {WF_SCREEN_PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
            <button className="cl-mini-btn" onClick={() => removeScreen(activeScreen.id)}>🗑 Видалити екран</button>
          </div>
          <div className="motion-anim-toolbar">
            {WF_TYPES.map((t) => (
              <button key={t.key} className="cl-mini-btn" onClick={() => addShape(t.key)}>+ {t.label}</button>
            ))}
            {selected && <button className="cl-mini-btn" onClick={duplicateSelected}>⧉ Дублювати</button>}
            {selected && <button className="cl-mini-btn" onClick={deleteSelected}>🗑 Видалити</button>}
          </div>

          <div className="motion-anim-primary">
            <div className="motion-canvas-wrap" style={{ maxWidth: maxDisplayW, aspectRatio: `${activeScreen.w} / ${activeScreen.h}`, background: '#fff' }}>
              <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerLeave={end} />
            </div>
          </div>

          <div className="motion-props-panel">
            {!selected && <p className="cl-tab-desc">Додай чи обери елемент, щоб побачити властивості.</p>}
            {selected && (
              <>
                <p className="cl-section-title">{wfLabel(selected)}</p>
                {selected.type !== 'container' && selected.type !== 'divider' && selected.type !== 'list' && (
                  <label className="gfx-field">Текст
                    <input className="cl-text-input" value={selected.text} onChange={(e) => setBaseProp({ text: e.target.value })} />
                  </label>
                )}
                <div className="branding-score-grid">
                  <label className="gfx-field">X<input className="cl-text-input" type="number" value={Math.round(selected.x)} onChange={(e) => setBaseProp({ x: Number(e.target.value) })} /></label>
                  <label className="gfx-field">Y<input className="cl-text-input" type="number" value={Math.round(selected.y)} onChange={(e) => setBaseProp({ y: Number(e.target.value) })} /></label>
                  <label className="gfx-field">Ширина<input className="cl-text-input" type="number" value={Math.round(selected.w)} onChange={(e) => setBaseProp({ w: Number(e.target.value) })} /></label>
                  <label className="gfx-field">Висота<input className="cl-text-input" type="number" value={Math.round(selected.h)} onChange={(e) => setBaseProp({ h: Number(e.target.value) })} /></label>
                </div>
              </>
            )}
          </div>
        </>
      )}
      {!activeScreen && <p className="cl-tab-desc">Немає жодного екрана — натисни «+ Екран».</p>}
    </div>
  )
}

// ---------- Етап «Прототип»: реальні клікабельні переходи ----------

function PrototypeStage({ project, onPatch, toastApi }) {
  const screens = project.wireframe.screens
  const { links, startScreenId } = project.prototype
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewScreenId, setPreviewScreenId] = useState(startScreenId)
  const [pickerScreenId, setPickerScreenId] = useState(screens[0]?.id || null)
  const pickerScreen = screens.find((s) => s.id === pickerScreenId) || null
  const canvasRef = useRef(null)

  function commit(patch) { onPatch({ prototype: { links, startScreenId, ...patch } }) }
  function addLink(fromScreenId, fromObjectId, toScreenId) {
    if (!toScreenId) return
    commit({ links: [...links.filter((l) => !(l.fromScreenId === fromScreenId && l.fromObjectId === fromObjectId)), { id: crypto.randomUUID(), fromScreenId, fromObjectId, toScreenId }] })
  }
  function removeLink(id) { commit({ links: links.filter((l) => l.id !== id) }) }

  useEffect(() => {
    const canvas = canvasRef.current
    const screen = previewOpen ? screens.find((s) => s.id === previewScreenId) : pickerScreen
    if (!canvas || !screen) return
    canvas.width = screen.w
    canvas.height = screen.h
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    for (const o of screen.objects) drawWfObject(ctx, o)
  })

  function pos(e, canvas) {
    const rect = canvas.getBoundingClientRect()
    return { x: (e.clientX - rect.left) * (canvas.width / rect.width), y: (e.clientY - rect.top) * (canvas.height / rect.height) }
  }

  function onPreviewClick(e) {
    const canvas = canvasRef.current
    const screen = screens.find((s) => s.id === previewScreenId)
    if (!canvas || !screen) return
    const p = pos(e, canvas)
    const hit = wfHitTest(screen.objects, p)
    if (!hit) return
    const link = links.find((l) => l.fromScreenId === screen.id && l.fromObjectId === hit.id)
    if (link) setPreviewScreenId(link.toScreenId)
    else toastApi.show('У цього елемента ще немає переходу')
  }

  if (screens.length === 0) {
    return <div className="branding-form"><p className="cl-tab-desc">Спочатку створи хоча б один екран на етапі «Wireframes».</p></div>
  }

  if (previewOpen) {
    const screen = screens.find((s) => s.id === previewScreenId)
    return (
      <div className="motion-anim-stage">
        <div className="motion-anim-toolbar">
          <button className="cl-mini-btn" onClick={() => setPreviewOpen(false)}>✎ До редагування</button>
          <button className="cl-mini-btn" onClick={() => setPreviewScreenId(startScreenId)} disabled={!startScreenId}>⏮ До старту</button>
          <span className="motion-time-label">{screen?.name || '—'}</span>
        </div>
        <div className="motion-anim-primary">
          <div className="motion-canvas-wrap" style={{ maxWidth: Math.min(screen?.w || 375, 420), aspectRatio: `${screen?.w || 375} / ${screen?.h || 667}` }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', cursor: 'pointer' }} onClick={onPreviewClick} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="branding-form">
      <p className="cl-section-title">Прототип</p>
      <label className="gfx-field">Стартовий екран
        <select className="cl-text-input" value={startScreenId || ''} onChange={(e) => commit({ startScreenId: e.target.value })}>
          <option value="" disabled>Обери екран…</option>
          {screens.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </label>
      <button className="harmony-btn" style={{ marginTop: 10 }} disabled={!startScreenId} onClick={() => { setPreviewScreenId(startScreenId); setPreviewOpen(true) }}>▶ Прев’ю</button>

      <p className="cl-section-title" style={{ marginTop: 20 }}>Призначити переходи</p>
      <label className="gfx-field">Екран
        <select className="cl-text-input" value={pickerScreenId || ''} onChange={(e) => setPickerScreenId(e.target.value)}>
          {screens.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </label>
      {pickerScreen && pickerScreen.objects.length === 0 && <p className="cl-tab-desc">На цьому екрані ще немає елементів — додай їх на етапі «Wireframes».</p>}
      {pickerScreen && pickerScreen.objects.map((o) => {
        const existing = links.find((l) => l.fromScreenId === pickerScreen.id && l.fromObjectId === o.id)
        return (
          <div key={o.id} className="ux-list-row">
            <span className="motion-track-label" style={{ minWidth: 140 }}>{wfLabel(o)}{o.text ? ` «${o.text}»` : ''}</span>
            <select className="cl-text-input" value={existing?.toScreenId || ''} onChange={(e) => addLink(pickerScreen.id, o.id, e.target.value)}>
              <option value="">— веде нікуди —</option>
              {screens.filter((s) => s.id !== pickerScreen.id).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {existing && <button type="button" className="cl-mini-btn" onClick={() => removeLink(existing.id)}>×</button>}
          </div>
        )
      })}
    </div>
  )
}

// ---------- Головний компонент ----------

export default function UXStudio() {
  const { projectId } = useParams()
  const location = useLocation()
  const { uxProjects, saveUxProject } = useProgress()
  const toastApi = useLabToast()
  const project = uxProjects.find((p) => p.id === projectId)
  const [stage, setStage] = useState(location.state?.stage || 'research')

  if (!project) return <NotFound />

  function onPatch(patch) {
    saveUxProject({ id: project.id, ...patch })
  }

  const help = STAGE_HELP[stage]
  const isCanvasStage = stage === 'flow' || stage === 'wireframe' || stage === 'prototype'

  return (
    <div className="branding-studio">
      <div className="dict-breadcrumb">
        <Link to="/academy/ux-design">UX Design Studio</Link> <span>→</span> <span>{project.name}</span>
      </div>
      <div className="gfx-topbar motion-topbar-sticky">
        <input className="cl-text-input" style={{ flex: 1, minWidth: 160 }} defaultValue={project.name} onBlur={(e) => onPatch({ name: e.target.value || 'Новий UX-проєкт' })} placeholder="Назва проєкту" />
        <button className="harmony-btn" onClick={() => { saveUxProject(project); toastApi.show('✓ Збережено') }}>💾 Зберегти</button>
        <span className="motion-autosave-note">Кожна зміна зберігається автоматично — ця кнопка лише підтверджує збереження назви проєкту.</span>
      </div>

      <div className={'branding-layout' + (isCanvasStage ? ' branding-layout--canvas' : '')}>
        <div className="branding-stages">
          {UX_STAGES.map((s) => (
            <button key={s.id} className={'branding-stage-btn' + (stage === s.id ? ' active' : '')} onClick={() => setStage(s.id)}>
              {s.emoji} {s.label}
            </button>
          ))}
        </div>

        <div className="branding-center">
          {stage === 'research' && <ResearchStage project={project} onPatch={onPatch} />}
          {stage === 'persona' && <PersonaStage project={project} onPatch={onPatch} />}
          {stage === 'journey' && <JourneyStage project={project} onPatch={onPatch} />}
          {stage === 'problem' && <ProblemStage project={project} onPatch={onPatch} />}
          {stage === 'ia' && <IAStage project={project} onPatch={onPatch} />}
          {stage === 'flow' && <FlowStage project={project} onPatch={onPatch} toastApi={toastApi} />}
          {stage === 'wireframe' && <WireframeStage project={project} onPatch={onPatch} />}
          {stage === 'prototype' && <PrototypeStage project={project} onPatch={onPatch} toastApi={toastApi} />}
          {stage === 'testing' && <TestingStage project={project} onPatch={onPatch} />}
          {stage === 'audit' && <AuditStage project={project} onPatch={onPatch} />}
          {stage === 'presentation' && <PresentationStage project={project} onPatch={onPatch} />}
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
        </div>
      </div>
      <LabToast message={toastApi.toast} />
    </div>
  )
}
