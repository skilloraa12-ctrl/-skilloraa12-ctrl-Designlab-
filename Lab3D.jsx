import { useEffect, useMemo, useRef, useState } from 'react'
import LabShell from './labs/LabShell.jsx'
import LabInfoTip from './labs/LabInfoTip.jsx'
import { useLabHistory } from './labs/useLabHistory.js'
import { useLabMode } from './labs/useLabMode.js'
import { useLabToast } from './labs/useLabToast.js'
import { useLabShortcuts } from './labs/useLabShortcuts.js'
import { useLabRecent } from './labs/useLabRecent.js'
import { createThreeScene, PRIMITIVES, LIGHT_PRESETS } from './labs/threeScene.js'
import { TEMPLATES } from './labs/threeTemplates.js'

const TABS = [
  { key: 'objects', icon: '🧊', label: 'Об’єкти' },
  { key: 'templates', icon: '🏠', label: 'Шаблони' },
  { key: 'transform', icon: '🔄', label: 'Трансформація' },
  { key: 'material', icon: '🎨', label: 'Матеріал' },
  { key: 'lighting', icon: '💡', label: 'Освітлення' },
  { key: 'export', icon: '📤', label: 'Експорт' },
]

let idCounter = 0
function nextId() {
  idCounter += 1
  return `obj-${Date.now()}-${idCounter}`
}
function makeObject(type = 'box') {
  return {
    id: nextId(),
    name: null,
    type,
    position: { x: 0, y: 0.65, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    material: { color: '#3E37E0', metalness: 0.2, roughness: 0.5, wireframe: false, opacity: 1 },
  }
}
function makeObjectFromRecipe(recipe) {
  const base = makeObject(recipe.type)
  return {
    ...base,
    name: recipe.name || null,
    position: { ...base.position, ...recipe.position },
    rotation: { ...base.rotation, ...recipe.rotation },
    scale: { ...base.scale, ...recipe.scale },
    material: { ...base.material, ...recipe.material },
  }
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

function copy(text) {
  if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {})
}

function HelpBox({ children }) {
  return (
    <details className="cl-help">
      <summary>❓ Як це працює (пояснення простими словами)</summary>
      <div className="cl-help-body">{children}</div>
    </details>
  )
}

function AxisRow({ label, values, onChange, min = -5, max = 5, step = 0.05, isPro }) {
  return (
    <div className="l3d-axis-row">
      <span className="l3d-axis-label">{label}</span>
      {['x', 'y', 'z'].map((axis) => (
        <label key={axis} className="l3d-axis-field">
          <span>{axis.toUpperCase()}</span>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={values[axis]}
            onChange={(e) => onChange(axis, parseFloat(e.target.value))}
          />
          {isPro && (
            <input
              type="number"
              step={step}
              value={Math.round(values[axis] * 100) / 100}
              onChange={(e) => onChange(axis, parseFloat(e.target.value) || 0)}
            />
          )}
        </label>
      ))}
    </div>
  )
}

function ObjectsTab({ objects, selectedId, onSelect, onAdd, onDelete, onDuplicate, onRename, selected, setPosition, isPro }) {
  return (
    <div>
      <p className="cl-tab-desc">Додай прості фігури в сцену, вибери одну зі списку (або клікни по ній у 3D-вʼюпорті) і подивись, як зміниться позиція. Хочеш зібрати щось складніше (будинок, фігурку) одразу — загляни на вкладку «Шаблони».</p>
      <HelpBox>
        <p>3D-сцена складається з окремих обʼєктів (мешів). Кожен має свою геометрію (форма), позицію в просторі (X — вправо/вліво, Y — вгору/вниз, Z — вперед/назад) і матеріал (як він виглядає — колір, блиск).</p>
        <p>Клікни лівою кнопкою миші по фігурі в 3D-вʼюпорті, щоб вибрати її — обраний обʼєкт підсвічується жовтим контуром. Перетягуй правою кнопкою / колесо миші, щоб обертати й наближати камеру.</p>
        <p>Складніші форми (будинок, людина) — це просто кілька простих фігур, поставлених поруч і пофарбованих по-різному. Кнопка ⧉ дублює обрану фігуру, щоб швидше зібрати схожі частини (наприклад другу ногу чи ще один пелюсток).</p>
        <p>Це той самий принцип, яким працюють справжні 3D-рушії (Blender, Unity, Unreal): складна модель — майже завжди "ієрархія" з десятків чи сотень простих мешів, а не одна суцільна форма. Освоївши тут позицію/обертання/масштаб для одного кубика, ви вже розумієте половину інтерфейсу будь-якого професійного 3D-редактора.</p>
      </HelpBox>

      <div className="cl-section-title">Додати фігуру</div>
      <div className="cl-btn-row">
        {PRIMITIVES.map((p) => (
          <button key={p.type} className="harmony-btn" onClick={() => onAdd(p.type)}>
            {p.icon} {p.label}
          </button>
        ))}
      </div>

      <div className="cl-section-title">Обʼєкти в сцені ({objects.length})</div>
      {objects.length === 0 ? (
        <p className="cl-tab-desc">Сцена порожня — додай фігуру вище або готовий шаблон.</p>
      ) : (
        <div className="l3d-object-list">
          {objects.map((o, i) => {
            const meta = PRIMITIVES.find((p) => p.type === o.type)
            return (
              <div key={o.id} className={'l3d-object-row' + (o.id === selectedId ? ' active' : '')}>
                <button className="l3d-object-select" onClick={() => onSelect(o.id)}>
                  {meta?.icon} {o.name || `${meta?.label || o.type} #${i + 1}`}
                </button>
                <button className="cl-mini-btn" onClick={() => onDuplicate(o.id)} title="Дублювати">⧉</button>
                <button className="cl-mini-btn" onClick={() => onDelete(o.id)} title="Видалити">✕</button>
              </div>
            )
          })}
        </div>
      )}

      {selected && (
        <>
          <div className="cl-section-title">Назва обраного обʼєкта</div>
          <input
            className="cl-hex-input"
            value={selected.name || ''}
            placeholder="Наприклад: Дах, Голова, Стебло…"
            onChange={(e) => onRename(e.target.value)}
            style={{ textTransform: 'none', marginBottom: 16 }}
          />

          <div className="cl-section-title">Позиція обраного обʼєкта</div>
          <AxisRow label="Position" values={selected.position} onChange={setPosition} min={-4} max={4} step={0.05} isPro={isPro} />
        </>
      )}
    </div>
  )
}

function TemplatesTab({ onAddTemplate, onClearScene }) {
  return (
    <div>
      <p className="cl-tab-desc">Готові композиції з кількох фігур одразу — швидкий старт, якщо хочеш зібрати щось впізнаване, а не лише один примітив.</p>
      <HelpBox>
        <p>Кожен шаблон додає одразу кілька обʼєктів (наприклад «стіни», «дах», «двері») з уже підібраними кольорами й позиціями. Далі кожну частину можна редагувати окремо — вибери її в списку на вкладці «Обʼєкти» й покрути, пересунь або перефарбуй.</p>
        <p>Шаблон додається поверх того, що вже є в сцені — необов'язково починати спочатку. Хочеш чисту сцену — натисни «Очистити сцену» нижче.</p>
        <p>Хороша вправа — додати шаблон, а потім спробувати "зламати" й перезібрати одну з частин по-своєму: трохи повернути дах, зробити вікна більшими, зсунути стовбур дерева. Так швидше зрозумієш, як саме кожна частина збирається, ніж просто розглядаючи готовий результат.</p>
      </HelpBox>

      <div className="l3d-template-grid">
        {TEMPLATES.map((t) => (
          <button key={t.id} className="l3d-template-card" onClick={() => onAddTemplate(t.id)}>
            <span className="l3d-template-icon">{t.icon}</span>
            <span className="l3d-template-label">{t.label}</span>
            <span className="l3d-template-count">{t.parts.length} частин</span>
          </button>
        ))}
      </div>

      <div className="cl-picker-top" style={{ marginTop: 20 }}>
        <button className="harmony-btn" onClick={onClearScene}>🗑 Очистити сцену</button>
      </div>
    </div>
  )
}

function TransformTab({ selected, setRotation, setScale, onResetTransform, isPro }) {
  if (!selected) return <p className="cl-tab-desc">Вибери обʼєкт на вкладці «Обʼєкти», щоб керувати його трансформацією.</p>
  return (
    <div>
      <p className="cl-tab-desc">Обертання (в градусах по кожній осі) і масштаб обраного обʼєкта.</p>
      <HelpBox>
        <p><b>Rotation</b> (обертання) повертає фігуру навколо її власного центру по осі X, Y або Z — спробуй покрутити Y, щоб побачити різницю між осями.</p>
        <p><b>Scale</b> (масштаб) розтягує чи стискає фігуру по кожній осі окремо: однакові X/Y/Z — рівномірне збільшення, різні — фігура «сплющується» чи витягується.</p>
        <p>Порядок важливий інтуїтивно, навіть якщо тут це не видно напряму: у "справжніх" 3D-рушіях трансформації застосовуються послідовно (спочатку масштаб, потім обертання, потім позиція) — тому обертання не по центру фігури, а навколо іншої точки (наприклад кінчика стрілки годинника) потребує додаткового "опорного" обʼєкта-батька. Тут усе простіше: кожен обʼєкт завжди обертається навколо власного геометричного центру.</p>
      </HelpBox>

      <div className="cl-section-title">Rotation (°)</div>
      <AxisRow label="Rotation" values={selected.rotation} onChange={setRotation} min={0} max={360} step={1} isPro={isPro} />

      <div className="cl-section-title">Scale</div>
      <AxisRow label="Scale" values={selected.scale} onChange={setScale} min={0.1} max={3} step={0.05} isPro={isPro} />

      <div className="cl-picker-top" style={{ marginTop: 16 }}>
        <button className="harmony-btn" onClick={onResetTransform}>↺ Скинути трансформацію</button>
      </div>
    </div>
  )
}

function MaterialTab({ selected, setMaterial }) {
  if (!selected) return <p className="cl-tab-desc">Вибери обʼєкт на вкладці «Обʼєкти», щоб редагувати матеріал.</p>
  const m = selected.material
  return (
    <div>
      <p className="cl-tab-desc">Колір і фізичні властивості поверхні обраного обʼєкта (PBR-матеріал — той самий принцип, що в Figma, Blender чи іграх).</p>
      <HelpBox>
        <ul>
          <li><b>Metalness</b> — наскільки поверхня «металева»: 0 — пластик/камінь, 1 — метал (дзеркальні відблиски замість кольорового світла).</li>
          <li><b>Roughness</b> — шорсткість: 0 — гладка й глянцева (чіткі відблиски), 1 — матова (розмите світло).</li>
          <li><b>Wireframe</b> — показує тільки каркас з ребер, без заливки поверхні — зручно, щоб побачити геометрію під формою.</li>
          <li><b>Opacity</b> — прозорість: 1 — непрозоро, менше — просвічує наскрізь.</li>
        </ul>
        <p>Це называється PBR (physically based rendering) — модель матеріалу, побудована на тому, як світло реально поводиться на поверхнях, а не на "намальованому" вигляді. Саме тому зміна Metalness/Roughness виглядає правдоподібно під будь-яким освітленням (спробуйте перейти на вкладку «Освітлення» й порівняти той самий матеріал удень і вночі).</p>
      </HelpBox>

      <div className="cl-picker-top">
        <input type="color" className="cl-swatch-input" value={m.color} onChange={(e) => setMaterial('color', e.target.value)} />
        <input
          className="cl-hex-input"
          value={m.color}
          onChange={(e) => setMaterial('color', e.target.value)}
        />
      </div>

      <div className="cl-editrow">
        <label>Metalness
          <input type="range" min={0} max={1} step={0.01} value={m.metalness} onChange={(e) => setMaterial('metalness', parseFloat(e.target.value))} />
          <span>{m.metalness.toFixed(2)}</span>
        </label>
      </div>
      <div className="cl-editrow">
        <label>Roughness
          <input type="range" min={0} max={1} step={0.01} value={m.roughness} onChange={(e) => setMaterial('roughness', parseFloat(e.target.value))} />
          <span>{m.roughness.toFixed(2)}</span>
        </label>
      </div>
      <div className="cl-editrow">
        <label>Opacity
          <input type="range" min={0.05} max={1} step={0.01} value={m.opacity} onChange={(e) => setMaterial('opacity', parseFloat(e.target.value))} />
          <span>{m.opacity.toFixed(2)}</span>
        </label>
      </div>
      <div className="cl-editrow">
        <label>
          <input type="checkbox" checked={m.wireframe} onChange={(e) => setMaterial('wireframe', e.target.checked)} />
          Wireframe
        </label>
      </div>
    </div>
  )
}

function LightingTab({ lighting, setLighting }) {
  return (
    <div>
      <p className="cl-tab-desc">Освітлення сцени — пресети, що одразу міняють настрій: яскраву студію, денне світло, захід сонця або ніч.</p>
      <HelpBox>
        <p>Сцена складається з трьох джерел світла: <b>Ambient</b> (ambient light) — рівномірно освітлює все без напрямку й тіней, не дає сцені провалитись у чорноту там, куди не падає пряме світло; <b>Key</b> (основне) — найяскравіше, задає напрямок головних тіней і відблисків; <b>Fill</b> (заповнювальне) — слабше світло з протилежного боку, пом'якшує тіні від Key, щоб вони не були суцільно чорними.</p>
        <p>Це класична трьохточкова схема освітлення (three-point lighting) із фото- та кіностудій, спрощена до мінімуму. Колір Key/Fill теж має значення: теплий (жовтогарячий) Key проти холодного (синього) Fill — як природне сонячне світло проти розсіяного блакитного неба — робить матеріали живішими, ніж два однаково білих джерела.</p>
      </HelpBox>

      <div className="cl-section-title">Пресет</div>
      <div className="l3d-template-grid">
        {LIGHT_PRESETS.map((p) => (
          <button key={p.key} className={'l3d-template-card' + (lighting === p.key ? ' active' : '')} onClick={() => setLighting(p.key)}>
            <span className="l3d-template-icon">{p.icon}</span>
            <span className="l3d-template-label">{p.label}</span>
          </button>
        ))}
      </div>
      <p className="cl-tab-desc">Поверніться на вкладку «Матеріал» і порівняйте, як Metalness/Roughness виглядають під різним освітленням — той самий матеріал реагує по-різному.</p>
    </div>
  )
}

function sceneToThreeSnippet(objects) {
  const lines = objects.map((o, i) => {
    const geomArgs = { box: '1, 1, 1', sphere: '0.65, 32, 20', cone: '0.65, 1.3, 32', cylinder: '0.6, 0.6, 1.2, 32', torus: '0.55, 0.22, 20, 48', plane: '1.3, 1.3' }[o.type] || '1, 1, 1'
    const geomClass = { box: 'BoxGeometry', sphere: 'SphereGeometry', cone: 'ConeGeometry', cylinder: 'CylinderGeometry', torus: 'TorusGeometry', plane: 'PlaneGeometry' }[o.type] || 'BoxGeometry'
    const comment = o.name ? `// ${o.name}\n` : ''
    return `${comment}const mesh${i} = new THREE.Mesh(\n  new THREE.${geomClass}(${geomArgs}),\n  new THREE.MeshStandardMaterial({ color: '${o.material.color}', metalness: ${o.material.metalness}, roughness: ${o.material.roughness}, wireframe: ${o.material.wireframe}, transparent: ${o.material.opacity < 1}, opacity: ${o.material.opacity} })\n)\nmesh${i}.position.set(${o.position.x}, ${o.position.y}, ${o.position.z})\nmesh${i}.rotation.set(${(o.rotation.x * Math.PI / 180).toFixed(3)}, ${(o.rotation.y * Math.PI / 180).toFixed(3)}, ${(o.rotation.z * Math.PI / 180).toFixed(3)})\nmesh${i}.scale.set(${o.scale.x}, ${o.scale.y}, ${o.scale.z})\nscene.add(mesh${i})`
  })
  return lines.join('\n\n')
}

function ExportTab({ objects, getScreenshot }) {
  const json = JSON.stringify(objects, null, 2)
  const snippet = sceneToThreeSnippet(objects)
  return (
    <div>
      <p className="cl-tab-desc">Забери сцену з собою: скріншот для показу, JSON з точними значеннями, або готовий фрагмент коду Three.js.</p>
      <HelpBox>
        <p>Скріншот — картинка поточного виду камери (той самий кут, під яким дивишся зараз). JSON — усі обʼєкти з їхніми позиціями/обертаннями/матеріалами як дані. Three.js-фрагмент — робочий код, який відтворює цю сцену в реальному проєкті на Three.js.</p>
        <p>JSON корисний не лише для бекапу: якщо захочете повернутись до цієї сцени пізніше або поділитись точними координатами з кимось іншим, цей формат зберігає все до останнього десяткового знаку — на відміну від скріншоту, який фіксує лише те, як сцена виглядала з поточного кута камери.</p>
      </HelpBox>
      <div className="cl-section-title">Файли</div>
      <div className="cl-picker-top">
        <button className="harmony-btn" onClick={() => downloadDataUrl(getScreenshot(), 'scene.png')}>⬇ PNG</button>
        <button className="harmony-btn" onClick={() => downloadText(json, 'scene.json', 'application/json')}>⬇ JSON</button>
      </div>
      <div className="cl-section-title">Текст</div>
      <div className="cl-picker-top">
        <button className="harmony-btn" onClick={() => copy(json)}>Copy JSON</button>
        <button className="harmony-btn" onClick={() => copy(snippet)}>Copy Three.js code</button>
      </div>
      <pre className="cl-code-block">{snippet || '// Додай обʼєкт на вкладці «Обʼєкти»'}</pre>
    </div>
  )
}

export default function Lab3D() {
  const [objects, setObjectsState] = useState(() => [makeObject('box')])
  const [selectedId, setSelectedIdState] = useState(() => objects[0]?.id ?? null)
  const [lighting, setLighting] = useState('studio')
  const [tab, setTab] = useState('objects')

  const containerRef = useRef(null)
  const sceneApiRef = useRef(null)
  const objectsRef = useRef(objects)
  const selectedIdRef = useRef(selectedId)
  const debounceRef = useRef(null)

  const hist = useLabHistory({ objects, selectedId })

  function scheduleHistoryCommit() {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      hist.set({ objects: objectsRef.current, selectedId: selectedIdRef.current })
    }, 400)
  }

  function applyObjects(next, opts = {}) {
    objectsRef.current = next
    setObjectsState(next)
    if (!opts.silent) scheduleHistoryCommit()
  }
  function applySelected(id) {
    selectedIdRef.current = id
    setSelectedIdState(id)
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
    objectsRef.current = hist.value.objects
    selectedIdRef.current = hist.value.selectedId
    setObjectsState(hist.value.objects)
    setSelectedIdState(hist.value.selectedId)
  }, [hist.value])

  const labMode = useLabMode()
  const toastApi = useLabToast()
  const { push: pushRecentLab } = useLabRecent('lab')
  useEffect(() => {
    pushRecentLab('3d')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Mount the Three.js scene once; sync it to whatever `objects`/`selectedId`
  // currently are on every change, and dispose everything on unmount.
  useEffect(() => {
    if (!containerRef.current) return
    const api = createThreeScene(containerRef.current)
    sceneApiRef.current = api
    api.sync(objectsRef.current, selectedIdRef.current)
    function handleClick(e) {
      const id = api.pickAt(e.clientX, e.clientY)
      if (id) applySelected(id)
    }
    containerRef.current.addEventListener('click', handleClick)
    return () => {
      containerRef.current?.removeEventListener('click', handleClick)
      api.dispose()
      sceneApiRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    sceneApiRef.current?.sync(objects, selectedId)
  }, [objects, selectedId])

  useEffect(() => {
    sceneApiRef.current?.setLighting(lighting)
  }, [lighting])

  const selected = useMemo(() => objects.find((o) => o.id === selectedId) || null, [objects, selectedId])

  function addObject(type) {
    const obj = makeObject(type)
    const next = [...objectsRef.current, obj]
    applyObjects(next)
    applySelected(obj.id)
    toastApi.show('✓ Обʼєкт додано')
  }
  function deleteObject(id) {
    const next = objectsRef.current.filter((o) => o.id !== id)
    applyObjects(next)
    if (selectedIdRef.current === id) applySelected(next[0]?.id ?? null)
  }
  function duplicateObject(id) {
    const obj = objectsRef.current.find((o) => o.id === id)
    if (!obj) return
    const clone = {
      ...obj,
      id: nextId(),
      name: obj.name ? `${obj.name} (копія)` : null,
      position: { ...obj.position, x: obj.position.x + 0.4 },
    }
    const next = [...objectsRef.current, clone]
    applyObjects(next)
    applySelected(clone.id)
    toastApi.show('✓ Обʼєкт здубльовано')
  }
  function renameSelected(name) {
    patchSelected(() => ({ name: name || null }))
  }
  function addTemplate(templateId) {
    const tpl = TEMPLATES.find((t) => t.id === templateId)
    if (!tpl) return
    const newObjs = tpl.parts.map(makeObjectFromRecipe)
    const next = [...objectsRef.current, ...newObjs]
    applyObjects(next)
    applySelected(newObjs[newObjs.length - 1].id)
    toastApi.show(`✓ Додано: ${tpl.label}`)
  }
  function clearScene() {
    applyObjects([])
    applySelected(null)
    toastApi.show('✓ Сцену очищено')
  }
  function patchSelected(patch) {
    if (!selectedIdRef.current) return
    const next = objectsRef.current.map((o) => (o.id === selectedIdRef.current ? { ...o, ...patch(o) } : o))
    applyObjects(next)
  }
  function setPosition(axis, value) {
    patchSelected((o) => ({ position: { ...o.position, [axis]: value } }))
  }
  function setRotation(axis, value) {
    patchSelected((o) => ({ rotation: { ...o.rotation, [axis]: value } }))
  }
  function setScale(axis, value) {
    patchSelected((o) => ({ scale: { ...o.scale, [axis]: value } }))
  }
  function setMaterial(key, value) {
    patchSelected((o) => ({ material: { ...o.material, [key]: value } }))
  }
  function resetTransform() {
    patchSelected(() => ({ rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }))
  }

  useLabShortcuts({
    onUndo: hist.canUndo ? handleUndo : undefined,
    onRedo: hist.canRedo ? handleRedo : undefined,
  })

  return (
    <LabShell
      title="3D Lab"
      subtitle="Легкі 3D-обʼєкти прямо в браузері: готові шаблони (будинок, людина, рослина, іграшка) або окремі фігури — керуй позицією, обертанням, матеріалом і освітленням, експортуй сцену."
      icon="🧊"
      mode={labMode.mode}
      onToggleMode={labMode.toggle}
      canUndo={hist.canUndo}
      canRedo={hist.canRedo}
      onUndo={handleUndo}
      onRedo={handleRedo}
      toast={toastApi.toast}
      extra={
        <LabInfoTip title="Керування камерою">
          Ліва кнопка миші по фігурі — вибрати обʼєкт. Перетягування правою кнопкою — обертати камеру. Колесо миші — наблизити/віддалити.
        </LabInfoTip>
      }
    >
      <div className="cl l3d">
        <div ref={containerRef} className="l3d-viewport" />
        <div className="cl-tabs">
          {TABS.map((t) => (
            <button key={t.key} className={'cl-tab' + (tab === t.key ? ' active' : '')} onClick={() => setTab(t.key)}>
              <span className="cl-tab-icon">{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
        <div className="cl-panel">
          {tab === 'objects' && (
            <ObjectsTab
              objects={objects}
              selectedId={selectedId}
              selected={selected}
              onSelect={applySelected}
              onAdd={addObject}
              onDelete={deleteObject}
              onDuplicate={duplicateObject}
              onRename={renameSelected}
              setPosition={setPosition}
              isPro={labMode.isPro}
            />
          )}
          {tab === 'templates' && <TemplatesTab onAddTemplate={addTemplate} onClearScene={clearScene} />}
          {tab === 'transform' && (
            <TransformTab selected={selected} setRotation={setRotation} setScale={setScale} onResetTransform={resetTransform} isPro={labMode.isPro} />
          )}
          {tab === 'material' && <MaterialTab selected={selected} setMaterial={setMaterial} />}
          {tab === 'lighting' && <LightingTab lighting={lighting} setLighting={setLighting} />}
          {tab === 'export' && <ExportTab objects={objects} getScreenshot={() => sceneApiRef.current?.screenshot()} />}
        </div>
      </div>
    </LabShell>
  )
}
