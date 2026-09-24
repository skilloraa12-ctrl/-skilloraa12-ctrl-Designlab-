import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from './AuthContext.jsx'
import { useProgress } from './ProgressContext.jsx'
import { loadJSON, saveJSON } from './storage.js'

const NAV_TOP = [
  { to: '/', label: 'Головна', end: true },
  { to: '/academy', label: 'Академія' },
  { to: '/portfolio', label: 'Портфоліо' },
  { to: '/labs', label: 'Design Labs' },
]

// Grouped like 00100101's "Довідка" section — Словник і Довідник живуть
// поруч, а не губляться одне в іншому.
const NAV_REFERENCE = [
  { to: '/dictionary', label: 'Словник' },
  { to: '/guide', label: 'Довідник' },
]

const NAV_BOTTOM = [
  { to: '/career', label: "Кар'єра" },
  { to: '/achievements', label: 'Досягнення' },
]

export default function NavBar() {
  const { user } = useAuth()
  const { xp, level } = useProgress()
  const [theme, setTheme] = useState(() => loadJSON('theme', 'dark'))

  useEffect(() => {
    document.body.setAttribute('data-theme', theme)
  }, [theme])

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    saveJSON('theme', next)
  }

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark" />
        <div className="brand-name">
          DESIGNLAB UA
          <b>Від першої лінії — до дизайну</b>
        </div>
      </div>

      <nav className="nav">
        {NAV_TOP.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}
          >
            <span className="dot" />
            {link.label}
          </NavLink>
        ))}

        <div className="nav-section-title">Довідка</div>
        {NAV_REFERENCE.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}
          >
            <span className="dot" />
            {link.label}
          </NavLink>
        ))}

        {NAV_BOTTOM.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}
          >
            <span className="dot" />
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-foot">
        <div className="stat-pill" style={{ marginBottom: 8 }}>
          <b>{xp}</b>&nbsp;XP · Рівень {level}
        </div>
        <NavLink to="/profile" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
          <span className="dot" />
          {user ? user.email : 'Профіль'}
        </NavLink>
        <button className="nav-item" onClick={toggleTheme}>
          <span className="dot" />
          {theme === 'light' ? 'Світла тема' : 'Темна тема'}
        </button>
      </div>
    </aside>
  )
}
