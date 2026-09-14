import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useProgress } from './ProgressContext.jsx'

export default function Portfolio() {
  const { portfolio, addPortfolioItem, removePortfolioItem } = useProgress()
  const location = useLocation()
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [tags, setTags] = useState('')

  useEffect(() => {
    if (location.state?.prefillTitle) {
      setTitle(location.state.prefillTitle)
      setTags((location.state.prefillTags || []).join(', '))
    }
  }, [location.state])

  function handleAdd() {
    if (!title.trim()) return
    addPortfolioItem({
      title: title.trim(),
      desc: desc.trim(),
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
    })
    setTitle(''); setDesc(''); setTags('')
  }

  return (
    <div>
      <h1 className="page-title">Портфоліо</h1>
      <p className="page-sub">Додавайте завершені проєкти. Дані зберігаються локально у вашому браузері.</p>

      <div className="pf-form">
        <input placeholder="Назва проєкту" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea placeholder="Короткий опис: бриф, концепція, процес" value={desc} onChange={(e) => setDesc(e.target.value)} />
        <input placeholder="Теги (через кому): branding, logo, print" value={tags} onChange={(e) => setTags(e.target.value)} />
        <button className="pf-add-btn" onClick={handleAdd}>Додати в портфоліо</button>
      </div>

      {portfolio.length === 0 && (
        <div className="empty-state">Портфоліо порожнє. Завершіть перший проєкт і додайте його сюди.</div>
      )}

      {portfolio.map((p) => (
        <div className="pf-card" key={p.id}>
          <button className="pf-del" onClick={() => removePortfolioItem(p.id)}>Видалити</button>
          {p.image && <img src={p.image} alt={p.title} className="pf-card-image" />}
          <h4>{p.title}</h4>
          <p>{p.desc}</p>
          <div className="pf-meta">{p.tags.join(' · ')} — {p.date}</div>
        </div>
      ))}
    </div>
  )
}
