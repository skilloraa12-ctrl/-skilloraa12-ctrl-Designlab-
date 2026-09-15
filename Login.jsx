import { useState } from 'react'
import { useAuth } from './AuthContext.jsx'

function friendlyError(error) {
  const msg = error?.message || ''
  if (msg.toLowerCase().includes('signups not allowed') || error?.status === 400 || error?.status === 422) {
    return 'Ця пошта ще не активована для доступу до курсу. Зверніться до адміністратора, щоб отримати доступ.'
  }
  return msg || 'Щось пішло не так. Спробуйте ще раз.'
}

export default function Login() {
  const { sendMagicLink } = useAuth()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('sending')
    setError('')
    const { error } = await sendMagicLink(email.trim())
    if (error) {
      setError(friendlyError(error))
      setStatus('error')
    } else {
      setStatus('sent')
    }
  }

  if (status === 'sent') {
    return (
      <div style={{ maxWidth: 380 }}>
        <h1 className="page-title">Перевірте пошту</h1>
        <p className="page-sub">
          Ми надіслали посилання для входу на <strong>{email}</strong>.
          Відкрийте лист і натисніть посилання — воно поверне вас сюди вже залогіненими.
        </p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 380 }}>
      <h1 className="page-title">Увійти</h1>
      <p className="page-sub">Вхід без пароля: введіть пошту, ми надішлемо посилання для входу.</p>
      <form className="pf-form" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        {error && <p style={{ color: 'var(--coral)', fontSize: 13 }}>{error}</p>}
        <button className="pf-add-btn" type="submit" disabled={status === 'sending'}>
          {status === 'sending' ? 'Надсилаємо…' : 'Надіслати посилання'}
        </button>
      </form>
    </div>
  )
}
