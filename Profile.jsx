import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useProgress } from '../context/ProgressContext.jsx'

export default function Profile() {
  const { user, logout } = useAuth()
  const { completedCount, total, xp, level, portfolio, resetProgress } = useProgress()
  const navigate = useNavigate()

  if (!user) {
    navigate('/login')
    return null
  }

  function handleReset() {
    if (confirm('Скинути весь прогрес, портфоліо й палітри? Цю дію не можна скасувати.')) {
      resetProgress()
    }
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div>
      <h1 className="page-title">Профіль</h1>
      <p className="page-sub">Ваш локальний акаунт — дані зберігаються лише у цьому браузері.</p>

      <div className="pf-form" style={{ maxWidth: 420 }}>
        <p style={{ marginTop: 0 }}><b>{user.name}</b></p>
        <p style={{ color: 'var(--muted)', fontSize: 13.5 }}>{user.email}</p>
        <p style={{ color: 'var(--muted)', fontSize: 13.5 }}>
          {completedCount}/{total} модулів · {xp} XP · Рівень {level} · {portfolio.length} проєктів у портфоліо
        </p>
      </div>

      <button className="complete-btn" onClick={handleLogout} style={{ marginRight: 10 }}>Вийти</button>
      <button className="complete-btn" onClick={handleReset} style={{ borderColor: 'var(--coral)', color: 'var(--coral)' }}>
        Скинути прогрес
      </button>
    </div>
  )
}
