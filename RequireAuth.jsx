import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext.jsx'

export default function RequireAuth({ children }) {
  const { user, loading, profile, profileLoading } = useAuth()
  const navigate = useNavigate()

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

  return children
}
