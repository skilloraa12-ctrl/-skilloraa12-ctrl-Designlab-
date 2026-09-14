import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from './AuthContext.jsx'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return
    register(name.trim(), email.trim())
    navigate('/')
  }

  return (
    <div style={{ maxWidth: 380 }}>
      <h1 className="page-title">Реєстрація</h1>
      <p className="page-sub">Створіть локальний акаунт, щоб зберігати прогрес у цьому браузері.</p>
      <form className="pf-form" onSubmit={handleSubmit}>
        <input placeholder="Ім'я" value={name} onChange={(e) => setName(e.target.value)} required />
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <button className="pf-add-btn" type="submit">Зареєструватись</button>
      </form>
      <p className="page-sub">Вже є акаунт? <Link to="/login" className="link">Увійти</Link></p>
    </div>
  )
}
