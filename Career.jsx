import { CAREER_TRACKS } from '../data/careerTracks.js'
import { useProgress } from '../context/ProgressContext.jsx'
import ProgressBar from '../components/ProgressBar.jsx'

export default function Career() {
  const { completed, portfolio } = useProgress()

  const scores = CAREER_TRACKS.map((t) => {
    const done = t.ids.filter((id) => completed[id]).length
    return { label: t.label, done, total: t.ids.length }
  })
  const overall = Math.round(
    scores.reduce((sum, s) => sum + (s.done / s.total) * 100, 0) / scores.length
  )

  return (
    <div>
      <h1 className="page-title">Кар'єрна готовність</h1>
      <p className="page-sub">Показник розраховується лише на основі реально пройдених модулів — без гарантій працевлаштування.</p>

      <div className="readiness-headline">
        <div className="num">{overall}%</div>
        <div className="sub">Ваш поточний рівень підготовки до Junior Designer</div>
      </div>

      {scores.map((s) => <ProgressBar key={s.label} label={s.label} value={s.done} total={s.total} />)}

      <div className="section-head"><h3>Портфоліо</h3></div>
      <ProgressBar label="Проєктів у портфоліо (ціль: 5)" value={Math.min(portfolio.length, 5)} total={5} />
    </div>
  )
}
