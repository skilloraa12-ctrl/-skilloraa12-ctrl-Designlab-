import { useState } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import { useProgress } from './ProgressContext.jsx'
import { useLabToast } from './labs/useLabToast.js'
import LabToast from './labs/LabToast.jsx'
import NotFound from './NotFound.jsx'
import { BRAND_STAGES, NAMING_CRITERIA, BRAND_ARCHETYPES } from './brandProject.js'

// Branding Studio — робочий простір п.3.2 ТЗ: ліва панель етапів,
// центральна робоча область (залежить від етапу), права панель
// допомоги. Один проєкт за раз (BrandProject, завантажений за :id).
// Нереалізовані ще етапи чесно позначені "у розробці" замість
// імітації кнопкою, що нічого не робить (вимога ТЗ, розділ 14).

const STAGE_HELP = {
  brief: { tip: 'Заповни все, що знаєш про бізнес. Необов’язкові поля можна лишити порожніми — повертайся до брифу будь-коли.', criteria: ['Описаний продукт/послуга', 'Вказана цільова аудиторія', 'Названо бодай одного конкурента'] },
  research: { tip: 'Порівняй свій бренд із 2-3 конкурентами за однаковими критеріями. Умовні приклади — нормально для навчання.', criteria: ['Є таблиця конкурентів', 'Зроблено висновок дослідження'] },
  strategy: { tip: 'Стратегія відповідає на «хто ми і навіщо» — невидимий рівень бренду (Основи брендингу, урок 2). Пиши простими реченнями, без маркетингового жаргону.', criteria: ['Сформульована місія', 'Чітке позиціонування (чим ми відрізняємось)', 'Визначена унікальна ціннісна пропозиція'] },
  naming: { tip: 'Додай щонайменше 5 варіантів назви, оціни кожен за критеріями, познач фаворита й обери фінальну назву.', criteria: ['Щонайменше 5 варіантів', 'Кожен оцінений за критеріями', 'Обрана фінальна назва з поясненням'] },
  concept: { tip: 'Опиши творчий напрямок словами (образи, метафори, ключові слова) — деталізація форм і кольору прийде на наступних етапах.', criteria: ['Є щонайменше 2 різні напрямки', 'Обґрунтовано вибір одного з них'] },
  logo: { tip: 'Створи логотип у «Graphic Design Studio» (переходить до вбудованого редактора) і постав посилання на збережений проєкт.', criteria: ['Логотип відповідає стратегії', 'Працює в малому розмірі', 'Є чорно-білий варіант'] },
  palette: { tip: 'Визнач основний, додатковий, акцентний і нейтральний кольори з точними HEX-кодами.', criteria: ['Є основний і нейтральний кольори', 'Кожен колір має точний HEX', 'Палітра відрізняється від основних конкурентів'] },
  typography: { tip: 'Обери шрифт для логотипа, заголовків і основного тексту — узгодь їх між собою.', criteria: ['Обрано шрифт заголовків і основного тексту', 'Шрифти узгоджені за характером'] },
  graphicElements: { tip: 'Опиши фірмові форми, патерни, стиль ілюстрацій і фото — узгоджену графічну систему бренду.', criteria: ['Описані фірмові форми чи патерни', 'Визначено фотостиль'] },
  mediaApplications: { tip: 'Застосуй свою систему (лого+палітра+шрифти) щонайменше до 3 різних носіїв — вони мають виглядати як одна система, не окремі дизайни.', criteria: ['Щонайменше 3 носії', 'Усі використовують ту саму палітру й лого'] },
  guidelines: { tip: 'Сформуй брендбук зі сторінок, перелічених праворуч — дані підтягуються з проєкту там, де це можливо.', criteria: ['Заповнені основні сторінки', 'Вказані охоронні поля й мінімальний розмір логотипа'] },
  presentation: { tip: 'Зібери підсумкову презентацію: проблема → дослідження → стратегія → логотип → палітра → носії → результат.', criteria: ['Є слайд із поясненням стратегії', 'Показані реальні матеріали проєкту, не випадкові'] },
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

function BriefStage({ project, onPatch }) {
  const b = project.brief
  const set = (field) => (val) => onPatch({ brief: { ...b, [field]: val } })
  return (
    <div className="branding-form">
      <p className="cl-section-title">Бриф</p>
      <TextField label="Назва проєкту" value={project.name} onCommit={(v) => onPatch({ name: v || 'Новий бренд' })} />
      <TextField label="Назва бізнесу (якщо вже відома)" value={b.businessName} onCommit={set('businessName')} />
      <TextField label="Тип бізнесу" value={b.businessType} onCommit={set('businessType')} />
      <TextField label="Продукт або послуга" value={b.product} onCommit={set('product')} />
      <TextField label="Опис бізнесу" value={b.description} onCommit={set('description')} textarea />
      <TextField label="Місія" value={b.mission} onCommit={set('mission')} textarea />
      <TextField label="Бізнес-цілі" value={b.businessGoals} onCommit={set('businessGoals')} textarea />
      <TextField label="Цільова аудиторія" value={b.targetAudience} onCommit={set('targetAudience')} textarea />
      <TextField label="Потреби аудиторії" value={b.audienceNeeds} onCommit={set('audienceNeeds')} textarea />
      <TextField label="Основні конкуренти" value={b.competitors} onCommit={set('competitors')} textarea />
      <TextField label="Переваги" value={b.advantages} onCommit={set('advantages')} textarea />
      <TextField label="Характер бренду" value={b.brandCharacter} onCommit={set('brandCharacter')} />
      <TextField label="Бажане сприйняття" value={b.desiredPerception} onCommit={set('desiredPerception')} textarea />
      <TextField label="Обмеження" value={b.constraints} onCommit={set('constraints')} textarea />
      <TextField label="Додаткові примітки" value={b.notes} onCommit={set('notes')} textarea />
    </div>
  )
}

function ResearchStage({ project, onPatch }) {
  const r = project.research
  const [name, setName] = useState('')
  function addCompetitor() {
    if (!name.trim()) return
    onPatch({ research: { ...r, competitorTable: [...r.competitorTable, { id: crypto.randomUUID(), name: name.trim(), strengths: '', weaknesses: '' }] } })
    setName('')
  }
  function updateRow(id, field, val) {
    onPatch({ research: { ...r, competitorTable: r.competitorTable.map((row) => (row.id === id ? { ...row, [field]: val } : row)) } })
  }
  function removeRow(id) {
    onPatch({ research: { ...r, competitorTable: r.competitorTable.filter((row) => row.id !== id) } })
  }
  return (
    <div className="branding-form">
      <p className="cl-section-title">Дослідження та конкуренти</p>
      <p className="cl-tab-desc">Умовні приклади для навчання — познач це собі прямо в назві конкурента, якщо дані не перевірені.</p>
      <div className="gfx-row">
        <input className="cl-text-input" placeholder="Назва конкурента" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="harmony-btn" onClick={addCompetitor}>+ Додати</button>
      </div>
      {r.competitorTable.map((row) => (
        <div key={row.id} className="branding-competitor-row">
          <strong>{row.name}</strong>
          <button className="cl-mini-btn" onClick={() => removeRow(row.id)}>Видалити</button>
          <TextField label="Сильні сторони" value={row.strengths} onCommit={(v) => updateRow(row.id, 'strengths', v)} textarea />
          <TextField label="Слабкі сторони" value={row.weaknesses} onCommit={(v) => updateRow(row.id, 'weaknesses', v)} textarea />
        </div>
      ))}
      <TextField label="Нотатки про ринок" value={r.marketNotes} onCommit={(v) => onPatch({ research: { ...r, marketNotes: v } })} textarea />
      <TextField label="Висновки з дослідження" value={r.conclusions} onCommit={(v) => onPatch({ research: { ...r, conclusions: v } })} textarea />
    </div>
  )
}

function StrategyStage({ project, onPatch }) {
  const s = project.strategy
  const set = (field) => (val) => onPatch({ strategy: { ...s, [field]: val } })
  return (
    <div className="branding-form">
      <p className="cl-section-title">Стратегічна платформа бренду</p>
      <TextField label="Місія (навіщо ми існуємо)" value={s.mission} onCommit={set('mission')} textarea />
      <TextField label="Візія (якими ми прагнемо стати)" value={s.vision} onCommit={set('vision')} textarea />
      <TextField label="Цінності" value={s.values} onCommit={set('values')} textarea />
      <TextField label="Позиціонування (чим ми відрізняємось)" value={s.positioning} onCommit={set('positioning')} textarea />
      <TextField label="Унікальна ціннісна пропозиція (УЦП)" value={s.uvp} onCommit={set('uvp')} textarea />
      <TextField label="Переваги бренду" value={s.benefits} onCommit={set('benefits')} textarea />
      <TextField label="Обіцянка бренду" value={s.promise} onCommit={set('promise')} textarea />
      <TextField label="Характер бренду" value={s.character} onCommit={set('character')} />
      <label className="gfx-field">Архетип бренду (підказка для характеру, не автогенерація)
        <select className="sketchpad-select" value={s.archetype} onChange={(e) => set('archetype')(e.target.value)}>
          <option value="">— не обрано —</option>
          {BRAND_ARCHETYPES.map((a) => <option key={a.id} value={a.id}>{a.label} — {a.desc}</option>)}
        </select>
      </label>
      <TextField label="Емоційне сприйняття" value={s.emotionalPerception} onCommit={set('emotionalPerception')} textarea />
      <TextField label="Раціональні переваги" value={s.rationalBenefits} onCommit={set('rationalBenefits')} textarea />
      <TextField label="Емоційні переваги" value={s.emotionalBenefits} onCommit={set('emotionalBenefits')} textarea />
      <TextField label="Тон комунікації" value={s.toneOfVoice} onCommit={set('toneOfVoice')} />
      <TextField label="Основне повідомлення" value={s.mainMessage} onCommit={set('mainMessage')} textarea />
    </div>
  )
}

function NamingStage({ project, onPatch, toastApi }) {
  const n = project.naming
  const [draft, setDraft] = useState('')

  function addCandidate() {
    if (!draft.trim()) return
    const c = { id: crypto.randomUUID(), text: draft.trim(), comment: '', favorite: false, scores: {} }
    onPatch({ naming: { ...n, candidates: [...n.candidates, c] } })
    setDraft('')
  }
  function updateCandidate(id, patch) {
    onPatch({ naming: { ...n, candidates: n.candidates.map((c) => (c.id === id ? { ...c, ...patch } : c)) } })
  }
  function removeCandidate(id) {
    onPatch({ naming: { ...n, candidates: n.candidates.filter((c) => c.id !== id), chosenId: n.chosenId === id ? null : n.chosenId } })
  }
  function chooseAsFinal(id) {
    onPatch({ naming: { ...n, chosenId: id } })
    toastApi.show('✓ Обрано як фінальну назву')
  }
  function avgScore(c) {
    const vals = Object.values(c.scores)
    if (vals.length === 0) return 0
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
  }
  const sorted = [...n.candidates].sort((a, b) => avgScore(b) - avgScore(a))

  return (
    <div className="branding-form">
      <p className="cl-section-title">Naming Workshop</p>
      <div className="gfx-row">
        <input className="cl-text-input" placeholder="Новий варіант назви" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCandidate()} />
        <button className="harmony-btn" onClick={addCandidate}>+ Додати</button>
      </div>
      {sorted.length === 0 && <p className="cl-tab-desc">Додай щонайменше 5 варіантів, перш ніж оцінювати й порівнювати.</p>}
      {sorted.map((c) => (
        <div key={c.id} className={'branding-name-card' + (n.chosenId === c.id ? ' chosen' : '')}>
          <div className="gfx-row" style={{ alignItems: 'center' }}>
            <strong style={{ flex: 1 }}>{c.text}</strong>
            <button className={'cl-mini-btn' + (c.favorite ? ' active' : '')} onClick={() => updateCandidate(c.id, { favorite: !c.favorite })}>{c.favorite ? '★ Фаворит' : '☆ Фаворит'}</button>
            <span className="lab-card-badge">Середня оцінка: {avgScore(c)}</span>
            <button className="cl-mini-btn" onClick={() => removeCandidate(c.id)}>Видалити</button>
          </div>
          <TextField label="Коментар" value={c.comment} onCommit={(v) => updateCandidate(c.id, { comment: v })} textarea />
          <div className="branding-score-grid">
            {NAMING_CRITERIA.map((crit) => (
              <label key={crit.id} className="gfx-num">{crit.label}
                <input type="range" min="1" max="5" value={c.scores[crit.id] || 3} onChange={(e) => updateCandidate(c.id, { scores: { ...c.scores, [crit.id]: Number(e.target.value) } })} />
              </label>
            ))}
          </div>
          {n.chosenId === c.id ? (
            <span className="lab-card-badge active">✓ Обрана фінальна назва</span>
          ) : (
            <button className="harmony-btn" onClick={() => chooseAsFinal(c.id)}>Обрати як фінальну назву</button>
          )}
        </div>
      ))}
    </div>
  )
}

function ConceptStage({ project, onPatch }) {
  const concepts = project.concepts
  function addConcept() {
    onPatch({ concepts: [...concepts, { id: crypto.randomUUID(), title: '', keywords: '', description: '', chosen: false }] })
  }
  function update(id, patch) {
    onPatch({ concepts: concepts.map((c) => (c.id === id ? { ...c, ...patch } : c)) })
  }
  function remove(id) {
    onPatch({ concepts: concepts.filter((c) => c.id !== id) })
  }
  function choose(id) {
    onPatch({ concepts: concepts.map((c) => ({ ...c, chosen: c.id === id })) })
  }
  return (
    <div className="branding-form">
      <p className="cl-section-title">Концепції бренду</p>
      <p className="cl-tab-desc">Створи щонайменше 2 різні творчі напрямки словами (образи, ключові слова, метафори) і аргументовано обери один.</p>
      <button className="harmony-btn" onClick={addConcept}>+ Новий напрямок</button>
      {concepts.map((c, i) => (
        <div key={c.id} className={'branding-name-card' + (c.chosen ? ' chosen' : '')}>
          <div className="gfx-row" style={{ alignItems: 'center' }}>
            <strong style={{ flex: 1 }}>Напрямок {i + 1}</strong>
            <button className="cl-mini-btn" onClick={() => remove(c.id)}>Видалити</button>
          </div>
          <TextField label="Назва напрямку" value={c.title} onCommit={(v) => update(c.id, { title: v })} />
          <TextField label="Ключові слова" value={c.keywords} onCommit={(v) => update(c.id, { keywords: v })} />
          <TextField label="Опис ідеї" value={c.description} onCommit={(v) => update(c.id, { description: v })} textarea />
          {c.chosen ? <span className="lab-card-badge active">✓ Обраний напрямок</span> : <button className="harmony-btn" onClick={() => choose(c.id)}>Обрати цей напрямок</button>}
        </div>
      ))}
    </div>
  )
}

function TypographyStage({ project, onPatch }) {
  const t = project.typography
  const set = (field) => (val) => onPatch({ typography: { ...t, [field]: val } })
  return (
    <div className="branding-form">
      <p className="cl-section-title">Типографічна система</p>
      <TextField label="Шрифт логотипа" value={t.logoFont} onCommit={set('logoFont')} />
      <TextField label="Фірмовий шрифт заголовків" value={t.headingFont} onCommit={set('headingFont')} />
      <TextField label="Шрифт основного тексту" value={t.bodyFont} onCommit={set('bodyFont')} />
      <TextField label="Правила використання" value={t.rules} onCommit={set('rules')} textarea />
      <p className="cl-tab-desc">Для живого перегляду шрифтів на зразках тексту й створення самого логотипа відкрий «Graphic Design Studio» з модуля 6/8 курсу.</p>
    </div>
  )
}

function GraphicElementsStage({ project, onPatch }) {
  const g = project.graphicElements
  const set = (field) => (val) => onPatch({ graphicElements: { ...g, [field]: val } })
  return (
    <div className="branding-form">
      <p className="cl-section-title">Графічна система та айдентика</p>
      <TextField label="Фірмові форми" value={g.shapes} onCommit={set('shapes')} textarea />
      <TextField label="Патерни" value={g.patterns} onCommit={set('patterns')} textarea />
      <TextField label="Іконографіка" value={g.iconography} onCommit={set('iconography')} textarea />
      <TextField label="Фотостиль" value={g.photoStyle} onCommit={set('photoStyle')} textarea />
      <TextField label="Нотатки" value={g.notes} onCommit={set('notes')} textarea />
    </div>
  )
}

function MediaApplicationsStage({ project, onPatch }) {
  const list = project.mediaApplications
  function add() {
    onPatch({ mediaApplications: [...list, { id: crypto.randomUUID(), type: '', notes: '' }] })
  }
  function update(id, patch) {
    onPatch({ mediaApplications: list.map((m) => (m.id === id ? { ...m, ...patch } : m)) })
  }
  function remove(id) {
    onPatch({ mediaApplications: list.filter((m) => m.id !== id) })
  }
  return (
    <div className="branding-form">
      <p className="cl-section-title">Носії айдентики</p>
      <p className="cl-tab-desc">Застосуй свою систему щонайменше до 3 різних носіїв. Самі матеріали створюй у «Graphic Design Studio» (посилання — модуль 11 курсу), сюди запиши, що саме зроблено й де зберігається.</p>
      <button className="harmony-btn" onClick={add}>+ Новий носій</button>
      {list.map((m) => (
        <div key={m.id} className="branding-name-card">
          <div className="gfx-row" style={{ alignItems: 'center' }}>
            <TextField label="Тип носія (напр. «Візитка»)" value={m.type} onCommit={(v) => update(m.id, { type: v })} />
            <button className="cl-mini-btn" onClick={() => remove(m.id)}>Видалити</button>
          </div>
          <TextField label="Нотатки / посилання на проєкт" value={m.notes} onCommit={(v) => update(m.id, { notes: v })} textarea />
        </div>
      ))}
    </div>
  )
}

const GUIDELINE_PAGES = ['Обкладинка', 'Про бренд', 'Концепція', 'Логотип', 'Версії логотипа', 'Охоронні поля', 'Мінімальний розмір', 'Неправильне використання', 'Кольори', 'Типографіка', 'Графічні елементи', 'Фотостиль', 'Tone of Voice', 'Приклади застосування']

function GuidelinesStage({ project, onPatch }) {
  const pages = project.guidelines.pages
  return (
    <div className="branding-form">
      <p className="cl-section-title">Брендбук</p>
      <p className="cl-tab-desc">Заповнені поля інших етапів (стратегія, лого, палітра, типографіка) підставляються автоматично в підсумкову презентацію; тут запиши текстовий зміст кожної сторінки брендбуку вручну.</p>
      {GUIDELINE_PAGES.map((page) => (
        <TextField key={page} label={page} value={pages[page] || ''} onCommit={(v) => onPatch({ guidelines: { ...project.guidelines, pages: { ...pages, [page]: v } } })} textarea />
      ))}
    </div>
  )
}

function PresentationStage({ project, onPatch }) {
  const slides = project.presentation.slides
  const autoSummary = [
    project.strategy.positioning && `Позиціонування: ${project.strategy.positioning}`,
    project.naming.chosenId && `Назва: ${project.naming.candidates.find((c) => c.id === project.naming.chosenId)?.text}`,
    project.palette.primary.length > 0 && `Основний колір: ${project.palette.primary[0]}`,
  ].filter(Boolean)
  function addSlide() {
    onPatch({ presentation: { slides: [...slides, { id: crypto.randomUUID(), title: '', content: '' }] } })
  }
  function update(id, patch) {
    onPatch({ presentation: { slides: slides.map((s) => (s.id === id ? { ...s, ...patch } : s)) } })
  }
  function remove(id) {
    onPatch({ presentation: { slides: slides.filter((s) => s.id !== id) } })
  }
  return (
    <div className="branding-form">
      <p className="cl-section-title">Презентація бренду</p>
      {autoSummary.length > 0 && (
        <div className="branding-name-card">
          <strong>Автоматично з проєкту:</strong>
          <ul>{autoSummary.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </div>
      )}
      <button className="harmony-btn" onClick={addSlide}>+ Новий слайд</button>
      {slides.map((s, i) => (
        <div key={s.id} className="branding-name-card">
          <div className="gfx-row" style={{ alignItems: 'center' }}>
            <strong style={{ flex: 1 }}>Слайд {i + 1}</strong>
            <button className="cl-mini-btn" onClick={() => remove(s.id)}>Видалити</button>
          </div>
          <TextField label="Заголовок" value={s.title} onCommit={(v) => update(s.id, { title: v })} />
          <TextField label="Зміст" value={s.content} onCommit={(v) => update(s.id, { content: v })} textarea />
        </div>
      ))}
    </div>
  )
}

function PendingStage({ title }) {
  return (
    <div className="branding-form">
      <p className="cl-section-title">{title}</p>
      <div className="empty-state">Інструмент цього етапу ще в розробці — з'явиться на наступному етапі побудови Branding Studio. Дані інших етапів (стратегія, назва, палітра) вже зберігаються й будуть автоматично доступні тут, коли інструмент буде готовий.</div>
    </div>
  )
}

export default function BrandingStudio() {
  const { projectId } = useParams()
  const location = useLocation()
  const { brandProjects, saveBrandProject } = useProgress()
  const toastApi = useLabToast()
  const project = brandProjects.find((p) => p.id === projectId)
  const [stage, setStage] = useState(location.state?.stage || 'brief')

  if (!project) return <NotFound />

  function onPatch(patch) {
    saveBrandProject({ id: project.id, ...patch })
  }

  const help = STAGE_HELP[stage]

  return (
    <div className="branding-studio">
      <div className="dict-breadcrumb">
        <Link to="/academy/branding">Branding Studio</Link> <span>→</span> <span>{project.name}</span>
      </div>
      <div className="gfx-topbar">
        <input className="cl-text-input" style={{ flex: 1, minWidth: 160 }} defaultValue={project.name} onBlur={(e) => onPatch({ name: e.target.value || 'Новий бренд' })} placeholder="Назва проєкту" />
        <button className="harmony-btn" onClick={() => { saveBrandProject(project); toastApi.show('✓ Збережено') }}>💾 Зберегти</button>
      </div>

      <div className="branding-layout">
        <div className="branding-stages">
          {BRAND_STAGES.map((s) => (
            <button key={s.id} className={'branding-stage-btn' + (stage === s.id ? ' active' : '')} onClick={() => setStage(s.id)}>
              {s.emoji} {s.label}
            </button>
          ))}
        </div>

        <div className="branding-center">
          {stage === 'brief' && <BriefStage project={project} onPatch={onPatch} />}
          {stage === 'research' && <ResearchStage project={project} onPatch={onPatch} />}
          {stage === 'strategy' && <StrategyStage project={project} onPatch={onPatch} />}
          {stage === 'naming' && <NamingStage project={project} onPatch={onPatch} toastApi={toastApi} />}
          {stage === 'concept' && <ConceptStage project={project} onPatch={onPatch} />}
          {stage === 'logo' && <PendingStage title="Логотип" />}
          {stage === 'palette' && <PendingStage title="Палітра" />}
          {stage === 'typography' && <TypographyStage project={project} onPatch={onPatch} />}
          {stage === 'graphicElements' && <GraphicElementsStage project={project} onPatch={onPatch} />}
          {stage === 'mediaApplications' && <MediaApplicationsStage project={project} onPatch={onPatch} />}
          {stage === 'guidelines' && <GuidelinesStage project={project} onPatch={onPatch} />}
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
