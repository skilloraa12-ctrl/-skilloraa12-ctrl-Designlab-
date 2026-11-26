import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase, APP_ID } from './supabaseClient.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)
  // Якщо сервер не відповідає — не чекаємо вічно на «Завантаження…»,
  // а показуємо помилку з кнопкою «Спробувати знову».
  const [profileError, setProfileError] = useState(false)

  const loadProfile = useCallback(async (uid) => {
    if (!uid) {
      setProfile(null)
      setProfileLoading(false)
      return
    }
    setProfileLoading(true)
    setProfileError(false)
    let timer
    const timeout = new Promise((resolve) => { timer = setTimeout(() => resolve({ timedOut: true }), 15000) })
    const res = await Promise.race([
      supabase.from('profiles').select('full_name').eq('user_id', uid).maybeSingle(),
      timeout,
    ])
    clearTimeout(timer)
    if (res.timedOut) {
      console.warn('Сервер не відповів на запит профілю за 15 с')
      setProfileError(true)
      setProfileLoading(false)
      return
    }
    const { data, error } = res
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
    // Checked BEFORE requesting the magic link: without this, anyone who
    // exists in auth.users (e.g. invited on a different platform sharing
    // this Supabase project) would still receive a sign-in email for
    // Designlab, even with zero course_access grant here.
    const { data: allowed, error: rpcError } = await supabase.rpc('has_course_access', {
      check_email: email,
      check_app_id: APP_ID,
    })
    if (rpcError || !allowed) {
      return { error: { message: 'Signups not allowed for this app' } }
    }
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
    <AuthContext.Provider value={{ user, loading, profile, profileLoading, profileError, retryProfile: () => loadProfile(user?.id), sendMagicLink, saveProfileName, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth повинен використовуватись всередині AuthProvider')
  return ctx
}
