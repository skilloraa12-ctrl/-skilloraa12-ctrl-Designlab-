import { useEffect } from 'react'
import LabShell from './labs/LabShell.jsx'
import LabInfoTip from './labs/LabInfoTip.jsx'
import PixelCanvasEditor from './labs/PixelCanvasEditor.jsx'
import { useLabHistory } from './labs/useLabHistory.js'
import { useLabMode } from './labs/useLabMode.js'
import { useLabToast } from './labs/useLabToast.js'
import { useLabShortcuts } from './labs/useLabShortcuts.js'
import { useLabRecent } from './labs/useLabRecent.js'
import { emptyGrid } from './labs/pixelArtEngine.js'

// Самостійна сторінка Pixel Art Editor — тонка обгортка (LabShell +
// undo/redo історія + ярлики) навколо спільного двигуна
// labs/PixelCanvasEditor.jsx, яким же малює й вбудований редактор
// просто в Game Art Studio (розділ «2D-концепти»).

function HelpBox({ children }) {
  return (
    <details className="cl-help" open>
      <summary>❓ Як це працює (пояснення простими словами)</summary>
      <div className="cl-help-body">{children}</div>
    </details>
  )
}

export default function PixelArtLab() {
  const hist = useLabHistory({ size: 16, pixels: emptyGrid(16) })
  const { size, pixels } = hist.value

  const labMode = useLabMode()
  const toastApi = useLabToast()
  const { push: pushRecentLab } = useLabRecent('lab')
  useEffect(() => {
    pushRecentLab('pixel-art')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function commitPixels(next) {
    hist.set({ size, pixels: next })
  }
  function changeSize(newSize) {
    hist.reset({ size: newSize, pixels: emptyGrid(newSize) })
    toastApi.show(`✓ Нове полотно ${newSize}×${newSize}`)
  }

  useLabShortcuts({
    onUndo: hist.canUndo ? hist.undo : undefined,
    onRedo: hist.canRedo ? hist.redo : undefined,
  })

  return (
    <LabShell
      title="Pixel Art Editor"
      subtitle="Справжній піксельний редактор: обмежена палітра, олівець, гумка, заливка, піпетка, скасування дій і експорт PNG у 1x та 8x."
      icon="🟪"
      mode={labMode.mode}
      onToggleMode={labMode.toggle}
      canUndo={hist.canUndo}
      canRedo={hist.canRedo}
      onUndo={hist.undo}
      onRedo={hist.redo}
      toast={toastApi.toast}
      extra={
        <LabInfoTip title="Керування">
          Клік/перетягування лівою кнопкою — малювати обраним інструментом. Олівець фарбує піксель, Гумка стирає, Заливка заповнює суцільну область, Піпетка бере колір з полотна.
        </LabInfoTip>
      }
    >
      <div className="cl">
        <PixelCanvasEditor
          size={size}
          pixels={pixels}
          onChangePixels={commitPixels}
          onSizeChange={changeSize}
          onMessage={toastApi.show}
        />
        <div className="cl-panel" style={{ marginTop: 16 }}>
          <p className="cl-tab-desc">Піксельна графіка — малювання по жорсткій сітці з обмеженою кількістю кольорів. Саме так створені всі класичні 2D-ігри: кожен піксель — свідоме рішення, а не випадковий мазок пензля.</p>
          <HelpBox>
            <p>Обмежена палітра змушує продумувати кожен відтінок заздалегідь, замість покладатись на плавні градієнти — це і є дисципліна піксель-арту.</p>
            <p>Заливка (flood fill) заповнює лише суцільну область одного кольору навколо точки кліку — межею служить будь-який інший колір чи прозорість, так само, як «відро з фарбою» в Photoshop/Aseprite.</p>
            <p>Експорт 1x дає файл рівно {size}×{size} пікселів — саме такий розмір реально піде у спрайт гри. Експорт 8x — та сама картинка, збільшена без згладжування, зручна лише для перегляду чи презентації.</p>
          </HelpBox>
        </div>
      </div>
    </LabShell>
  )
}
