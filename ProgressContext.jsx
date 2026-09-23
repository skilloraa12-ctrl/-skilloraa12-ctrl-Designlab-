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
