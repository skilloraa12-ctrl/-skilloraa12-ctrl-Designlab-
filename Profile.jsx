import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext.jsx'
import { useProgress } from './ProgressContext.jsx'

export default function Profile() {
  const { user, loading, profile, saveProfileName, logout } = useAuth()
  const { completedCount, total, xp, level, quizPassedCount, portfolio, resetProgress } = useProgress()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!loading && !user) navigate('/login')
  }, [loading, user, navigate])

  useEffect(() => {
    setName(profile?.full_name ?? '')
  }, [profile])

  if (loading || !user) return null

  async function handleSaveName(e) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    await saveProfileName(name.trim())
    setSaving(false)
    setEditing(false)
  }

  function handleReset() {
    if (confirm('Скинути весь прогрес, портфоліо й палітри? Цю дію не можна скасувати.')) {
      resetProgress()
    }
  }

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <div>
      <h1 className="page-title">Профіль</h1>
      <p className="page-sub">Ваш акаунт — вхід за поштою, дані прив'язані до вашого email.</p>

      <div className="pf-form" style={{ maxWidth: 420 }}>
        {editing ? (
          <form onSubmit={handleSaveName}>
            <input value={name} onChange={(e) => setName(e.target.value)} required />
            <button className="pf-add-btn" type="submit" disabled={saving} style={{ marginTop: 8 }}>
              {saving ? 'Зберігаємо…' : 'Зберегти'}
            </button>
          </form>
        ) : (
          <p style={{ marginTop: 0 }}>
            <b>{profile?.full_name || 'Без імені'}</b>{' '}
            <button className="link" onClick={() => setEditing(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>
              змінити
            </button>
          </p>
        )}
        <p style={{ color: 'var(--muted)', fontSize: 13.5 }}>{user.email}</p>
        <p style={{ color: 'var(--muted)', fontSize: 13.5 }}>
          {completedCount}/{total} модулів пройдено · {quizPassedCount} тестів складено
        </p>
        <p style={{ color: 'var(--muted)', fontSize: 13.5 }}>
          {xp} XP · Рівень {level} · {portfolio.length} проєктів у портфоліо
        </p>
      </div>

      <button className="complete-btn" onClick={handleLogout} style={{ marginRight: 10 }}>Вийти</button>
      <button className="complete-btn" onClick={handleReset} style={{ borderColor: 'var(--coral)', color: 'var(--coral)' }}>
        Скинути прогрес
      </button>
    </div>
  )
}
