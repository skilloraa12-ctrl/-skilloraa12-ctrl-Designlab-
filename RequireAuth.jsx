import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext.jsx'
import { supabase, APP_ID } from './supabaseClient.js'

export default function RequireAuth({ children }) {
  const { user, loading, profile, profileLoading, logout } = useAuth()
  const navigate = useNavigate()
  const [access, setAccess] = useState('checking') // checking | granted | denied

  useEffect(() => {
    if (!user) {
      setAccess('checking')
      return
    }
    let active = true
    supabase
      .from('course_access')
      .select('app_id')
      .eq('email', user.email)
      .eq('app_id', APP_ID)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return
        setAccess(error || !data ? 'denied' : 'granted')
      })
    return () => {
      active = false
    }
  }, [user])

  useEffect(() => {
    if (loading) return
    if (!user) {
      navigate('/login')
      return
    }
    if (!profileLoading && !profile?.full_name) {
      navigate('/welcome')
    }
  }, [loading, user, profileLoading, profile, navigate])

  if (loading || profileLoading) {
    return <p style={{ padding: 24, color: 'var(--muted)' }}>Завантаження…</p>
  }
  if (!user || !profile?.full_name) return null

  if (access === 'checking') {
    return <p style={{ padding: 24, color: 'var(--muted)' }}>Перевірка доступу…</p>
  }
  if (access === 'denied') {
    return (
      <div style={{ maxWidth: 380 }}>
        <h1 className="page-title">Доступу немає</h1>
        <p className="page-sub">{user.email}</p>
        <p className="page-sub">Зверніться до адміністратора.</p>
        <button className="complete-btn" onClick={logout}>Вийти</button>
      </div>
    )
  }

  return children
}
