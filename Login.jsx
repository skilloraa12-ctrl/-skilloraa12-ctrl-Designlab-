import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const user = login(email.trim())
    if (user) {
      navigate('/')
    } else {
      setError('Такого локального акаунта не знайдено. Зареєструйтесь спочатку.')
    }
  }

  return (
    <div style={{ maxWidth: 380 }}>
      <h1 className="page-title">Увійти</h1>
      <p className="page-sub">Локальний акаунт у цьому браузері — без пароля й сервера.</p>
      <form className="pf-form" onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        {error && <p style={{ color: 'var(--coral)', fontSize: 13 }}>{error}</p>}
        <button className="pf-add-btn" type="submit">Увійти</button>
      </form>
      <p className="page-sub">Немає акаунта? <Link to="/register" className="link">Зареєструватись</Link></p>
    </div>
  )
}
