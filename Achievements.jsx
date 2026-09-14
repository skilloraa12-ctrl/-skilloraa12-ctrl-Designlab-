import { ACHIEVEMENTS } from '../data/achievements.js'
import { useProgress } from '../context/ProgressContext.jsx'
import AchievementBadge from '../components/AchievementBadge.jsx'

export default function Achievements() {
  const { unlocked } = useProgress()

  return (
    <div>
      <h1 className="page-title">Досягнення</h1>
      <p className="page-sub">{unlocked.length}/{ACHIEVEMENTS.length} розблоковано — на основі реального прогресу, без імітації.</p>

      <div className="badge-grid">
        {ACHIEVEMENTS.map((a) => (
          <AchievementBadge key={a.slug} achievement={a} unlocked={unlocked.includes(a.slug)} />
        ))}
      </div>
    </div>
  )
}
