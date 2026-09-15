import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from './supabaseClient.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)

  const loadProfile = useCallback(async (uid) => {
    if (!uid) {
      setProfile(null)
      setProfileLoading(false)
      return
    }
    setProfileLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('user_id', uid)
      .maybeSingle()
    if (error) {
      console.warn('Не вдалося завантажити профіль', error)
      setProfile({ full_name: '' })
    } else {
      setProfile(data ?? { full_name: '' })
    }
    setProfileLoading(false)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
      loadProfile(session?.user?.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      loadProfile(session?.user?.id)
    })

    return () => subscription.unsubscribe()
  }, [loadProfile])

  const sendMagicLink = useCallback(async (email) => {
    const { error } = await supabase.auth.signInWithOtp({
      shouldCreateUser: false,
      email,
      options: {
        emailRedirectTo: window.location.origin + import.meta.env.BASE_URL,
      },
    })
    return { error }
  }, [])

  const saveProfileName = useCallback(async (fullName) => {
    if (!user) return { error: new Error('Не залогінені') }
    const { error } = await supabase
      .from('profiles')
      .upsert({ user_id: user.id, full_name: fullName })
    if (!error) setProfile({ full_name: fullName })
    return { error }
  }, [user])

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, profile, profileLoading, sendMagicLink, saveProfileName, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth повинен використовуватись всередині AuthProvider')
  return ctx
}
