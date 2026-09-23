import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useProgress } from './ProgressContext.jsx'
import { useAuth } from './AuthContext.jsx'
import { supabase } from './supabaseClient.js'
import { DIRECTIONS } from './directions.js'

export default function Portfolio() {
  const { portfolio, addPortfolioItem, removePortfolioItem } = useProgress()
  const { user } = useAuth()
  const location = useLocation()
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [tags, setTags] = useState('')
  const [direction, setDirection] = useState('')
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [filterDirection, setFilterDirection] = useState('')

  useEffect(() => {
    if (location.state?.prefillTitle) {
      setTitle(location.state.prefillTitle)
      setTags((location.state.prefillTags || []).join(', '))
      if (location.state.prefillDirection) setDirection(location.state.prefillDirection)
    }
  }, [location.state])

  async function handleAdd() {
    if (!title.trim() || uploading) return
    setUploading(true)
    setUploadError('')
    const attachments = []
    for (const file of files) {
      const path = `${user.id}/${crypto.randomUUID()}-${file.name}`
      const { error } = await supabase.storage.from('portfolio').upload(path, file)
      if (error) {
        setUploadError(`Не вдалося завантажити "${file.name}": ${error.message}`)
        continue
      }
      const { data } = supabase.storage.from('portfolio').getPublicUrl(path)
      attachments.push({ url: data.publicUrl, path, name: file.name, type: file.type.startsWith('image/') ? 'image' : 'file' })
    }
    addPortfolioItem({
      title: title.trim(),
      desc: desc.trim(),
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      direction,
      attachments,
    })
    setTitle(''); setDesc(''); setTags(''); setDirection(''); setFiles([])
    setUploading(false)
  }

  async function handleRemove(item) {
    removePortfolioItem(item.id)
    for (const a of item.attachments || []) {
      if (a.path) await supabase.storage.from('portfolio').remove([a.path])
    }
  }

  const usedDirections = DIRECTIONS.filter((d) => portfolio.some((p) => p.direction === d.name))
  const visible = filterDirection ? portfolio.filter((p) => p.direction === filterDirection) : portfolio

  return (
    <div>
      <h1 className="page-title">Портфоліо</h1>
      <p className="page-sub">Додавайте завершені проєкти з будь-якого напрямку дизайну — із зображеннями чи PDF. Зберігається у вашому акаунті, доступне з будь-якого пристрою.</p>

      <div className="pf-form">
        <select value={direction} onChange={(e) => setDirection(e.target.value)}>
          <option value="">Напрямок (необов'язково)</option>
          {DIRECTIONS.map((d) => <option key={d.name} value={d.name}>{d.emoji} {d.name}</option>)}
        </select>
        <input placeholder="Назва проєкту" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea placeholder="Короткий опис: бриф, концепція, процес" value={desc} onChange={(e) => setDesc(e.target.value)} />
        <input placeholder="Теги (через кому): branding, logo, print" value={tags} onChange={(e) => setTags(e.target.value)} />
        <input type="file" accept="image/*,.pdf" multiple onChange={(e) => setFiles(Array.from(e.target.files))} />
        {files.length > 0 && <p className="pf-file-list">Обрано: {files.map((f) => f.name).join(', ')}</p>}
        {uploadError && <p className="pf-upload-error">{uploadError}</p>}
        <button className="pf-add-btn" onClick={handleAdd} disabled={uploading || !title.trim()}>
          {uploading ? 'Завантаження…' : 'Додати в портфоліо'}
        </button>
      </div>

      {usedDirections.length > 1 && (
        <div className="pf-filter">
          <button className={`pf-filter-btn${!filterDirection ? ' active' : ''}`} onClick={() => setFilterDirection('')}>Усі</button>
          {usedDirections.map((d) => (
            <button
              key={d.name}
              className={`pf-filter-btn${filterDirection === d.name ? ' active' : ''}`}
              onClick={() => setFilterDirection(d.name)}
            >
              {d.emoji} {d.name}
            </button>
          ))}
        </div>
      )}

      {visible.length === 0 && (
        <div className="empty-state">
          {portfolio.length === 0 ? 'Портфоліо порожнє. Завершіть перший проєкт і додайте його сюди.' : 'Немає проєктів у цьому напрямку.'}
        </div>
      )}

      {visible.map((p) => {
        const images = (p.attachments || []).filter((a) => a.type === 'image')
        const otherFiles = (p.attachments || []).filter((a) => a.type !== 'image')
        const dir = DIRECTIONS.find((d) => d.name === p.direction)
        return (
          <div className="pf-card" key={p.id}>
            <button className="pf-del" onClick={() => handleRemove(p)}>Видалити</button>
            {dir && <div className="pf-direction">{dir.emoji} {dir.name}</div>}
            {images.length > 0 && (
              <div className="pf-attachments">
                {images.map((a, i) => <img key={i} src={a.url} alt={a.name} className="pf-card-image" />)}
              </div>
            )}
            <h4>{p.title}</h4>
            <p>{p.desc}</p>
            {otherFiles.length > 0 && (
              <div className="pf-files">
                {otherFiles.map((a, i) => (
                  <a key={i} href={a.url} target="_blank" rel="noopener noreferrer" className="pf-file-link">📄 {a.name}</a>
                ))}
              </div>
            )}
            <div className="pf-meta">{p.tags.join(' · ')} — {p.date}</div>
          </div>
        )
      })}
    </div>
  )
}
