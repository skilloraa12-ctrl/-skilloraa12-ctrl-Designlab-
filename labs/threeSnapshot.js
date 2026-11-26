// Знімок 3D-проєкту (з 3D Design Studio) у PNG — щоб вставити його в
// малювалку Game Art Studio й розмальовувати поверх. Використовує той самий
// рушій labs/threeAnimScene.js, тож «Свої форми», зсунуті точки й матеріали
// виглядають точно як у 3D-редакторі. Фон прозорий — знімок лягає поверх
// того, що вже намальовано. Камера сама наводиться на всі обʼєкти сцени.
//
// Стилі:
//  - color: кольори й матеріали як у 3D;
//  - clay:  білий «глиняний» макет зі світлотінню — розфарбовуй як хочеш;
//  - lines: розмальовка — білі форми з чорним контуром.
import * as THREE from 'three'
import { createAnimScene, CAMERA_VIEWS } from './threeAnimScene.js'

export const SNAPSHOT_STYLES = [
  { key: 'color', label: '🎨 Як у 3D' },
  { key: 'clay', label: '🤍 Білий макет' },
  { key: 'lines', label: '✏️ Розмальовка (контур)' },
]

function firstPose(obj) {
  const kfs = obj.keyframes || []
  if (kfs.length === 0) return obj
  return [...kfs].sort((a, b) => a.time - b.time)[0]
}

function readPixels(renderer, width, height) {
  const c = document.createElement('canvas')
  c.width = width
  c.height = height
  const ctx = c.getContext('2d')
  ctx.drawImage(renderer.domElement, 0, 0, width, height)
  return ctx.getImageData(0, 0, width, height).data
}

// Розмальовка: два службові проходи (нормалі й глибина) і пошук країв по
// картинці — лінія там, де закінчується обʼєкт (обрис), де різко змінюється
// напрям поверхні (ребра куба, гострі кути) або глибина (один обʼєкт
// перекриває інший). Так контур є й у гладкої кулі, і в гранованих фігур.
function renderLineArt(renderer, scene, camera, W, H) {
  scene.overrideMaterial = new THREE.MeshNormalMaterial({ side: THREE.DoubleSide })
  renderer.render(scene, camera)
  const nrm = readPixels(renderer, W, H)
  scene.overrideMaterial.dispose()
  scene.overrideMaterial = new THREE.MeshDepthMaterial({ side: THREE.DoubleSide })
  renderer.render(scene, camera)
  const dep = readPixels(renderer, W, H)
  scene.overrideMaterial.dispose()
  scene.overrideMaterial = null

  const N = W * H
  const edge = new Uint8Array(N)
  const inside = (i) => nrm[i * 4 + 3] > 127
  const nv = (i) => [nrm[i * 4] / 127.5 - 1, nrm[i * 4 + 1] / 127.5 - 1, nrm[i * 4 + 2] / 127.5 - 1]
  const differ = (a, b) => {
    const ia = inside(a)
    if (ia !== inside(b)) return true
    if (!ia) return false
    const na = nv(a)
    const nb = nv(b)
    if (na[0] * nb[0] + na[1] * nb[1] + na[2] * nb[2] < 0.8) return true
    return Math.abs(dep[a * 4] - dep[b * 4]) > 6
  }
  for (let y = 0; y < H - 1; y++) {
    for (let x = 0; x < W - 1; x++) {
      const i = y * W + x
      if (differ(i, i + 1) || differ(i, i + W)) edge[i] = 1
    }
  }
  // Потовщення лінії до ~3 px, щоб вона читалась як контур розмальовки.
  const out = new ImageData(W, H)
  const d = out.data
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x
      let line = false
      for (let dy = -1; dy <= 1 && !line; dy++) for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx
        const yy = y + dy
        if (xx >= 0 && yy >= 0 && xx < W && yy < H && edge[yy * W + xx]) { line = true; break }
      }
      if (line) { d[i * 4] = 26; d[i * 4 + 1] = 26; d[i * 4 + 2] = 26; d[i * 4 + 3] = 255 } else if (inside(i)) { d[i * 4] = 255; d[i * 4 + 1] = 255; d[i * 4 + 2] = 255; d[i * 4 + 3] = 255 }
    }
  }
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  c.getContext('2d').putImageData(out, 0, 0)
  return c.toDataURL('image/png')
}

export function renderThreeDSnapshot(project, { width = 1100, height = 760, view = 'iso', style = 'color' } = {}) {
  const objects = project?.anim?.objects || []
  const container = document.createElement('div')
  container.style.cssText = `position:fixed;left:-20000px;top:0;width:${width}px;height:${height}px;pointer-events:none;`
  document.body.appendChild(container)
  const api = createAnimScene(container, { alpha: true })
  try {
    const renderer = api.getRenderer()
    renderer.setPixelRatio(1)
    renderer.setSize(width, height)
    renderer.setClearColor(0x000000, 0)
    const scene = api.getScene()
    const camera = api.getCamera()
    camera.aspect = width / height
    camera.updateProjectionMatrix()

    api.syncStructure(objects, null)
    for (const obj of objects) {
      const p = firstPose(obj)
      api.setPose(obj.id, p.position, p.rotation, p.scale)
    }
    api.setLighting('studio')
    scene.background = null
    scene.traverse((o) => { if (o.type === 'GridHelper') o.visible = false })

    const meshes = []
    for (const obj of objects) {
      const node = api.getNode(obj.id)
      if (!node) continue
      if (node.isLight) {
        node.children.forEach((c) => { if (c.userData.isMarker) c.visible = false })
        continue
      }
      meshes.push(node)
      if (style === 'clay') {
        node.material.map = null
        node.material.color.set('#f2f0ea')
        node.material.metalness = 0
        node.material.roughness = 0.9
        node.material.wireframe = false
        node.material.opacity = 1
        node.material.transparent = false
      }
    }
    if (meshes.length === 0) return null

    // Наведення камери: напрямок з обраного ракурсу, відстань — щоб уся
    // сцена вмістилась у кадр із запасом.
    scene.updateMatrixWorld(true)
    const box = new THREE.Box3()
    meshes.forEach((m) => box.expandByObject(m))
    const center = box.getCenter(new THREE.Vector3())
    const sphere = box.getBoundingSphere(new THREE.Sphere())
    const v = CAMERA_VIEWS.find((c) => c.key === view) || CAMERA_VIEWS[0]
    const dir = new THREE.Vector3(...v.position).normalize()
    const fovV = THREE.MathUtils.degToRad(camera.fov)
    const fovH = 2 * Math.atan(Math.tan(fovV / 2) * camera.aspect)
    const dist = (sphere.radius * 1.25) / Math.sin(Math.min(fovV, fovH) / 2)
    camera.position.copy(center).addScaledVector(dir, dist)
    camera.near = Math.max(0.01, dist / 100)
    camera.far = dist * 10
    camera.updateProjectionMatrix()
    camera.lookAt(center)
    if (style === 'lines') return renderLineArt(renderer, scene, camera, width, height)
    renderer.render(scene, camera)
    return renderer.domElement.toDataURL('image/png')
  } finally {
    api.getRenderer().forceContextLoss()
    api.dispose()
    container.remove()
  }
}
