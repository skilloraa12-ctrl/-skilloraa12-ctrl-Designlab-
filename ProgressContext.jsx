import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react'
import { loadJSON, saveJSON } from '../utils/storage.js'
import { MODULES } from '../data/modules.js'
import { ACHIEVEMENTS } from '../data/achievements.js'
import { LEVEL_ORDER } from '../data/levels.js'

const ProgressContext = createContext(null)

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

export function ProgressProvider({ children }) {
  const [completed, setCompleted] = useState(() => loadJSON('completed', {}))
  const [quizPassed, setQuizPassed] = useState(() => loadJSON('quizPassed', {}))
  const [portfolio, setPortfolio] = useState(() => loadJSON('portfolio', []))
  const [palettes, setPalettes] = useState(() => loadJSON('palettes', []))
  const [streakData, setStreakData] = useState(() => loadJSON('streak', { count: 0, lastDay: null }))
  const [unlocked, setUnlocked] = useState(() => loadJSON('achievements', []))

  // Оновлюємо стрік один раз при завантаженні застосунку
  useEffect(() => {
    const today = todayKey()
    setStreakData((prev) => {
      if (prev.lastDay === today) return prev
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
      const next = prev.lastDay === yesterday
        ? { count: prev.count + 1, lastDay: today }
        : { count: 1, lastDay: today }
      saveJSON('streak', next)
      return next
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleModule = useCallback((id) => {
    setCompleted((prev) => {
      const next = { ...prev, [id]: !prev[id] }
      saveJSON('completed', next)
      return next
    })
  }, [])

  const passQuiz = useCallback((moduleId) => {
    setQuizPassed((prev) => {
      if (prev[moduleId]) return prev // бали нараховуються лише один раз за модуль
      const next = { ...prev, [moduleId]: true }
      saveJSON('quizPassed', next)
      return next
    })
  }, [])

  const addPortfolioItem = useCallback((item) => {
    setPortfolio((prev) => {
      const next = [{ id: crypto.randomUUID(), date: new Date().toLocaleDateString('uk-UA'), ...item }, ...prev]
      saveJSON('portfolio', next)
      return next
    })
  }, [])

  const removePortfolioItem = useCallback((id) => {
    setPortfolio((prev) => {
      const next = prev.filter((p) => p.id !== id)
      saveJSON('portfolio', next)
      return next
    })
  }, [])

  const savePalette = useCallback((hexes) => {
    setPalettes((prev) => {
      const next = [hexes, ...prev]
      saveJSON('palettes', next)
      return next
    })
  }, [])

  const removePalette = useCallback((index) => {
    setPalettes((prev) => {
      const next = prev.filter((_, i) => i !== index)
      saveJSON('palettes', next)
      return next
    })
  }, [])

  const resetProgress = useCallback(() => {
    setCompleted({})
    setQuizPassed({})
    setPortfolio([])
    setPalettes([])
    setUnlocked([])
    setStreakData({ count: 0, lastDay: null })
    saveJSON('completed', {})
    saveJSON('quizPassed', {})
    saveJSON('portfolio', [])
    saveJSON('palettes', [])
    saveJSON('achievements', [])
    saveJSON('streak', { count: 0, lastDay: null })
  }, [])

  const completedIds = useMemo(
    () => MODULES.filter((m) => completed[m.id]).map((m) => m.id),
    [completed]
  )
  const completedCount = completedIds.length
  const total = MODULES.length
  const quizPassedCount = Object.values(quizPassed).filter(Boolean).length
  const xp = completedCount * 100 + quizPassedCount * 20
  const level = Math.floor(xp / 500) + 1

  const levelDone = useMemo(() => {
    const map = {}
    LEVEL_ORDER.forEach((lv) => {
      const mods = MODULES.filter((m) => m.level === lv)
      map[lv] = mods.length > 0 && mods.every((m) => completed[m.id])
    })
    return map
  }, [completed])

  // Перевірка досягнень при кожній зміні реального прогресу
  useEffect(() => {
    const stats = {
      completedIds,
      completedCount,
      total,
      levelDone,
      portfolioCount: portfolio.length,
      paletteCount: palettes.length,
      streak: streakData.count,
    }
    const newlyUnlocked = ACHIEVEMENTS.filter(
      (a) => !unlocked.includes(a.slug) && a.check(stats)
    ).map((a) => a.slug)
    if (newlyUnlocked.length > 0) {
      setUnlocked((prev) => {
        const next = [...prev, ...newlyUnlocked]
        saveJSON('achievements', next)
        return next
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completedIds.join(','), portfolio.length, palettes.length, streakData.count])

  const value = {
    completed, toggleModule, completedIds, completedCount, total, xp, level, levelDone,
    quizPassed, passQuiz, quizPassedCount,
    portfolio, addPortfolioItem, removePortfolioItem,
    palettes, savePalette, removePalette,
    streak: streakData.count,
    unlocked,
    resetProgress,
  }

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}

export function useProgress() {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress повинен використовуватись всередині ProgressProvider')
  return ctx
}
