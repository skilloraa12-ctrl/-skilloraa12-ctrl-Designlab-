import ColorLab from '../components/ColorLab.jsx'

export default function ColorLabPage() {
  return (
    <div>
      <h1 className="page-title">Color Lab</h1>
      <p className="page-sub">Оберіть базовий відтінок і тип гармонії — палітра генерується в реальному часі.</p>
      <ColorLab />
    </div>
  )
}
