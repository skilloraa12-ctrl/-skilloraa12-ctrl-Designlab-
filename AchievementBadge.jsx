export default function AchievementBadge({ achievement, unlocked }) {
  return (
    <div className={'badge' + (unlocked ? ' badge--unlocked' : '')}>
      <div className="badge__icon">{unlocked ? '★' : '☆'}</div>
      <div>
        <div className="badge__title">{achievement.title}</div>
        <div className="badge__desc">{achievement.description}</div>
      </div>
    </div>
  )
}
