import { Link } from 'react-router-dom'
import LabToast from './LabToast.jsx'

// Shared page frame for every Lab: back-to-catalog link, title, Undo/Redo,
// Beginner/Pro toggle, a slot for Lab-specific extra actions, and a toast
// for save/copy/export feedback. Each Lab still designs its own body -
// this only standardizes the chrome around it.
export default function LabShell({
  title,
  subtitle,
  icon,
  backTo = '/labs',
  mode,
  onToggleMode,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  toast,
  extra,
  children,
}) {
  return (
    <div className="lab-shell">
      <div className="lab-shell-header">
        <Link to={backTo} className="lab-shell-back">← Labs</Link>
        <div className="lab-shell-title-row">
          <h1 className="page-title lab-shell-title">{icon} {title}</h1>
        </div>
        {subtitle && <p className="page-sub lab-shell-sub">{subtitle}</p>}
        <div className="lab-shell-toolbar">
          {(onUndo || onRedo) && (
            <div className="lab-toolbar-group">
              <button
                type="button"
                className="lab-tool-btn"
                onClick={onUndo}
                disabled={!canUndo}
                title="Undo (Ctrl/Cmd+Z)"
              >
                ↶ Undo
              </button>
              <button
                type="button"
                className="lab-tool-btn"
                onClick={onRedo}
                disabled={!canRedo}
                title="Redo (Ctrl/Cmd+Shift+Z)"
              >
                ↷ Redo
              </button>
            </div>
          )}
          {onToggleMode && (
            <button
              type="button"
              className="lab-mode-toggle"
              onClick={onToggleMode}
              title="Перемкнути режим новачок/про"
            >
              {mode === 'pro' ? '🔵 Pro' : '🟢 Beginner'}
            </button>
          )}
          {extra}
        </div>
      </div>
      <div className="lab-shell-body">{children}</div>
      <LabToast message={toast} />
    </div>
  )
}
