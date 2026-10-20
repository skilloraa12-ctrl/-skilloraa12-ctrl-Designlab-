// Бібліотека валідаторів для вкладки «Практика» (ТЗ п.5, FR-TASK-001…004).
// Кожен валідатор — чиста функція (project, params) => { ok, message } без
// побічних ефектів і без eval: дані завдання приходять як звичайний JSON
// (practiceTasks.js), а не як код, що виконується.
//
// "project" тут — це внутрішня модель конкретного редактора (для Vector
// Studio: { objects, artboards, palette, exportedFormats, variants }, див.
// practiceProject.js). Валідатори, що стосуються інших рушіїв (Flow/Motion/
// Game Board), поки що ніде не підключені в завданнях — редактори для них
// ще не збудовані цього заходу (чесно позначено в UI як "скоро").

import { contrastRatio as wcagContrastRatio } from '../colorMath.js'
import { LIGHT_TYPES as LIGHT_TYPES_3D } from '../threeDProject.js'

function ok(message) { return { ok: true, message } }
function fail(message) { return { ok: false, message } }

// ---------- Загальні (FR-TASK-004) ----------

export function hasObject(project) {
  return (project.objects || []).length > 0
    ? ok('На полотні є хоча б один об’єкт.')
    : fail('Додай хоча б один об’єкт на полотно.')
}

export function countObjects(project, { min = 1 } = {}) {
  const n = (project.objects || []).length
  return n >= min ? ok(`Об’єктів: ${n}.`) : fail(`Потрібно щонайменше ${min} об’єкт(ів), зараз ${n}.`)
}

export function propertyInRange(project, { prop, min = -Infinity, max = Infinity, anyObject = true }) {
  const objs = project.objects || []
  const check = (o) => typeof o[prop] === 'number' && o[prop] >= min && o[prop] <= max
  const passed = anyObject ? objs.some(check) : objs.length > 0 && objs.every(check)
  return passed
    ? ok(`Властивість «${prop}» у межах ${min}–${max}.`)
    : fail(`Жоден об’єкт не має «${prop}» у межах ${min}–${max}.`)
}

export function propertyEquals(project, { prop, value, anyObject = true }) {
  const objs = project.objects || []
  const check = (o) => o[prop] === value
  const passed = anyObject ? objs.some(check) : objs.length > 0 && objs.every(check)
  return passed ? ok(`Є об’єкт із «${prop}» = ${value}.`) : fail(`Немає об’єкта з «${prop}» = ${value}.`)
}

export function exportFormatIs(project, { format }) {
  const formats = project.exportedFormats || []
  return formats.includes(format)
    ? ok(`Експортовано у форматі ${format.toUpperCase()}.`)
    : fail(`Ще не експортовано у форматі ${format.toUpperCase()} — скористайся кнопкою експорту.`)
}

export function durationUnder(project, { seconds }) {
  const d = project.duration ?? 0
  return d > 0 && d <= seconds
    ? ok(`Тривалість ${d}с — у межах ${seconds}с.`)
    : fail(`Тривалість має бути не більшою за ${seconds}с (зараз ${d || 0}с).`)
}

// Flow/Game-орієнтовані загальні валідатори — функції готові, але жодне
// завдання цього заходу їх ще не використовує (відповідні редактори не
// збудовані), щоб не видавати нереалізовану перевірку за робочу.
export function hasConnection(project, { min = 1 } = {}) {
  const n = (project.connections || []).length
  return n >= min ? ok(`Звʼязків: ${n}.`) : fail(`Потрібно щонайменше ${min} звʼязок.`)
}

export function noDeadEnds(project) {
  const dead = (project.nodes || []).filter((n) => n.type !== 'end' && !(project.connections || []).some((c) => c.from === n.id))
  return dead.length === 0 ? ok('Глухих кутів немає.') : fail(`Є вузли без виходу: ${dead.map((n) => n.title || n.id).join(', ')}.`)
}

// ---------- Vector Studio (ТЗ 7.B) ----------

export function shapeCount(project, { min = 1 } = {}) {
  const n = (project.objects || []).filter((o) => o.type !== 'text').length
  return n >= min ? ok(`Фігур: ${n}.`) : fail(`Потрібно щонайменше ${min} фігур(и), зараз ${n}.`)
}

export function colorUsed(project, { palette } = {}) {
  const pal = palette || project.palette || []
  if (pal.length === 0) return fail('У палітрі проєкту ще немає кольорів.')
  const used = (project.objects || []).some((o) => pal.includes(o.fill) || pal.includes(o.stroke))
  return used ? ok('Використано колір із палітри курсу.') : fail('Жоден об’єкт не використовує колір із палітри курсу.')
}

export function colorsMax(project, { max }) {
  const colors = new Set()
  ;(project.objects || []).forEach((o) => {
    if (o.fill && o.fill !== 'none') colors.add(o.fill)
    if (o.stroke && o.stroke !== 'none') colors.add(o.stroke)
  })
  return colors.size <= max
    ? ok(`Використано кольорів: ${colors.size} (ліміт ${max}).`)
    : fail(`Забагато кольорів: ${colors.size}, ліміт ${max}.`)
}

export function contrastRatioCheck(project, { min = 4.5, fg, bg } = {}) {
  const a = fg || project.objects?.find((o) => o.type === 'text')?.fill
  const b = bg || project.artboards?.[0]?.bg || '#ffffff'
  if (!a) return fail('Немає текстового об’єкта для перевірки контрасту.')
  const ratio = wcagContrastRatio(a, b)
  return ratio >= min
    ? ok(`Контраст ${ratio.toFixed(2)}:1 — проходить ${min}:1.`)
    : fail(`Контраст лише ${ratio.toFixed(2)}:1, потрібно щонайменше ${min}:1.`)
}

export function alignedToGuide(project, { min = 1 } = {}) {
  const n = (project.objects || []).filter((o) => o.guideAligned).length
  return n >= min
    ? ok(`Вирівняно до напрямної: ${n} об’єкт(ів).`)
    : fail(`Вирівняй щонайменше ${min} об’єкт(и) до напрямної (притягування увімкнене клавішею S).`)
}

export function textHasFont(project) {
  const texts = (project.objects || []).filter((o) => o.type === 'text')
  if (texts.length === 0) return fail('Немає жодного текстового об’єкта.')
  return texts.every((t) => !!t.fontFamily)
    ? ok('У кожного тексту задано шрифт.')
    : fail('Не в усіх текстових об’єктів задано шрифт.')
}

export function fontsUsed(project, { min = 1 } = {}) {
  const fonts = new Set((project.objects || []).filter((o) => o.type === 'text').map((o) => o.fontFamily).filter(Boolean))
  return fonts.size >= min
    ? ok(`Використано шрифтів: ${fonts.size}.`)
    : fail(`Потрібно щонайменше ${min} різних шрифти(ів), зараз ${fonts.size}.`)
}

export function pathNodesMax(project, { max }) {
  const over = (project.objects || []).filter((o) => o.type === 'path' && (o.points || []).length > max)
  return over.length === 0
    ? ok(`Усі контури в межах ${max} вузлів.`)
    : fail(`${over.length} контур(ів) перевищують ${max} вузлів — спрости форму.`)
}

export function minSizeLegible(project, { px = 24 } = {}) {
  const objs = project.objects || []
  if (objs.length === 0) return fail('Немає об’єктів для перевірки розміру.')
  const minDim = Math.min(...objs.map((o) => Math.min(o.w || Infinity, o.h || Infinity)))
  return minDim >= px
    ? ok(`Найменший об’єкт ${Math.round(minDim)}px — читабельно на ${px}px.`)
    : fail(`Найменший об’єкт лише ${Math.round(minDim)}px — на ${px}px деталі зникнуть.`)
}

export function paletteSize(project, { min = 1 } = {}) {
  const n = (project.palette || []).length
  return n >= min ? ok(`У палітрі ${n} кольор(ів).`) : fail(`У палітрі має бути щонайменше ${min} кольор(ів), зараз ${n}.`)
}

export function hasVariants(project, { min = 1 } = {}) {
  const n = (project.variants || []).length
  return n >= min ? ok(`Збережено варіантів: ${n}.`) : fail(`Збережи щонайменше ${min} варіант(и) кнопкою «Зберегти варіант».`)
}

export function exportSvgValid(project) {
  const hasObjects = (project.objects || []).length > 0
  const exported = (project.exportedFormats || []).includes('svg')
  if (!hasObjects) return fail('Немає об’єктів для експорту.')
  return exported ? ok('SVG успішно експортовано.') : fail('Ще не натиснуто «Експорт SVG».')
}

// ---------- Flow & Layout Studio (ТЗ 7.C) ----------

export function screenCount(project, { min = 1 } = {}) {
  const n = (project.frames || []).length
  return n >= min ? ok(`Екранів: ${n}.`) : fail(`Потрібно щонайменше ${min} екран(и), зараз ${n}.`)
}

export function hasLink(project, { min = 1 } = {}) {
  const n = (project.links || []).length
  return n >= min ? ok(`Звʼязків між екранами: ${n}.`) : fail(`Потрібно щонайменше ${min} звʼязок між екранами (інструмент «Зв’язок»).`)
}

export function allScreensReachable(project) {
  const frames = project.frames || []
  if (frames.length <= 1) return ok('Лише один екран — досяжність не застосовна.')
  const links = project.links || []
  const startId = frames[0].id
  const unreachable = frames.filter((f) => f.id !== startId && !links.some((l) => l.to === f.id))
  return unreachable.length === 0
    ? ok('Усі екрани досяжні через звʼязки.')
    : fail(`До цих екранів немає звʼязку: ${unreachable.map((f) => f.name).join(', ')}.`)
}

export function componentUsed(project, { type, min = 1 } = {}) {
  const n = (project.objects || []).filter((o) => o.type === 'component' && o.componentType === type).length
  return n >= min ? ok(`Компонент «${type}»: ${n}.`) : fail(`Потрібно щонайменше ${min} компонент(и) «${type}».`)
}

export function stateDefined(project, { type, count = 1 } = {}) {
  const states = new Set((project.objects || []).filter((o) => o.type === 'component' && o.componentType === type).map((o) => o.state))
  return states.size >= count
    ? ok(`Станів компонента «${type}»: ${states.size}.`)
    : fail(`Потрібно щонайменше ${count} різних станів компонента «${type}» (зараз ${states.size}).`)
}

export function minTapTarget(project, { px = 44 } = {}) {
  const interactive = (project.objects || []).filter((o) => o.type === 'component' && ['button', 'checkbox', 'switch', 'tab'].includes(o.componentType))
  if (interactive.length === 0) return fail('Немає інтерактивних компонентів для перевірки.')
  const small = interactive.filter((o) => o.w < px || o.h < px)
  return small.length === 0
    ? ok(`Усі інтерактивні елементи ≥ ${px}px.`)
    : fail(`${small.length} елемент(ів) менші за ${px}×${px}px — замалі для пальця.`)
}

// ---------- Game Systems Board (ТЗ 7.E) ----------
// nodes/connections — та сама форма {id, type}/{from, to}, що й у
// hasConnection/noDeadEnds вище, тож Game Board свідомо називає своє
// поле "connections" (не "links"), щоб ці два загальні валідатори
// працювали без дублювання логіки.

export function nodeCount(project, { min = 1 } = {}) {
  const n = (project.nodes || []).length
  return n >= min ? ok(`Вузлів: ${n}.`) : fail(`Потрібно щонайменше ${min} вузол(ів), зараз ${n}.`)
}

export function loopClosed(project) {
  const nodes = project.nodes || []
  const conns = project.connections || []
  const adj = {}
  conns.forEach((c) => { (adj[c.from] = adj[c.from] || []).push(c.to) })
  function hasCycleFrom(start) {
    const visited = new Set()
    const stack = [start]
    while (stack.length) {
      const cur = stack.pop()
      for (const next of adj[cur] || []) {
        if (next === start) return true
        if (!visited.has(next)) { visited.add(next); stack.push(next) }
      }
    }
    return false
  }
  const closed = nodes.some((n) => hasCycleFrom(n.id))
  return closed ? ok('Петля замкнена — є цикл у звʼязках.') : fail('Немає жодного циклу: простеж, щоб стрілки врешті поверталися до початкового вузла.')
}

export function resourceSourceAndSink(project) {
  const conns = project.connections || []
  const resources = (project.nodes || []).filter((n) => n.type === 'resource')
  const ok1 = resources.find((r) => conns.some((c) => c.to === r.id) && conns.some((c) => c.from === r.id))
  return ok1
    ? ok(`Ресурс «${ok1.label}» має і джерело, і витрату.`)
    : fail('Жоден ресурс не має одночасно вхідного (джерело) і вихідного (витрата) звʼязку.')
}

// Міні-формули без eval (FR-GEN-008): лише "=prev+N" (лінійний ріст) і
// "=prev*N" (експоненціальний) — явно звужено з повного SUM/AVG/MIN/MAX/
// IF ТЗ заради безпеки без власного парсера виразів.
export function resolveTableColumn(rows, colIndex) {
  const values = []
  for (let i = 0; i < rows.length; i++) {
    const raw = String(rows[i][colIndex] ?? '').trim()
    let v
    if (raw.startsWith('=')) {
      const prev = values[i - 1]
      const addMatch = raw.match(/^=prev\s*\+\s*(-?\d+(\.\d+)?)$/)
      const mulMatch = raw.match(/^=prev\s*\*\s*(-?\d+(\.\d+)?)$/)
      if (prev !== undefined && addMatch) v = prev + Number(addMatch[1])
      else if (prev !== undefined && mulMatch) v = prev * Number(mulMatch[1])
      else v = NaN
    } else {
      v = Number(raw)
    }
    values.push(v)
  }
  return values
}

export function formulaValid(project, { column = 1 } = {}) {
  const rows = project.table?.rows || []
  if (rows.length === 0) return fail('Таблиця порожня.')
  const hasFormula = rows.some((r) => String(r[column] ?? '').trim().startsWith('='))
  if (!hasFormula) return fail('Жодна комірка не використовує формулу (=prev+N чи =prev*N).')
  const values = resolveTableColumn(rows, column)
  const broken = values.some((v) => Number.isNaN(v))
  return broken ? fail('Формула не обчислюється — перевір синтаксис =prev+N чи =prev*N.') : ok('Формули обчислюються коректно.')
}

export function monotonicIncreasing(project, { column = 1 } = {}) {
  const rows = project.table?.rows || []
  const values = resolveTableColumn(rows, column)
  if (values.length < 2) return fail('Потрібно щонайменше 2 рядки для перевірки зростання.')
  const ok1 = values.every((v, i) => i === 0 || v > values[i - 1])
  return ok1 ? ok('Значення зростають із кожним рядком.') : fail('Значення не зростають монотонно — перевір таблицю.')
}

export function tableColumnsPresent(project, { min = 2 } = {}) {
  const n = (project.table?.columns || []).length
  return n >= min ? ok(`Колонок: ${n}.`) : fail(`Потрібно щонайменше ${min} колонки, зараз ${n}.`)
}

// ---------- 3D Studio (ТЗ 7.A) ----------
// project.objects тут — та сама форма makeAnimObject() з threeDProject.js
// (position/rotation/scale/material/light), пряма сумісна з
// labs/threeAnimScene.js's syncStructure() — редактор не вигадує нову
// модель, а повторно використовує вже наявну для ThreeDAnimEditor.jsx.

// Грубі орієнтовні лічильники трикутників для кожного примітива
// (сегменти з GEOMETRY_BUILDERS у threeAnimScene.js) — достатньо чесно
// для бюджету полігонів у практичному завданні, не точний рушійний
// підрахунок.
const POLY_ESTIMATES = {
  box: 12, sphere: 960, cone: 62, cylinder: 128, torus: 1536, plane: 2,
  capsule: 544, tetrahedron: 4, octahedron: 8, icosahedron: 20, dodecahedron: 36, torusKnot: 2400,
}

export function polyBudget(project, { max }) {
  const total = (project.objects || []).filter((o) => !LIGHT_TYPES_3D.includes(o.type)).reduce((s, o) => s + (POLY_ESTIMATES[o.type] || 0), 0)
  return total <= max ? ok(`Приблизно ${total} трикутників (ліміт ${max}).`) : fail(`Приблизно ${total} трикутників — перевищує ліміт ${max}.`)
}

export function lightCount(project, { min = 1, type } = {}) {
  const n = (project.objects || []).filter((o) => LIGHT_TYPES_3D.includes(o.type) && (!type || o.type === type)).length
  return n >= min ? ok(`Джерел світла: ${n}.`) : fail(`Потрібно щонайменше ${min} джерел(о) світла, зараз ${n}.`)
}

export function materialAssigned(project, { min = 1 } = {}) {
  const n = (project.objects || []).filter((o) => o.material?.touched).length
  return n >= min
    ? ok(`Матеріалів свідомо налаштовано: ${n}.`)
    : fail(`Зміни колір/параметри матеріалу щонайменше у ${min} обʼєкт(ах) — зараз це зроблено лише в ${n}.`)
}

export function materialColorsMax(project, { max }) {
  const colors = new Set((project.objects || []).filter((o) => o.material).map((o) => o.material.color))
  return colors.size <= max
    ? ok(`Кольорів матеріалів: ${colors.size} (ліміт ${max}).`)
    : fail(`Забагато кольорів матеріалів: ${colors.size}, ліміт ${max}.`)
}

export function cameraFraming(project) {
  return project.cameraView && project.cameraView !== 'iso'
    ? ok(`Ракурс камери обрано свідомо (${project.cameraView}).`)
    : fail('Обери ракурс камери в панелі властивостей — за замовчуванням кадр ще не продуманий.')
}

export const VALIDATORS = {
  hasObject, countObjects, propertyInRange, propertyEquals, exportFormatIs, durationUnder,
  hasConnection, noDeadEnds,
  shapeCount, colorUsed, colorsMax, contrastRatio: contrastRatioCheck, alignedToGuide,
  textHasFont, fontsUsed, pathNodesMax, minSizeLegible, paletteSize, hasVariants, exportSvgValid,
  screenCount, hasLink, allScreensReachable, componentUsed, stateDefined, minTapTarget,
  nodeCount, loopClosed, resourceSourceAndSink, formulaValid, monotonicIncreasing, tableColumnsPresent,
  polyBudget, lightCount, materialAssigned, materialColorsMax, cameraFraming,
}

// goals: [{ id, text, validator, params, weight }]
// Повертає { pct, passed, results: [{id, text, ok, message, weight}] }
export function runValidation(project, goals, passThreshold = 0.8) {
  const results = (goals || []).map((g) => {
    const fn = VALIDATORS[g.validator]
    if (!fn) return { id: g.id, text: g.text, ok: false, message: `Невідомий валідатор «${g.validator}».`, weight: g.weight ?? 1 }
    const r = fn(project, g.params || {})
    return { id: g.id, text: g.text, ok: r.ok, message: r.message, weight: g.weight ?? 1 }
  })
  const totalWeight = results.reduce((s, r) => s + r.weight, 0) || 1
  const earned = results.reduce((s, r) => s + (r.ok ? r.weight : 0), 0)
  const pct = earned / totalWeight
  return { pct, passed: pct >= passThreshold, results }
}
