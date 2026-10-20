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
}

const LIGHT_TYPES = new Set(['pointLight', 'spotLight'])

export const PRIMITIVES = [
  { type: 'box', label: 'Куб', icon: '🧊' },
  { type: 'sphere', label: 'Сфера', icon: '⚪' },
  { type: 'cone', label: 'Конус', icon: '🔺' },
  { type: 'cylinder', label: 'Циліндр', icon: '🛢️' },
  { type: 'torus', label: 'Тор', icon: '🍩' },
  { type: 'plane', label: 'Площина', icon: '▭' },
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

export function createAnimScene(container) {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x16161d)

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
  camera.position.set(3.2, 2.6, 4.4)

  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
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
    const build = GEOMETRY_BUILDERS[obj.type] || GEOMETRY_BUILDERS.box
    const geometry = build()
    const material = buildMaterial(obj.material, obj.type)
    return new THREE.Mesh(geometry, material)
  }

  function removeNode(id) {
    const node = nodeMap.get(id)
    if (!node) return
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
        node.userData.id = obj.id
        node.name = obj.id
        group.add(node)
        if (node.target) group.add(node.target)
        nodeMap.set(obj.id, node)
      } else if (LIGHT_TYPES.has(obj.type)) {
        patchLight(node, obj.light)
      } else {
        patchMaterial(node, obj.material)
      }
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

  function dispose() {
    cancelAnimationFrame(raf)
    ro.disconnect()
    controls.dispose()
    for (const id of [...nodeMap.keys()]) removeNode(id)
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
    getScene: () => scene,
    getCamera: () => camera,
    getRenderer: () => renderer,
    getNode: (id) => nodeMap.get(id),
  }
}
