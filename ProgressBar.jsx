export default function ProgressBar({ label, value, total }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="career-row">
      <div className="career-label">{label}</div>
      <div className="career-bar">
        <div className="career-bar-fill" style={{ width: pct + '%' }} />
      </div>
      <div className="career-pct">{pct}%</div>
    </div>
  )
}
