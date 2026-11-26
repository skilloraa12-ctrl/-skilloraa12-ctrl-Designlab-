// Three.js scene wrapper for ThreeDAnimEditor.jsx — intentionally separate
// from labs/threeScene.js (which stays untouched for Lab3D/Game Art Studio).
// The key difference: threeScene.js's sync() tears down and rebuilds every
// mesh on every call, which is fine for occasional edits but would cause
// stutter/GC churn called 30-60x/sec during animation playback. This wrapper
// keeps a persistent id→node map: syncStructure() only rebuilds a node when
// its `type` actually changed (material/light props are patched in place),
// and the cheap setPose() just updates an existing node's transform — safe
// to call every animation frame.
//
// Nodes can be a Mesh (box/sphere/...) or a THREE.PointLight/SpotLight —
// point/spot lights are real, animatable scene objects here, not just the
// fixed 3-light "Освітлення" preset rig (which stays separate, same as in
// Lab3D). A spotlight's aim direction is derived from its `rotation` field
// (same mental model as any other object) by pointing its `.target` at a
// computed point in front of it — Three.js itself reads the cone direction
// from `target.position`, not from `.rotation`, which is why this indirection
// exists; it's an in-app-only convenience, so a spotlight's aim is NOT
// preserved by the glTF export (see ThreeDAnimEditor.jsx's export tab note).
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const GEOMETRY_BUILDERS = {
  box: () => new THREE.BoxGeometry(1, 1, 1),
  sphere: () => new THREE.SphereGeometry(0.65, 32, 20),
  cone: () => new THREE.ConeGeometry(0.65, 1.3, 32),
  cylinder: () => new THREE.CylinderGeometry(0.6, 0.6, 1.2, 32),
  torus: () => new THREE.TorusGeometry(0.55, 0.22, 20, 48),
  plane: () => new THREE.PlaneGeometry(1.3, 1.3),
  capsule: () => new THREE.CapsuleGeometry(0.42, 0.75, 4, 16),
  tetrahedron: () => new THREE.TetrahedronGeometry(0.8),
  octahedron: () => new THREE.OctahedronGeometry(0.75),
  icosahedron: () => new THREE.IcosahedronGeometry(0.75),
  dodecahedron: () => new THREE.DodecahedronGeometry(0.68),
  torusKnot: () => new THREE.TorusKnotGeometry(0.42, 0.15, 100, 16),
}

const LIGHT_TYPES = new Set(['pointLight', 'spotLight'])

// «Своя форма»: обʼєкт, форму якого задає сам користувач точками контуру
// (2D-профіль) — або видавлюванням полігона на глибину, або обертанням
// профілю навколо вертикальної осі (як на гончарному крузі).
export const CUSTOM_SHAPE = { type: 'custom', label: 'Своя форма', icon: '✏️' }

export const DEFAULT_PROFILE = {
  mode: 'lathe',
  depth: 0.6,
  points: {
    lathe: [{ x: 0, y: -0.65 }, { x: 0.55, y: -0.65 }, { x: 0.35, y: -0.2 }, { x: 0.6, y: 0.3 }, { x: 0.3, y: 0.65 }, { x: 0, y: 0.65 }],
    extrude: [{ x: 0, y: 0.7 }, { x: 0.2, y: 0.2 }, { x: 0.7, y: 0.15 }, { x: 0.3, y: -0.15 }, { x: 0.45, y: -0.65 }, { x: 0, y: -0.35 }, { x: -0.45, y: -0.65 }, { x: -0.3, y: -0.15 }, { x: -0.7, y: 0.15 }, { x: -0.2, y: 0.2 }],
  },
}

// Еквівалентні контури стандартних фігур — щоб будь-яку з них можна було
// редагувати 2D-контуром так само, як «Свою форму» (перше редагування
// контуру перетворює фігуру на «Свою форму» з тим самим виглядом).
// Тор/тетраедр/ікосаедр/додекаедр/вузол тора контуром не описуються —
// у них лишається редагування точок у вʼюпорті.
function arc(cx, cy, r, from, to, steps) {
  const out = []
  for (let i = 0; i <= steps; i++) {
    const a = THREE.MathUtils.degToRad(from + ((to - from) * i) / steps)
    out.push({ x: Math.round(Math.max(0, cx + Math.cos(a) * r) * 1000) / 1000, y: Math.round((cy + Math.sin(a) * r) * 1000) / 1000 })
  }
  return out
}
const square = (h) => [{ x: -h, y: -h }, { x: h, y: -h }, { x: h, y: h }, { x: -h, y: h }]
export const PRIMITIVE_PROFILES = {
  box: () => ({ mode: 'extrude', depth: 1, bevel: false, points: { extrude: square(0.5) } }),
  plane: () => ({ mode: 'extrude', depth: 0.02, bevel: false, points: { extrude: square(0.65) } }),
  cylinder: () => ({ mode: 'lathe', segments: 32, points: { lathe: [{ x: 0, y: -0.6 }, { x: 0.6, y: -0.6 }, { x: 0.6, y: 0.6 }, { x: 0, y: 0.6 }] } }),
  cone: () => ({ mode: 'lathe', segments: 32, points: { lathe: [{ x: 0, y: -0.65 }, { x: 0.65, y: -0.65 }, { x: 0, y: 0.65 }] } }),
  sphere: () => ({ mode: 'lathe', segments: 32, points: { lathe: arc(0, 0, 0.65, -90, 90, 16) } }),
  capsule: () => ({ mode: 'lathe', segments: 16, points: { lathe: [...arc(0, -0.375, 0.42, -90, 0, 6), ...arc(0, 0.375, 0.42, 0, 90, 6)] } }),
  octahedron: () => ({ mode: 'lathe', segments: 4, points: { lathe: [{ x: 0, y: -0.75 }, { x: 0.75, y: 0 }, { x: 0, y: 0.75 }] } }),
}

function buildCustomGeometry(profile) {
  const p = profile || DEFAULT_PROFILE
  if (p.mode === 'extrude') {
    const pts = p.points?.extrude || DEFAULT_PROFILE.points.extrude
    const shape = new THREE.Shape(pts.map((v) => new THREE.Vector2(v.x, v.y)))
    const depth = p.depth || 0.6
    // «Округлені краї» (bevel) — фаска навколо контуру, щоб намальована
    // форма виглядала обʼємною й мʼякою, а не вирізаною з картону.
    const bevel = p.bevel ? Math.min(0.12, depth / 3) : 0
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth, curveSegments: 1,
      bevelEnabled: !!p.bevel, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 4,
    })
    geo.translate(0, 0, -depth / 2)
    return geo
  }
  const pts = p.points?.lathe || DEFAULT_PROFILE.points.lathe
  const segments = Math.max(3, Math.min(96, Math.round(p.segments || 48)))
  const geo = new THREE.LatheGeometry(pts.map((v) => new THREE.Vector2(Math.max(0, v.x), v.y)), segments)
  if (segments > 12) return geo
  // Low-poly: пласкі грані замість згладжування, щоб багатогранник
  // виглядав гранованим (як справжній октаедр/кристал).
  const flat = geo.toNonIndexed()
  geo.dispose()
  flat.computeVertexNormals()
  return flat
}

// Ключ точки = її початкова (до редагування) позиція, округлена до 0.001.
// Усі вершини геометрії з однаковою позицією (шви сфери, ребра куба, де
// кожна грань має власні вершини) зливаються в одну «точку», тож рух точки
// ніколи не розриває поверхню. Нормалізує -0 → 0, щоб дзеркальний ключ
// (симетрія по X) завжди збігався.
function roundKey(v) {
  const n = Math.round(v * 1000) / 1000
  return (n === 0 ? 0 : n).toFixed(3)
}
export function pointKey(x, y, z) {
  return `${roundKey(x)},${roundKey(y)},${roundKey(z)}`
}

function baseSignature(obj) {
  return obj.type === 'custom' ? `custom:${JSON.stringify(obj.profile || null)}` : obj.type
}
function geometrySignature(obj) {
  return `${baseSignature(obj)}|${JSON.stringify(obj.vertexEdits || null)}`
}

export const PRIMITIVES = [
  { type: 'box', label: 'Куб', icon: '🧊' },
  { type: 'sphere', label: 'Сфера', icon: '⚪' },
  { type: 'cone', label: 'Конус', icon: '🔺' },
  { type: 'cylinder', label: 'Циліндр', icon: '🛢️' },
  { type: 'torus', label: 'Тор', icon: '🍩' },
  { type: 'plane', label: 'Площина', icon: '▭' },
  { type: 'capsule', label: 'Капсула', icon: '💊' },
  { type: 'tetrahedron', label: 'Тетраедр', icon: '🔻' },
  { type: 'octahedron', label: 'Октаедр', icon: '🔷' },
  { type: 'icosahedron', label: 'Ікосаедр', icon: '💎' },
  { type: 'dodecahedron', label: 'Додекаедр', icon: '⬡' },
  { type: 'torusKnot', label: 'Вузол тора', icon: '🌀' },
]

export const LIGHT_KINDS = [
  { type: 'pointLight', label: 'Точкове світло', icon: '💡' },
  { type: 'spotLight', label: 'Прожектор', icon: '🔦' },
]

export const LIGHT_PRESETS = [
  { key: 'studio', icon: '💡', label: 'Студія', ambient: 0.55, keyIntensity: 1.1, keyColor: '#ffffff', fillIntensity: 0.35, fillColor: '#8fa3ff', bg: '#16161d' },
  { key: 'day', icon: '☀️', label: 'День', ambient: 0.75, keyIntensity: 1.4, keyColor: '#fff6e0', fillIntensity: 0.5, fillColor: '#bcd4ff', bg: '#1c2b3d' },
  { key: 'sunset', icon: '🌇', label: 'Захід', ambient: 0.4, keyIntensity: 1.0, keyColor: '#ff8a3d', fillIntensity: 0.3, fillColor: '#5a3df0', bg: '#241a2e' },
  { key: 'night', icon: '🌙', label: 'Ніч', ambient: 0.18, keyIntensity: 0.5, keyColor: '#6a7cff', fillIntensity: 0.25, fillColor: '#2e2e55', bg: '#0b0b12' },
]

export const CAMERA_VIEWS = [
  { key: 'iso', icon: '◆', label: 'Ізометрія', position: [3.2, 2.6, 4.4] },
  { key: 'front', icon: '⬜', label: 'Спереду', position: [0, 1.2, 6] },
  { key: 'side', icon: '◧', label: 'Збоку', position: [6, 1.2, 0] },
  { key: 'top', icon: '⬛', label: 'Зверху', position: [0.001, 7, 0.001] },
]

export function createAnimScene(container, opts = {}) {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x16161d)

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
  camera.position.set(3.2, 2.6, 4.4)

  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: !!opts.alpha })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  container.appendChild(renderer.domElement)

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.minDistance = 1.6
  controls.maxDistance = 16

  const ambient = new THREE.AmbientLight(0xffffff, 0.55)
  scene.add(ambient)
  const key = new THREE.DirectionalLight(0xffffff, 1.1)
  key.position.set(4, 6, 5)
  scene.add(key)
  const fill = new THREE.DirectionalLight(0x8fa3ff, 0.35)
  fill.position.set(-5, -2, -4)
  scene.add(fill)

  scene.add(new THREE.GridHelper(10, 20, 0x3a3a46, 0x24242c))

  const group = new THREE.Group()
  scene.add(group)

  const nodeMap = new Map() // id -> THREE.Mesh | THREE.Light
  let selectionHelper = null

  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()

  // Незмінена (базова) геометрія кожного типу/профілю + її злиті точки —
  // кешується, щоб кожен рух точки лише клонував базу й додавав зсуви.
  const baseCache = new Map() // signature -> { geometry, points: [{ key, x, y, z, indices }] }
  function getBase(obj) {
    const sig = baseSignature(obj)
    let entry = baseCache.get(sig)
    if (entry) return entry
    const geometry = obj.type === 'custom' ? buildCustomGeometry(obj.profile) : (GEOMETRY_BUILDERS[obj.type] || GEOMETRY_BUILDERS.box)()
    const pos = geometry.attributes.position
    const byKey = new Map()
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i)
      const key = pointKey(x, y, z)
      let pt = byKey.get(key)
      if (!pt) { pt = { key, x, y, z, indices: [] }; byKey.set(key, pt) }
      pt.indices.push(i)
    }
    entry = { geometry, points: [...byKey.values()] }
    baseCache.set(sig, entry)
    return entry
  }
  function buildGeometry(obj) {
    const base = getBase(obj)
    const geo = base.geometry.clone()
    const edits = obj.vertexEdits
    if (edits && Object.keys(edits).length > 0) {
      const pos = geo.attributes.position
      for (const pt of base.points) {
        const d = edits[pt.key]
        if (!d) continue
        for (const i of pt.indices) pos.setXYZ(i, pt.x + d.x, pt.y + d.y, pt.z + d.z)
      }
      pos.needsUpdate = true
      geo.computeVertexNormals()
      geo.computeBoundingSphere()
      geo.computeBoundingBox()
    }
    return geo
  }

  // ── Редагування форми по точках ──────────────────────────────────────
  // Маркери точок — THREE.Points дочірній до обраного меша (тож вони
  // слідують за його позицією/обертанням/масштабом і під час анімації).
  // Вибір точки — у просторі екрана (найближча в радіусі ~14px), що
  // надійніше за raycast по дрібних точках.
  let handles = null // { id, points: THREE.Points, keys: [] }
  let drag = null // { plane, startLocal, node }

  function clearHandles() {
    if (!handles) return
    handles.points.parent?.remove(handles.points)
    handles.points.geometry.dispose()
    handles.points.material.dispose()
    handles = null
  }
  function showPointHandles(id, edits, selectedKey) {
    clearHandles()
    const node = nodeMap.get(id)
    if (!node || node.isLight || !node.userData.obj) return
    const base = getBase(node.userData.obj)
    const n = base.points.length
    const positions = new Float32Array(n * 3)
    const colors = new Float32Array(n * 3)
    const keys = []
    base.points.forEach((pt, i) => {
      const d = edits?.[pt.key]
      positions[i * 3] = pt.x + (d?.x || 0)
      positions[i * 3 + 1] = pt.y + (d?.y || 0)
      positions[i * 3 + 2] = pt.z + (d?.z || 0)
      const c = pt.key === selectedKey ? [1, 0.82, 0.25] : d ? [0.55, 0.95, 1] : [1, 1, 1]
      colors.set(c, i * 3)
      keys.push(pt.key)
    })
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    const mat = new THREE.PointsMaterial({ size: 8, sizeAttenuation: false, vertexColors: true, depthTest: false, transparent: true })
    const pts = new THREE.Points(geo, mat)
    pts.renderOrder = 999
    pts.userData.isHandles = true
    pts.raycast = () => {} // не заважає вибору обʼєктів кліком
    node.add(pts)
    handles = { id, points: pts, keys }
  }

  function setPointer(clientX, clientY) {
    const rect = renderer.domElement.getBoundingClientRect()
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1
    return rect
  }

  function pickPoint(clientX, clientY) {
    if (!handles) return null
    const rect = renderer.domElement.getBoundingClientRect()
    const pos = handles.points.geometry.attributes.position
    handles.points.updateMatrixWorld()
    const v = new THREE.Vector3()
    let best = null
    let bestDist = 14
    let bestDepth = Infinity
    for (let i = 0; i < pos.count; i++) {
      v.set(pos.getX(i), pos.getY(i), pos.getZ(i)).applyMatrix4(handles.points.matrixWorld).project(camera)
      if (v.z > 1) continue
      const sx = (v.x + 1) / 2 * rect.width + rect.left
      const sy = (1 - v.y) / 2 * rect.height + rect.top
      const dist = Math.hypot(sx - clientX, sy - clientY)
      if (dist < bestDist - 2 || (dist < bestDist + 2 && v.z < bestDepth)) {
        best = handles.keys[i]
        bestDist = Math.min(dist, bestDist)
        bestDepth = v.z
      }
    }
    return best
  }

  function currentLocal(node, key, edits) {
    const pt = getBase(node.userData.obj).points.find((p) => p.key === key)
    if (!pt) return null
    const d = edits?.[key]
    return new THREE.Vector3(pt.x + (d?.x || 0), pt.y + (d?.y || 0), pt.z + (d?.z || 0))
  }

  // Починає перетягування точки: площина руху проходить через точку й
  // дивиться на камеру — тож точка рухається «по екрану» з будь-якого
  // ракурсу. Повертає false, якщо точку не знайдено.
  function beginPointDrag(id, key, edits) {
    const node = nodeMap.get(id)
    if (!node) return false
    const local = currentLocal(node, key, edits)
    if (!local) return false
    node.updateMatrixWorld()
    const world = node.localToWorld(local.clone())
    const normal = new THREE.Vector3()
    camera.getWorldDirection(normal)
    drag = { node, plane: new THREE.Plane().setFromNormalAndCoplanarPoint(normal, world), startLocal: local }
    return true
  }
  // Зсув точки (у локальних координатах обʼєкта) від початку перетягування.
  function dragPointTo(clientX, clientY) {
    if (!drag) return null
    setPointer(clientX, clientY)
    raycaster.setFromCamera(pointer, camera)
    const hit = new THREE.Vector3()
    if (!raycaster.ray.intersectPlane(drag.plane, hit)) return null
    drag.node.updateMatrixWorld()
    const local = drag.node.worldToLocal(hit)
    return { x: local.x - drag.startLocal.x, y: local.y - drag.startLocal.y, z: local.z - drag.startLocal.z }
  }
  function endPointDrag() {
    drag = null
  }
  function getPoints(id) {
    const node = nodeMap.get(id)
    if (!node || node.isLight || !node.userData.obj) return []
    return getBase(node.userData.obj).points.map(({ key, x, y, z }) => ({ key, x, y, z }))
  }

  function resize() {
    const w = container.clientWidth
    const h = container.clientHeight
    if (!w || !h) return
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
  }
  resize()
  const ro = new ResizeObserver(resize)
  ro.observe(container)

  let raf = null
  function loop() {
    raf = requestAnimationFrame(loop)
    controls.update()
    renderer.render(scene, camera)
  }
  loop()

  function buildMaterial(material, type) {
    const side = type === 'plane' ? THREE.DoubleSide : THREE.FrontSide
    return new THREE.MeshStandardMaterial({
      color: material.color,
      metalness: material.metalness,
      roughness: material.roughness,
      wireframe: material.wireframe,
      transparent: material.opacity < 1,
      opacity: material.opacity,
      side,
    })
  }

  function patchMaterial(mesh, material) {
    const m = mesh.material
    m.color.set(material.color)
    m.metalness = material.metalness
    m.roughness = material.roughness
    m.wireframe = material.wireframe
    m.transparent = material.opacity < 1
    m.opacity = material.opacity
    m.needsUpdate = true
  }

  function buildLightMarker(color) {
    const marker = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 8), new THREE.MeshBasicMaterial({ color }))
    marker.userData.isMarker = true
    return marker
  }

  function patchLight(node, light) {
    node.color.set(light.color)
    node.intensity = light.intensity
    node.distance = light.distance
    node.decay = light.decay
    if (node.isSpotLight) {
      node.angle = THREE.MathUtils.degToRad(light.angle)
      node.penumbra = light.penumbra
    }
    const marker = node.children.find((c) => c.userData.isMarker)
    if (marker) marker.material.color.set(light.color)
  }

  // Spotlight cone direction in Three.js is derived from target.position,
  // not from the light's own .rotation — this computes a target point in
  // front of the light along the rotation's forward vector, same mental
  // model as "rotation" for any other object in this editor.
  function applyLightAim(light, position, rotationDeg) {
    if (!light.target) return
    const euler = new THREE.Euler(
      THREE.MathUtils.degToRad(rotationDeg.x),
      THREE.MathUtils.degToRad(rotationDeg.y),
      THREE.MathUtils.degToRad(rotationDeg.z)
    )
    const dir = new THREE.Vector3(0, 0, -1).applyEuler(euler)
    light.target.position.set(position.x + dir.x * 2, position.y + dir.y * 2, position.z + dir.z * 2)
  }

  function buildNode(obj) {
    if (obj.type === 'pointLight') {
      const light = new THREE.PointLight(obj.light.color, obj.light.intensity, obj.light.distance, obj.light.decay)
      light.add(buildLightMarker(obj.light.color))
      return light
    }
    if (obj.type === 'spotLight') {
      const light = new THREE.SpotLight(obj.light.color, obj.light.intensity, obj.light.distance, THREE.MathUtils.degToRad(obj.light.angle), obj.light.penumbra, obj.light.decay)
      light.add(buildLightMarker(obj.light.color))
      return light
    }
    const geometry = buildGeometry(obj)
    const material = buildMaterial(obj.material, obj.type)
    return new THREE.Mesh(geometry, material)
  }

  function removeNode(id) {
    const node = nodeMap.get(id)
    if (!node) return
    if (handles?.id === id) clearHandles()
    group.remove(node)
    if (node.target) group.remove(node.target)
    if (node.isLight) {
      const marker = node.children.find((c) => c.userData.isMarker)
      if (marker) {
        marker.geometry.dispose()
        marker.material.dispose()
      }
    } else {
      node.geometry.dispose()
      node.material.dispose()
    }
    nodeMap.delete(id)
  }

  function updateSelectionOutline(selectedId) {
    if (selectionHelper) {
      selectionHelper.parent?.remove(selectionHelper)
      selectionHelper.geometry.dispose()
      selectionHelper.material.dispose()
      selectionHelper = null
    }
    const node = nodeMap.get(selectedId)
    if (!node) return
    const target = node.isLight ? node.children.find((c) => c.userData.isMarker) : node
    if (!target || !target.geometry) return
    selectionHelper = new THREE.LineSegments(new THREE.EdgesGeometry(target.geometry), new THREE.LineBasicMaterial({ color: 0xffd23f }))
    target.add(selectionHelper)
  }

  // Structural sync: adds/removes nodes, rebuilds only when a node's `type`
  // actually changed, patches material/light props in place otherwise, and
  // applies each object's own base transform (used outside playback — during
  // playback, setPose() overrides this per frame instead).
  function syncStructure(objects, selectedId) {
    const ids = new Set(objects.map((o) => o.id))
    for (const id of [...nodeMap.keys()]) {
      if (!ids.has(id)) removeNode(id)
    }
    for (const obj of objects) {
      let node = nodeMap.get(obj.id)
      if (!node || node.userData.type !== obj.type) {
        if (node) removeNode(obj.id)
        node = buildNode(obj)
        node.userData.type = obj.type
        node.userData.geoSig = geometrySignature(obj)
        node.userData.id = obj.id
        node.name = obj.id
        group.add(node)
        if (node.target) group.add(node.target)
        nodeMap.set(obj.id, node)
      } else if (LIGHT_TYPES.has(obj.type)) {
        patchLight(node, obj.light)
      } else {
        patchMaterial(node, obj.material)
        const sig = geometrySignature(obj)
        if (node.userData.geoSig !== sig) {
          if (handles?.id === obj.id) clearHandles()
          if (selectionHelper?.parent === node) {
            node.remove(selectionHelper)
            selectionHelper.geometry.dispose()
            selectionHelper.material.dispose()
            selectionHelper = null
          }
          node.geometry.dispose()
          node.geometry = buildGeometry(obj)
          node.userData.geoSig = sig
        }
      }
      node.userData.obj = obj
      node.position.set(obj.position.x, obj.position.y, obj.position.z)
      node.rotation.set(
        THREE.MathUtils.degToRad(obj.rotation.x),
        THREE.MathUtils.degToRad(obj.rotation.y),
        THREE.MathUtils.degToRad(obj.rotation.z)
      )
      node.scale.set(obj.scale.x, obj.scale.y, obj.scale.z)
      if (node.isSpotLight) applyLightAim(node, obj.position, obj.rotation)
    }
    updateSelectionOutline(selectedId)
  }

  // Cheap per-frame transform update for animation playback — no geometry
  // or material work, safe to call every requestAnimationFrame tick.
  function setPose(id, position, rotation, scale) {
    const node = nodeMap.get(id)
    if (!node) return
    node.position.set(position.x, position.y, position.z)
    node.rotation.set(
      THREE.MathUtils.degToRad(rotation.x),
      THREE.MathUtils.degToRad(rotation.y),
      THREE.MathUtils.degToRad(rotation.z)
    )
    node.scale.set(scale.x, scale.y, scale.z)
    if (node.isSpotLight) applyLightAim(node, position, rotation)
  }

  function pickAt(clientX, clientY) {
    const rect = renderer.domElement.getBoundingClientRect()
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1
    raycaster.setFromCamera(pointer, camera)
    const hits = raycaster.intersectObjects(group.children, true)
    if (hits.length === 0) return null
    let node = hits[0].object
    while (node && node.userData.id === undefined) node = node.parent
    return node ? node.userData.id : null
  }

  function screenshot() {
    renderer.render(scene, camera)
    return renderer.domElement.toDataURL('image/png')
  }

  function setLighting(presetKey) {
    const p = LIGHT_PRESETS.find((l) => l.key === presetKey) || LIGHT_PRESETS[0]
    ambient.intensity = p.ambient
    key.intensity = p.keyIntensity
    key.color.set(p.keyColor)
    fill.intensity = p.fillIntensity
    fill.color.set(p.fillColor)
    scene.background = new THREE.Color(p.bg)
  }

  function setCameraView(viewKey) {
    const v = CAMERA_VIEWS.find((c) => c.key === viewKey) || CAMERA_VIEWS[0]
    camera.position.set(...v.position)
    controls.target.set(0, 0.5, 0)
    controls.update()
  }

  function setFov(deg) {
    camera.fov = deg
    camera.updateProjectionMatrix()
  }

  // Lets the editor temporarily hand off the drag gesture from
  // "orbit the camera" to "rotate the selected object" (dragging directly
  // on it) without the two fighting over the same pointer events.
  function setControlsEnabled(enabled) {
    controls.enabled = enabled
  }

  function dispose() {
    cancelAnimationFrame(raf)
    ro.disconnect()
    controls.dispose()
    for (const id of [...nodeMap.keys()]) removeNode(id)
    for (const entry of baseCache.values()) entry.geometry.dispose()
    baseCache.clear()
    renderer.dispose()
    if (renderer.domElement.parentNode === container) container.removeChild(renderer.domElement)
  }

  return {
    syncStructure,
    setPose,
    dispose,
    pickAt,
    screenshot,
    setLighting,
    setCameraView,
    setFov,
    setControlsEnabled,
    showPointHandles,
    clearHandles,
    pickPoint,
    beginPointDrag,
    dragPointTo,
    endPointDrag,
    getPoints,
    getScene: () => scene,
    getCamera: () => camera,
    getRenderer: () => renderer,
    getNode: (id) => nodeMap.get(id),
  }
}
