// Thin imperative wrapper around Three.js: owns the renderer/scene/camera/
// controls lifecycle so Lab3D.jsx can stay a normal React component and
// just describe *what* should be in the scene via sync(objects, selectedId)
// instead of touching Three.js objects directly.
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

export const PRIMITIVES = [
  { type: 'box', label: 'Куб', icon: '🧊' },
  { type: 'sphere', label: 'Сфера', icon: '⚪' },
  { type: 'cone', label: 'Конус', icon: '🔺' },
  { type: 'cylinder', label: 'Циліндр', icon: '🛢️' },
  { type: 'torus', label: 'Тор', icon: '🍩' },
  { type: 'plane', label: 'Площина', icon: '▭' },
]

// Lighting presets: ambient (fills shadows evenly), key (main directional
// light, casts the strongest highlights/shadows), fill (softer, opposite
// side — keeps shadows from going pure black). "studio" matches the
// scene's original hardcoded defaults, so picking it is a no-op visually.
export const LIGHT_PRESETS = [
  { key: 'studio', icon: '💡', label: 'Студія', ambient: 0.55, keyIntensity: 1.1, keyColor: '#ffffff', fillIntensity: 0.35, fillColor: '#8fa3ff', bg: '#16161d' },
  { key: 'day', icon: '☀️', label: 'День', ambient: 0.75, keyIntensity: 1.4, keyColor: '#fff6e0', fillIntensity: 0.5, fillColor: '#bcd4ff', bg: '#1c2b3d' },
  { key: 'sunset', icon: '🌇', label: 'Захід', ambient: 0.4, keyIntensity: 1.0, keyColor: '#ff8a3d', fillIntensity: 0.3, fillColor: '#5a3df0', bg: '#241a2e' },
  { key: 'night', icon: '🌙', label: 'Ніч', ambient: 0.18, keyIntensity: 0.5, keyColor: '#6a7cff', fillIntensity: 0.25, fillColor: '#2e2e55', bg: '#0b0b12' },
]

// Standard CAD/game-engine camera presets: orthogonal views (front/side/
// top) for precise alignment plus the default 3/4 "isometric-ish" angle
// used for a natural, readable overview.
export const CAMERA_VIEWS = [
  { key: 'iso', icon: '◆', label: 'Ізометрія', position: [3.2, 2.6, 4.4] },
  { key: 'front', icon: '⬜', label: 'Спереду', position: [0, 1.2, 6] },
  { key: 'side', icon: '◧', label: 'Збоку', position: [6, 1.2, 0] },
  { key: 'top', icon: '⬛', label: 'Зверху', position: [0.001, 7, 0.001] },
]

export function createThreeScene(container) {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x16161d)

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
  camera.position.set(3.2, 2.6, 4.4)

  const renderer = new THREE.WebGLRenderer({ antialias: true })
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

  function clearGroup() {
    for (const child of [...group.children]) {
      group.remove(child)
      child.traverse((n) => {
        n.geometry?.dispose()
        if (n.material) (Array.isArray(n.material) ? n.material : [n.material]).forEach((m) => m.dispose())
      })
    }
  }

  function dispose() {
    cancelAnimationFrame(raf)
    ro.disconnect()
    controls.dispose()
    clearGroup()
    renderer.dispose()
    if (renderer.domElement.parentNode === container) container.removeChild(renderer.domElement)
  }

  // Scenes here are a handful of primitives at most, so a full rebuild on
  // every change is simpler and safer than diffing individual meshes, with
  // no real performance cost.
  function sync(objects, selectedId) {
    clearGroup()
    for (const obj of objects) {
      const build = GEOMETRY_BUILDERS[obj.type] || GEOMETRY_BUILDERS.box
      const geometry = build()
      const material = new THREE.MeshStandardMaterial({
        color: obj.material.color,
        metalness: obj.material.metalness,
        roughness: obj.material.roughness,
        wireframe: obj.material.wireframe,
        transparent: obj.material.opacity < 1,
        opacity: obj.material.opacity,
        side: obj.type === 'plane' ? THREE.DoubleSide : THREE.FrontSide,
      })
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(obj.position.x, obj.position.y, obj.position.z)
      mesh.rotation.set(
        THREE.MathUtils.degToRad(obj.rotation.x),
        THREE.MathUtils.degToRad(obj.rotation.y),
        THREE.MathUtils.degToRad(obj.rotation.z)
      )
      mesh.scale.set(obj.scale.x, obj.scale.y, obj.scale.z)
      mesh.userData.id = obj.id
      if (obj.id === selectedId) {
        const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), new THREE.LineBasicMaterial({ color: 0xffd23f }))
        mesh.add(edges)
      }
      group.add(mesh)
    }
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

  return { sync, dispose, pickAt, screenshot, setLighting, setCameraView, setFov }
}
