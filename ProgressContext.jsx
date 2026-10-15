import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { supabase } from './supabaseClient.js'
import { useAuth } from './AuthContext.jsx'
import { MODULES } from './modules.js'
import { ACHIEVEMENTS } from './achievements.js'
import { LEVEL_ORDER } from './levels.js'

const ProgressContext = createContext(null)

const EMPTY_STATE = {
  completed: {},
  quizPassed: {},
  portfolio: [],
  palettes: [],
  savedColors: [],
  savedGradients: [],
  graphicProjects: [],
  brandProjects: [],
  motionProjects: [],
  uxProjects: [],
  gameArtProjects: [],
  logoProjects: [],
  streak: { count: 0, lastDay: null },
  achievements: [],
}

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

export function ProgressProvider({ children }) {
  const { user } = useAuth()
  const [state, setState] = useState(EMPTY_STATE)
  const [ready, setReady] = useState(false)
  const saveTimer = useRef(null)

  useEffect(() => {
    let cancelled = false
    if (!user) {
      setState(EMPTY_STATE)
      setReady(false)
      return
    }
    setReady(false)
    supabase
      .from('progress')
      .select('data')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          console.warn('Не вдалося завантажити прогрес', error)
          setState(EMPTY_STATE)
        } else if (data) {
          setState({ ...EMPTY_STATE, ...data.data })
        } else {
          setState(EMPTY_STATE)
        }
        setReady(true)
      })
    return () => { cancelled = true }
  }, [user])

  useEffect(() => {
    if (!ready) return
    const today = todayKey()
    setState((prev) => {
      if (prev.streak.lastDay === today) return prev
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
      const nextStreak = prev.streak.lastDay === yesterday
        ? { count: prev.streak.count + 1, lastDay: today }
        : { count: 1, lastDay: today }
      return { ...prev, streak: nextStreak }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  useEffect(() => {
    if (!ready || !user) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      supabase
        .from('progress')
        .upsert({ user_id: user.id, data: state, updated_at: new Date().toISOString() })
        .then(({ error }) => {
          if (error) console.warn('Не вдалося зберегти прогрес', error)
        })
    }, 600)
    return () => clearTimeout(saveTimer.current)
  }, [state, ready, user])

  const toggleModule = useCallback((id) => {
    setState((prev) => ({ ...prev, completed: { ...prev.completed, [id]: !prev.completed[id] } }))
  }, [])

  const passQuiz = useCallback((moduleId) => {
    setState((prev) => {
      if (prev.quizPassed[moduleId]) return prev
      return { ...prev, quizPassed: { ...prev.quizPassed, [moduleId]: true } }
    })
  }, [])

  const addPortfolioItem = useCallback((item) => {
    setState((prev) => ({
      ...prev,
      portfolio: [{ id: crypto.randomUUID(), date: new Date().toLocaleDateString('uk-UA'), ...item }, ...prev.portfolio],
    }))
  }, [])

  const removePortfolioItem = useCallback((id) => {
    setState((prev) => ({ ...prev, portfolio: prev.portfolio.filter((p) => p.id !== id) }))
  }, [])

  const savePalette = useCallback((hexes) => {
    setState((prev) => ({ ...prev, palettes: [hexes, ...prev.palettes] }))
  }, [])

  const removePalette = useCallback((index) => {
    setState((prev) => ({ ...prev, palettes: prev.palettes.filter((_, i) => i !== index) }))
  }, [])

  const saveColor = useCallback((hex) => {
    setState((prev) => (
      prev.savedColors.includes(hex) ? prev : { ...prev, savedColors: [hex, ...prev.savedColors] }
    ))
  }, [])

  const removeColor = useCallback((hex) => {
    setState((prev) => ({ ...prev, savedColors: prev.savedColors.filter((c) => c !== hex) }))
  }, [])

  const saveGradient = useCallback((gradient) => {
    setState((prev) => ({ ...prev, savedGradients: [{ id: crypto.randomUUID(), ...gradient }, ...prev.savedGradients] }))
  }, [])

  const removeGradient = useCallback((id) => {
    setState((prev) => ({ ...prev, savedGradients: prev.savedGradients.filter((g) => g.id !== id) }))
  }, [])

  // На відміну від palettes/savedColors (додаються в кінець, незмінні),
  // графічні проєкти редагуються й повторно відкриваються — тому збереження
  // за наявним id оновлює той самий запис на місці, а не додає дублікат.
  const saveGraphicProject = useCallback((project) => {
    const id = project.id || crypto.randomUUID()
    setState((prev) => {
      const exists = prev.graphicProjects.some((p) => p.id === id)
      const record = { ...project, id, updatedAt: new Date().toISOString() }
      return {
        ...prev,
        graphicProjects: exists
          ? prev.graphicProjects.map((p) => (p.id === id ? record : p))
          : [record, ...prev.graphicProjects],
      }
    })
    return id
  }, [])

  const removeGraphicProject = useCallback((id) => {
    setState((prev) => ({ ...prev, graphicProjects: prev.graphicProjects.filter((p) => p.id !== id) }))
  }, [])

  // Єдина модель брендингового проєкту (Branding Studio) — усі інструменти
  // майстерні (бриф, стратегія, нейминг, мудборд, лого/колір/типографіка,
  // носії, брендбук, презентація) читають і пишуть той самий запис за id,
  // тож зміна, скажімо, палітри одразу видно в брендбуку й презентації
  // без окремих копій даних у кожному інструменті.
  const saveBrandProject = useCallback((project) => {
    const id = project.id || crypto.randomUUID()
    setState((prev) => {
      const exists = prev.brandProjects.find((p) => p.id === id)
      const now = new Date().toISOString()
      const record = { ...exists, ...project, id, createdAt: exists?.createdAt || now, updatedAt: now }
      return {
        ...prev,
        brandProjects: exists
          ? prev.brandProjects.map((p) => (p.id === id ? record : p))
          : [record, ...prev.brandProjects],
      }
    })
    return id
  }, [])

  const removeBrandProject = useCallback((id) => {
    setState((prev) => ({ ...prev, brandProjects: prev.brandProjects.filter((p) => p.id !== id) }))
  }, [])

  const duplicateBrandProject = useCallback((id) => {
    let newId = null
    setState((prev) => {
      const src = prev.brandProjects.find((p) => p.id === id)
      if (!src) return prev
      newId = crypto.randomUUID()
      const now = new Date().toISOString()
      const copy = { ...src, id: newId, name: src.name + ' (копія)', createdAt: now, updatedAt: now }
      return { ...prev, brandProjects: [copy, ...prev.brandProjects] }
    })
    return newId
  }, [])

  // Єдина модель моушн-проєкту (Motion Design Studio) — та сама логіка
  // злиття за полями, що й у Branding Studio: кожен етап майстерні
  // (Ідея, Розкадровка, Анімація, Ефекти, Звук, Експорт, Презентація)
  // пише у той самий запис, тож тривалість сцени, задана на етапі
  // Анімації, одразу видно в підсумку Презентації.
  const saveMotionProject = useCallback((project) => {
    const id = project.id || crypto.randomUUID()
    setState((prev) => {
      const exists = prev.motionProjects.find((p) => p.id === id)
      const now = new Date().toISOString()
      const record = { ...exists, ...project, id, createdAt: exists?.createdAt || now, updatedAt: now }
      return {
        ...prev,
        motionProjects: exists
          ? prev.motionProjects.map((p) => (p.id === id ? record : p))
          : [record, ...prev.motionProjects],
      }
    })
    return id
  }, [])

  const removeMotionProject = useCallback((id) => {
    setState((prev) => ({ ...prev, motionProjects: prev.motionProjects.filter((p) => p.id !== id) }))
  }, [])

  const duplicateMotionProject = useCallback((id) => {
    let newId = null
    setState((prev) => {
      const src = prev.motionProjects.find((p) => p.id === id)
      if (!src) return prev
      newId = crypto.randomUUID()
      const now = new Date().toISOString()
      const copy = { ...src, id: newId, name: src.name + ' (копія)', createdAt: now, updatedAt: now }
      return { ...prev, motionProjects: [copy, ...prev.motionProjects] }
    })
    return newId
  }, [])

  // Єдина модель UX-проєкту (UX Design Studio) — та сама логіка злиття
  // за полями: кожен етап (Дослідження, Персона, User Journey, User
  // Flow, Wireframes, Прототип, Тестування, UX Audit, Презентація)
  // пише у той самий запис, тож персона, створена на своєму етапі,
  // одразу видна в автозведенні UX-кейсу.
  const saveUxProject = useCallback((project) => {
    const id = project.id || crypto.randomUUID()
    setState((prev) => {
      const exists = prev.uxProjects.find((p) => p.id === id)
      const now = new Date().toISOString()
      const record = { ...exists, ...project, id, createdAt: exists?.createdAt || now, updatedAt: now }
      return {
        ...prev,
        uxProjects: exists
          ? prev.uxProjects.map((p) => (p.id === id ? record : p))
          : [record, ...prev.uxProjects],
      }
    })
    return id
  }, [])

  const removeUxProject = useCallback((id) => {
    setState((prev) => ({ ...prev, uxProjects: prev.uxProjects.filter((p) => p.id !== id) }))
  }, [])

  const duplicateUxProject = useCallback((id) => {
    let newId = null
    setState((prev) => {
      const src = prev.uxProjects.find((p) => p.id === id)
      if (!src) return prev
      newId = crypto.randomUUID()
      const now = new Date().toISOString()
      const copy = { ...src, id: newId, name: src.name + ' (копія)', createdAt: now, updatedAt: now }
      return { ...prev, uxProjects: [copy, ...prev.uxProjects] }
    })
    return newId
  }, [])

  const saveGameArtProject = useCallback((project) => {
    const id = project.id || crypto.randomUUID()
    setState((prev) => {
      const exists = prev.gameArtProjects.find((p) => p.id === id)
      const now = new Date().toISOString()
      const record = { ...exists, ...project, id, createdAt: exists?.createdAt || now, updatedAt: now }
      return {
        ...prev,
        gameArtProjects: exists
          ? prev.gameArtProjects.map((p) => (p.id === id ? record : p))
          : [record, ...prev.gameArtProjects],
      }
    })
    return id
  }, [])

  const removeGameArtProject = useCallback((id) => {
    setState((prev) => ({ ...prev, gameArtProjects: prev.gameArtProjects.filter((p) => p.id !== id) }))
  }, [])

  const duplicateGameArtProject = useCallback((id) => {
    let newId = null
    setState((prev) => {
      const src = prev.gameArtProjects.find((p) => p.id === id)
      if (!src) return prev
      newId = crypto.randomUUID()
      const now = new Date().toISOString()
      const copy = { ...src, id: newId, name: src.name + ' (копія)', createdAt: now, updatedAt: now }
      return { ...prev, gameArtProjects: [copy, ...prev.gameArtProjects] }
    })
    return newId
  }, [])

  const saveLogoProject = useCallback((project) => {
    const id = project.id || crypto.randomUUID()
    setState((prev) => {
      const exists = prev.logoProjects.find((p) => p.id === id)
      const now = new Date().toISOString()
      const record = { ...exists, ...project, id, createdAt: exists?.createdAt || now, updatedAt: now }
      return {
        ...prev,
        logoProjects: exists
          ? prev.logoProjects.map((p) => (p.id === id ? record : p))
          : [record, ...prev.logoProjects],
      }
    })
    return id
  }, [])

  const removeLogoProject = useCallback((id) => {
    setState((prev) => ({ ...prev, logoProjects: prev.logoProjects.filter((p) => p.id !== id) }))
  }, [])

  const duplicateLogoProject = useCallback((id) => {
    let newId = null
    setState((prev) => {
      const src = prev.logoProjects.find((p) => p.id === id)
      if (!src) return prev
      newId = crypto.randomUUID()
      const now = new Date().toISOString()
      const copy = { ...src, id: newId, name: src.name + ' (копія)', createdAt: now, updatedAt: now }
      return { ...prev, logoProjects: [copy, ...prev.logoProjects] }
    })
    return newId
  }, [])

  const resetProgress = useCallback(() => {
    setState(EMPTY_STATE)
  }, [])

  const completedIds = useMemo(
    () => MODULES.filter((m) => state.completed[m.id]).map((m) => m.id),
    [state.completed]
  )
  const completedCount = completedIds.length
  const total = MODULES.length
  const quizPassedCount = Object.values(state.quizPassed).filter(Boolean).length
  const xp = completedCount * 100 + quizPassedCount * 20
  const level = Math.floor(xp / 500) + 1

  const levelDone = useMemo(() => {
    const map = {}
    LEVEL_ORDER.forEach((lv) => {
      const mods = MODULES.filter((m) => m.level === lv)
      map[lv] = mods.length > 0 && mods.every((m) => state.completed[m.id])
    })
    return map
  }, [state.completed])

  useEffect(() => {
    if (!ready) return
    const stats = {
      completedIds,
      completedCount,
      total,
      levelDone,
      portfolioCount: state.portfolio.length,
      paletteCount: state.palettes.length,
      streak: state.streak.count,
    }
    const newlyUnlocked = ACHIEVEMENTS.filter(
      (a) => !state.achievements.includes(a.slug) && a.check(stats)
    ).map((a) => a.slug)
    if (newlyUnlocked.length > 0) {
      setState((prev) => ({ ...prev, achievements: [...prev.achievements, ...newlyUnlocked] }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, completedIds.join(','), state.portfolio.length, state.palettes.length, state.streak.count])

  const value = {
    ready,
    completed: state.completed, toggleModule, completedIds, completedCount, total, xp, level, levelDone,
    quizPassed: state.quizPassed, passQuiz, quizPassedCount,
    portfolio: state.portfolio, addPortfolioItem, removePortfolioItem,
    palettes: state.palettes, savePalette, removePalette,
    savedColors: state.savedColors, saveColor, removeColor,
    savedGradients: state.savedGradients, saveGradient, removeGradient,
    graphicProjects: state.graphicProjects, saveGraphicProject, removeGraphicProject,
    brandProjects: state.brandProjects, saveBrandProject, removeBrandProject, duplicateBrandProject,
    motionProjects: state.motionProjects, saveMotionProject, removeMotionProject, duplicateMotionProject,
    uxProjects: state.uxProjects, saveUxProject, removeUxProject, duplicateUxProject,
    gameArtProjects: state.gameArtProjects, saveGameArtProject, removeGameArtProject, duplicateGameArtProject,
    logoProjects: state.logoProjects, saveLogoProject, removeLogoProject, duplicateLogoProject,
    streak: state.streak.count,
    unlocked: state.achievements,
    resetProgress,
  }

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}

export function useProgress() {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress повинен використовуватись всередині ProgressProvider')
  return ctx
}
