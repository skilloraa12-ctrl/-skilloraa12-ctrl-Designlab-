export default function LabToast({ message }) {
  if (!message) return null
  return (
    <div className="lab-toast" role="status" aria-live="polite">
      {message}
    </div>
  )
}
