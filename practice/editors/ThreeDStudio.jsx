import { useEffect, useRef, useState } from 'react'
import { createAnimScene, PRIMITIVES, LIGHT_KINDS, LIGHT_PRESETS, CAMERA_VIEWS } from '../../labs/threeAnimScene.js'
import { makeAnimObject, LIGHT_TYPES } from '../../threeDProject.js'
import { versionRank } from '../practiceProject.js'

// 3D Studio (ТЗ 7.A) — v1: Вибір/Додати примітив/Додати світло/Камера,
// властивості позиції-повороту-масштабу-матеріалу, аутлайнер сцени,
// PNG-рендер. Повторно використовує labs/threeAnimScene.js (createAnimScene,
// syncStructure) і threeDProject.js (makeAnimObject) — той самий рушій,
// що й ThreeDAnimEditor.jsx, а не новий three.js-код з нуля.
//
// Реальна різниця версій (ТЗ розділ 4): рушій threeAnimScene.js уже
// давно вміє більше, ніж v1-тулбар показував — тут лише відкриваємо це
// версіями, без жодного нового three.js-коду. v2 (рівень 4+) відкриває
// решту 6 «складних» примітивів (PRIMITIVES мав 12 записів, v1 показує
// лише перші 6 через .slice(0,6)): капсула/тетраедр/октаедр/ікосаедр/
// додекаедр/вузол тора. v3 (рівень 8+) відкриває світлові пресети
// (LIGHT_PRESETS — Студія/День/Захід/Ніч), що й так вже існували в
// createAnimScene() як api.setLighting(), просто не мали кнопок у
// ThreeDStudio.jsx.
//
// Свідомо НЕ реалізовано цього заходу: ключові кадри/анімація (не
// потрібні для статичних v1-завдань практики), екструзія/фаска/UV,
// малювання текстури/скульптинг, GLB/OBJ-експорт (лишився лише
// PNG — найпростіший чесний формат для перевірки в завданні).

function uid() { return crypto.randomUUID() }

export default function ThreeDStudio({ project, version, onChange }) {
  const vRank = versionRank(version || 'v1')
  const mountRef = useRef(null)
  const apiRef = useRef(null)
  const [selectedId, setSelectedId] = useState(null)
  const [bottomTab, setBottomTab] = useState('outliner')
  const objects = project.objects || []
  const selected = objects.find((o) => o.id === selectedId) || null
  const visiblePrimitives = vRank >= 1 ? PRIMITIVES : PRIMITIVES.slice(0, 6)

  useEffect(() => {
    const api = createAnimScene(mountRef.current)
    apiRef.current = api
    function onDown(e) {
      const id = api.pickAt(e.clientX, e.clientY)
      if (id) setSelectedId(id)
    }
    mountRef.current.addEventListener('pointerdown', onDown)
    return () => {
      mountRef.current?.removeEventListener('pointerdown', onDown)
      api.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    apiRef.current?.syncStructure(objects, selectedId)
  }, [objects, selectedId])

  useEffect(() => {
    if (project.cameraView) apiRef.current?.setCameraView(project.cameraView)
    if (project.lightPreset) apiRef.current?.setLighting(project.lightPreset)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function addPrimitive(type) {
    const obj = makeAnimObject(type, uid)
    onChange({ ...project, objects: [...objects, obj] })
    setSelectedId(obj.id)
  }
  function addLight(type) {
    const obj = makeAnimObject(type, uid)
    onChange({ ...project, objects: [...objects, obj] })
    setSelectedId(obj.id)
  }
  function updateSelected(patch) {
    onChange({ ...project, objects: objects.map((o) => (o.id === selectedId ? { ...o, ...patch } : o)) })
  }
  function updateVec(field, axis, value) {
    updateSelected({ [field]: { ...selected[field], [axis]: Number(value) } })
  }
  function updateMaterial(patch) {
    updateSelected({ material: { ...selected.material, ...patch, touched: true } })
  }
  function updateLight(patch) {
    updateSelected({ light: { ...selected.light, ...patch } })
  }
  function deleteSelected() {
    if (!selectedId) return
    onChange({ ...project, objects: objects.filter((o) => o.id !== selectedId) })
    setSelectedId(null)
  }
  function setCameraView(key) {
    onChange({ ...project, cameraView: key })
    apiRef.current?.setCameraView(key)
  }
  function setLightPreset(key) {
    onChange({ ...project, lightPreset: key })
    apiRef.current?.setLighting(key)
  }
  function exportPng() {
    const dataUrl = apiRef.current?.screenshot()
    if (!dataUrl) return
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = 'practice-3d.png'
    a.click()
    onChange({ ...project, exportedFormats: [...new Set([...(project.exportedFormats || []), 'png'])] })
  }

  const isLight = selected && LIGHT_TYPES.includes(selected.type)

  return (
    <>
      <div className="practice-toolbar">
        {visiblePrimitives.map((p) => (
          <button key={p.type} className="practice-tool-btn" title={`Додати ${p.label}`} onClick={() => addPrimitive(p.type)} aria-label={p.label}>{p.icon}</button>
        ))}
        <div className="practice-tool-sep" />
        {LIGHT_KINDS.map((l) => (
          <button key={l.type} className="practice-tool-btn" title={`Додати ${l.label}`} onClick={() => addLight(l.type)} aria-label={l.label}>{l.icon}</button>
        ))}
        <div className="practice-tool-sep" />
        <button className="practice-tool-btn" title="Видалити" onClick={deleteSelected} aria-label="Видалити">🗑</button>
      </div>

      <div className="practice-canvas practice-canvas--3d">
        <div ref={mountRef} className="threed-mount" />
      </div>

      <div className="practice-properties">
        <p className="cl-section-title">Властивості</p>
        {!selected && <p className="cl-tab-desc">Додай обʼєкт чи світло зліва, або клікни на сцені, щоб обрати наявний.</p>}
        {selected && (
          <>
            <p className="cl-tab-desc">{PRIMITIVES.find((p) => p.type === selected.type)?.label || LIGHT_KINDS.find((l) => l.type === selected.type)?.label}</p>
            {['position', 'rotation', 'scale'].map((field) => (
              <div className="gfx-row" key={field}>
                {['x', 'y', 'z'].map((axis) => (
                  <label className="gfx-num" key={axis}>{field[0].toUpperCase()}{axis}
                    <input type="number" step="0.1" value={selected[field][axis]} onChange={(e) => updateVec(field, axis, e.target.value)} />
                  </label>
                ))}
              </div>
            ))}
            {!isLight && (
              <>
                <label className="gfx-field">Колір матеріалу
                  <input type="color" value={selected.material.color} onChange={(e) => updateMaterial({ color: e.target.value })} />
                </label>
                <label className="gfx-field">Metalness: {selected.material.metalness}
                  <input type="range" min="0" max="1" step="0.05" value={selected.material.metalness} onChange={(e) => updateMaterial({ metalness: Number(e.target.value) })} />
                </label>
                <label className="gfx-field">Roughness: {selected.material.roughness}
                  <input type="range" min="0" max="1" step="0.05" value={selected.material.roughness} onChange={(e) => updateMaterial({ roughness: Number(e.target.value) })} />
                </label>
              </>
            )}
            {isLight && (
              <>
                <label className="gfx-field">Колір світла
                  <input type="color" value={selected.light.color} onChange={(e) => updateLight({ color: e.target.value })} />
                </label>
                <label className="gfx-field">Інтенсивність: {selected.light.intensity}
                  <input type="range" min="0" max="5" step="0.1" value={selected.light.intensity} onChange={(e) => updateLight({ intensity: Number(e.target.value) })} />
                </label>
              </>
            )}
          </>
        )}
        <p className="cl-section-title" style={{ marginTop: 14 }}>Камера</p>
        <div className="cl-btn-row">
          {CAMERA_VIEWS.map((v) => (
            <button key={v.key} className={'cl-mini-btn' + (project.cameraView === v.key ? ' active' : '')} onClick={() => setCameraView(v.key)}>{v.icon} {v.label}</button>
          ))}
        </div>
        {vRank >= 2 && (
          <>
            <p className="cl-section-title" style={{ marginTop: 14 }}>Світло сцени (v3)</p>
            <div className="cl-btn-row">
              {LIGHT_PRESETS.map((p) => (
                <button key={p.key} className={'cl-mini-btn' + ((project.lightPreset || 'studio') === p.key ? ' active' : '')} onClick={() => setLightPreset(p.key)}>{p.icon} {p.label}</button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="practice-bottom">
        <div className="practice-bottom-tabs">
          <button className={bottomTab === 'outliner' ? 'active' : ''} onClick={() => setBottomTab('outliner')}>Сцена</button>
          <button className={bottomTab === 'export' ? 'active' : ''} onClick={() => setBottomTab('export')}>Експорт</button>
        </div>
        {bottomTab === 'outliner' && (
          <div className="practice-layers">
            {objects.length === 0 && <p className="cl-tab-desc">Сцена порожня — додай примітив чи світло зліва.</p>}
            {objects.map((o) => (
              <div key={o.id} className={'ux-list-row' + (o.id === selectedId ? ' active' : '')}>
                <button className="cl-mini-btn" style={{ flex: 1, textAlign: 'left' }} onClick={() => setSelectedId(o.id)}>
                  {(PRIMITIVES.find((p) => p.type === o.type) || LIGHT_KINDS.find((l) => l.type === o.type))?.icon} {(PRIMITIVES.find((p) => p.type === o.type) || LIGHT_KINDS.find((l) => l.type === o.type))?.label}
                </button>
              </div>
            ))}
          </div>
        )}
        {bottomTab === 'export' && (
          <div className="practice-layers">
            <p className="cl-tab-desc">PNG-рендер поточного кадру з обраного ракурсу камери.</p>
            <button className="harmony-btn" onClick={exportPng}>⬇ Рендер PNG</button>
          </div>
        )}
      </div>
    </>
  )
}
