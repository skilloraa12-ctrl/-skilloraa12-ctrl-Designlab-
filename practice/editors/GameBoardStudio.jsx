import { useRef, useState } from 'react'

// Game Systems Board (ТЗ 7.E) — v1: граф вузлів (Дія/Умова/Ресурс/Подія)
// зі звʼязками-стрілками (та сама форма {from,to}, що й noDeadEnds/
// hasConnection у practiceValidators.js, тож ці загальні валідатори
// працюють тут без дублювання) і таблиця балансу з мінімальними
// формулами без eval (=prev+N, =prev*N — FR-GEN-008 забороняє eval).
//
// Свідомо НЕ реалізовано цього заходу: повний SUM/AVG/MIN/MAX/IF (це
// вимагає власного безпечного парсера виразів — за межами цього
// заходу), симуляція циклу ×100/×1000, вкладка ГДД з експортом
// Markdown/PDF.

const NODE_TYPES = [
  { id: 'action', label: 'Дія', color: '#2E6DFF' },
  { id: 'condition', label: 'Умова', color: '#F59E0B' },
  { id: 'resource', label: 'Ресурс', color: '#2FA36B' },
  { id: 'event', label: 'Подія', color: '#E0523E' },
]

function uid() { return crypto.randomUUID().slice(0, 8) }

export default function GameBoardStudio({ project, onChange }) {
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
            <button className="harmony-btn" style={{ marginTop: 8 }} onClick={addRow}>+ Рядок</button>
            <p className="cl-tab-desc" style={{ marginTop: 6 }}>Формули без обчислення в коді (без eval, FR-GEN-008): у комірці другої колонки напиши <code>=prev+10</code> (лінійний ріст) чи <code>=prev*1.5</code> (експоненціальний) — «prev» це значення в тому ж стовпці на рядок вище.</p>
          </div>
        )}
      </div>
    </>
  )
}
