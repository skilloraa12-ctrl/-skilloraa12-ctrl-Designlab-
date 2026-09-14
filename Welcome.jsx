import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext.jsx'

export default function Welcome() {
  const { user, loading, profile, profileLoading, saveProfileName } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!loading && !user) navigate('/login')
  }, [loading, user, navigate])

  useEffect(() => {
    if (!profileLoading && profile?.full_name) navigate('/')
  }, [profileLoading, profile, navigate])

  if (loading || profileLoading || !user) return null

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError('')
    const { error } = await saveProfileName(name.trim())
    setSaving(false)
    if (error) {
      setError(error.message)
    } else {
      navigate('/')
    }
  }

  return (
    <div style={{ maxWidth: 380 }}>
      <h1 className="page-title">Як до вас звертатись?</h1>
      <p className="page-sub">Введіть ваше ім'я — воно буде показане у профілі.</p>
      <form className="pf-form" onSubmit={handleSubmit}>
        <input
          placeholder="Ім'я"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        {error && <p style={{ color: 'var(--coral)', fontSize: 13 }}>{error}</p>}
        <button className="pf-add-btn" type="submit" disabled={saving}>
          {saving ? 'Зберігаємо…' : 'Продовжити'}
        </button>
      </form>
    </div>
  )
}
