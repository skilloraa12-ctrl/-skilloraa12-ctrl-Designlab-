import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div>
      <h1 className="page-title">404</h1>
      <p className="page-sub">Такої сторінки не існує.</p>
      <Link to="/" className="link">← На головну</Link>
    </div>
  )
}
