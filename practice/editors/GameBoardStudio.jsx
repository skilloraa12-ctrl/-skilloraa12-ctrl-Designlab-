import { useRef, useState } from 'react'
import { versionRank } from '../practiceProject.js'

// Game Systems Board (ТЗ 7.E) — v1: граф вузлів (Дія/Умова/Ресурс/Подія)
// зі звʼязками-стрілками (та сама форма {from,to}, що й noDeadEnds/
// hasConnection у practiceValidators.js, тож ці загальні валідатори
// працюють тут без дублювання) і таблиця балансу з мінімальними
// формулами без eval (=prev+N, =prev*N — FR-GEN-008 забороняє eval).
//
// Реальна різниця версій (ТЗ розділ 4): v2 (рівень 4+) відкриває
// «🔀 Авторозташувати» — розкладає всі вузли графа по колу, щоб не
// розставляти вручну, коли вузлів стає багато (капстоун-завдання вже
// вимагають 5+). v3 (рівень 8+) відкриває «⬇ Експорт CSV» для
// таблиці балансу — реальне, клієнтське формування CSV-файлу, без
// бекенду. Обидві фічі суто на боці редактора (не чіпають
// practiceValidators.js), тож працюють однаково для будь-якого
// завдання без змін у practiceTasks.js.
//
// Свідомо НЕ реалізовано цього заходу: повний SUM/AVG/MIN/MAX/IF (це
// вимагає власного безпечного парсера виразів — за межами цього
// заходу), симуляція циклу ×100/×1000, повноцінна вкладка ГДД з
// експортом Markdown/PDF (є лише CSV таблиці балансу, не весь
// документ).

const NODE_TYPES = [
  { id: 'action', label: 'Дія', color: '#2E6DFF' },
  { id: 'condition', label: 'Умова', color: '#F59E0B' },
  { id: 'resource', label: 'Ресурс', color: '#2FA36B' },
  { id: 'event', label: 'Подія', color: '#E0523E' },
]

function uid() { return crypto.randomUUID().slice(0, 8) }

export default function GameBoardStudio({ project, version, onChange }) {
  const vRank = versionRank(version || 'v1')
  const [tool, setTool] = useState('select')
  const [nodeTypePick, setNodeTypePick] = useState('action')
  const [selectedId, setSelectedId] = useState(null)
  const [bottomTab, setBottomTab] = useState('graph')
  const [linkFrom, setLinkFrom] = useState(null)
  const svgRef = useRef(null)
  const dragRef = useRef(null)

  const nodes = project.nodes || []
  const conns = project.connections || []
  const table = project.table || { columns: ['Рівень', 'XP потрібно'], rows: [] }

  const bounds = nodes.reduce((b, n) => ({
    minX: Math.min(b.minX, n.x), minY: Math.min(b.minY, n.y),
    maxX: Math.max(b.maxX, n.x), maxY: Math.max(b.maxY, n.y),
  }), { minX: 0, minY: 0, maxX: 600, maxY: 400 })
  const vb = { x: bounds.minX - 100, y: bounds.minY - 80, w: bounds.maxX - bounds.minX + 200, h: bounds.maxY - bounds.minY + 160 }

  const selected = nodes.find((n) => n.id === selectedId) || null

  function patchNodes(next) { onChange({ ...project, nodes: next }) }
  function updateNode(patch) { patchNodes(nodes.map((n) => (n.id === selectedId ? { ...n, ...patch } : n))) }

  function pos(e) {
    const rect = svgRef.current.getBoundingClientRect()
    const scale = vb.w / rect.width
    return { x: vb.x + (e.clientX - rect.left) * scale, y: vb.y + (e.clientY - rect.top) * scale }
  }

  function canvasClick(e) {
    if (tool !== 'node') { if (tool === 'select') setSelectedId(null); return }
    const p = pos(e)
    const node = { id: uid(), type: nodeTypePick, label: NODE_TYPES.find((t) => t.id === nodeTypePick).label, x: Math.round(p.x), y: Math.round(p.y) }
    patchNodes([...nodes, node])
    setSelectedId(node.id)
    setTool('select')
  }

  function onNodeDown(e, id) {
    // Клік інструментом «Вузол» по вже існуючому вузлу не повинен просто
    // вибирати його — пропускаємо подію далі до canvasClick, щоб новий
    // вузол дійсно зʼявився там, де клікнули (той самий клас бага, що й
    // у VectorStudio/FlowStudio onShapeDown/onNodeDown).
    if (tool === 'node') return
    e.stopPropagation()
    if (tool === 'link') {
      if (!linkFrom) { setLinkFrom(id); return }
      if (linkFrom !== id) onChange({ ...project, connections: [...conns, { id: uid(), from: linkFrom, to: id }] })
      setLinkFrom(null)
      setTool('select')
      return
    }
    setSelectedId(id)
    if (tool !== 'select') return
    const n = nodes.find((x) => x.id === id)
    const rect = svgRef.current.getBoundingClientRect()
    const scale = vb.w / rect.width
    dragRef.current = { id, startX: e.clientX, startY: e.clientY, ox: n.x, oy: n.y, scale }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }
  function onMove(e) {
    const d = dragRef.current
    if (!d) return
    const dx = (e.clientX - d.startX) * d.scale
    const dy = (e.clientY - d.startY) * d.scale
    patchNodes(nodes.map((n) => (n.id === d.id ? { ...n, x: Math.round(d.ox + dx), y: Math.round(d.oy + dy) } : n)))
  }
  function onUp() {
    dragRef.current = null
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
  }

  function deleteSelected() {
    if (!selectedId) return
    patchNodes(nodes.filter((n) => n.id !== selectedId))
    onChange({ ...project, nodes: nodes.filter((n) => n.id !== selectedId), connections: conns.filter((c) => c.from !== selectedId && c.to !== selectedId) })
    setSelectedId(null)
  }

  function nodeById(id) { return nodes.find((n) => n.id === id) }

  // v2: авторозташування — розкладає всі вузли по колу навколо центру
  // їхнього поточного bounding box, щоб не тягати кожен вручну.
  function autoArrange() {
    if (nodes.length === 0) return
    const cx = (bounds.minX + bounds.maxX) / 2, cy = (bounds.minY + bounds.maxY) / 2
    const radius = Math.max(140, nodes.length * 28)
    patchNodes(nodes.map((n, i) => {
      const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2
      return { ...n, x: Math.round(cx + Math.cos(angle) * radius), y: Math.round(cy + Math.sin(angle) * radius) }
    }))
  }

  // v3: реальний клієнтський CSV-експорт таблиці балансу (без бекенду,
  // без повноцінного ГДД-документа — чесно звужено, див. коментар угорі).
  function exportCsv() {
    const lines = [table.columns, ...table.rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'balance.csv'; a.click()
    setTimeout(() => URL.revokeObjectURL(url), 2000)
    onChange({ ...project, exportedFormats: [...new Set([...(project.exportedFormats || []), 'csv'])] })
  }

  function updateCell(r, c, value) {
    const rows = table.rows.map((row, ri) => (ri === r ? row.map((cell, ci) => (ci === c ? value : cell)) : row))
    onChange({ ...project, table: { ...table, rows } })
  }
  function addRow() {
    const row = table.columns.map((_, i) => (i === 0 ? String(table.rows.length + 1) : ''))
    onChange({ ...project, table: { ...table, rows: [...table.rows, row] } })
  }
  function removeRow(r) {
    onChange({ ...project, table: { ...table, rows: table.rows.filter((_, i) => i !== r) } })
  }
  function updateColumnName(c, name) {
    onChange({ ...project, table: { ...table, columns: table.columns.map((col, i) => (i === c ? name : col)) } })
  }

  return (
    <>
      <div className="practice-toolbar">
        <button className={'practice-tool-btn' + (tool === 'select' ? ' active' : '')} title="Вибір (V)" onClick={() => setTool('select')} aria-label="Вибір">↖</button>
        <button className={'practice-tool-btn' + (tool === 'node' ? ' active' : '')} title="Вузол (N)" onClick={() => setTool('node')} aria-label="Вузол">●</button>
        <button className={'practice-tool-btn' + (tool === 'link' ? ' active' : '')} title="Звʼязок (C)" onClick={() => { setTool('link'); setLinkFrom(null) }} aria-label="Звʼязок">↗</button>
        <div className="practice-tool-sep" />
        <button className="practice-tool-btn" title="Видалити" onClick={deleteSelected} aria-label="Видалити">🗑</button>
        {vRank >= 1 && (
          <>
            <div className="practice-tool-sep" />
            <button className="practice-tool-btn" title="Авторозташувати вузли по колу (v2)" onClick={autoArrange} aria-label="Авторозташувати">🔀</button>
          </>
        )}
      </div>

      <div className="practice-canvas">
        <svg ref={svgRef} viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`} className="vector-studio-svg" style={{ background: '#161422' }} onPointerDown={canvasClick}>
          <defs>
            <marker id="gb-arrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#F59E0B" /></marker>
          </defs>
          {conns.map((c) => {
            const a = nodeById(c.from), b = nodeById(c.to)
            if (!a || !b) return null
            return <line key={c.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#F59E0B" strokeWidth={2} markerEnd="url(#gb-arrow)" opacity={0.85} />
          })}
          {nodes.map((n) => {
            const t = NODE_TYPES.find((x) => x.id === n.type)
            return (
              <g key={n.id} onPointerDown={(e) => onNodeDown(e, n.id)} style={{ cursor: tool === 'link' ? 'crosshair' : 'move' }}>
                <circle cx={n.x} cy={n.y} r={36} fill={t.color} stroke={n.id === selectedId || n.id === linkFrom ? '#fff' : 'none'} strokeWidth={3} />
                <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize={12} fill="#fff">{n.label}</text>
              </g>
            )
          })}
        </svg>
      </div>

      <div className="practice-properties">
        <p className="cl-section-title">Властивості</p>
        {!selected && <p className="cl-tab-desc">Обери вузол на полотні. Щоб додати — обери тип нижче й клікни на полотні.</p>}
        <label className="gfx-field">Тип нового вузла
          <select className="cl-text-input" value={nodeTypePick} onChange={(e) => setNodeTypePick(e.target.value)}>
            {NODE_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </label>
        {selected && (
          <>
            <label className="gfx-field">Назва
              <input className="cl-text-input" value={selected.label} onChange={(e) => updateNode({ label: e.target.value })} />
            </label>
            <label className="gfx-field">Тип
              <select className="cl-text-input" value={selected.type} onChange={(e) => updateNode({ type: e.target.value })}>
                {NODE_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </label>
          </>
        )}
      </div>

      <div className="practice-bottom">
        <div className="practice-bottom-tabs">
          <button className={bottomTab === 'graph' ? 'active' : ''} onClick={() => setBottomTab('graph')}>Граф</button>
          <button className={bottomTab === 'balance' ? 'active' : ''} onClick={() => setBottomTab('balance')}>Баланс</button>
        </div>
        {bottomTab === 'graph' && (
          <div className="practice-layers">
            <p className="cl-tab-desc">Вузлів: {nodes.length} · Звʼязків: {conns.length}. Обери інструмент «Вузол», клікни на полотні — зʼявиться вузол обраного типу.</p>
          </div>
        )}
        {bottomTab === 'balance' && (
          <div className="practice-layers">
            <table className="gb-table">
              <thead>
                <tr>
                  {table.columns.map((c, ci) => (
                    <th key={ci}><input className="cl-text-input" value={c} onChange={(e) => updateColumnName(ci, e.target.value)} /></th>
                  ))}
                  <th />
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td key={ci}><input className="cl-text-input" value={cell} placeholder={ci === 1 ? '=prev+10' : ''} onChange={(e) => updateCell(ri, ci, e.target.value)} /></td>
                    ))}
                    <td><button className="cl-mini-btn" onClick={() => removeRow(ri)}>×</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="cl-btn-row" style={{ marginTop: 8 }}>
              <button className="harmony-btn" onClick={addRow}>+ Рядок</button>
              {vRank >= 2 && <button className="harmony-btn" onClick={exportCsv}>⬇ Експорт CSV (v3)</button>}
            </div>
            <p className="cl-tab-desc" style={{ marginTop: 6 }}>Формули без обчислення в коді (без eval, FR-GEN-008): у комірці другої колонки напиши <code>=prev+10</code> (лінійний ріст) чи <code>=prev*1.5</code> (експоненціальний) — «prev» це значення в тому ж стовпці на рядок вище.</p>
          </div>
        )}
      </div>
    </>
  )
}
