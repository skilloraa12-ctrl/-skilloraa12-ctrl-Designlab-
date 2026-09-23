import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext.jsx'
import { supabase } from './supabaseClient.js'

// This Supabase project also backs a separate platform (00100101), sharing
// the same auth.users pool. Being signed in isn't enough on its own to see
// Designlab specifically — course_access (email, app_id) is the extra layer
// that says which app(s) a given email is actually allowed into. See
// https://github.com/skilloraa12-ctrl/00100101-platform/blob/main/supabase/course_access.sql
// for the table + RLS policy (same table, this platform's own app_id).
const APP_ID = 'designlab'

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
        <h1 className="page-title">Доступ ще не надано</h1>
        <p className="page-sub">{user.email}</p>
        <p className="page-sub">Цей акаунт існує, але ще не має доступу саме до Designlab. Зверніться до адміністратора.</p>
        <button className="complete-btn" onClick={logout}>Вийти</button>
      </div>
    )
  }

  return children
}
