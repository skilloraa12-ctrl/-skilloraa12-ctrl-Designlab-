import { useEffect, useRef, useState } from 'react'
import Phaser from 'phaser'

// Справжній проходжуваний прототип рівня на Phaser (arcade physics) —
// бере ту саму сітку з вкладки «Рівень» і робить з неї гру з реальним
// рухом, гравітацією (режим «Платформер») чи рухом у 4 напрямки
// (режим «Вигляд зверху»), а не лише статичну схему для планування.

const CELL = 42
const SURVIVAL_GOAL_SECONDS = 45

const COLORS = {
  ground: 0x6b4a30, platform: 0x2fa36b, wall: 0x45454f, door: 0x5a3c23,
  hazardCore: 0xd14d32, hazardSpike: 0xffb347,
  enemyBody: 0x6b4fa0, enemySpike: 0x3d2d66,
  coin: 0xf0c020, coinInner: 0xfff2b0, key: 0xe0b020,
  checkpointPole: 0x777777, checkpointFlag: 0x9be3c8,
  playerBody: 0x2f6fa3, playerFace: 0xffffff,
  finishPole: 0xcccccc, finishFlag: 0xd9534f,
}

function solidTilesForMode(mode) {
  return mode === 'platformer' ? new Set(['wall', 'ground', 'platform']) : new Set(['wall'])
}

function buildTextures(scene) {
  const g = scene.add.graphics()
  const draw = (key, fn) => { g.clear(); fn(); g.generateTexture(key, CELL, CELL) }

  draw('t_ground', () => {
    g.fillStyle(COLORS.ground, 1).fillRect(0, 0, CELL, CELL)
    g.fillStyle(COLORS.platform, 1).fillRect(0, 0, CELL, Math.round(CELL * 0.22))
  })
  draw('t_platform', () => {
    g.fillStyle(COLORS.platform, 1).fillRect(0, 0, CELL, CELL)
    g.fillStyle(0xffffff, 0.18).fillRect(0, 0, CELL, Math.round(CELL * 0.18))
  })
  draw('t_wall', () => {
    g.fillStyle(COLORS.wall, 1).fillRect(0, 0, CELL, CELL)
    g.lineStyle(1, 0x30303a, 1)
    g.strokeRect(0, 0, CELL, CELL / 2); g.strokeRect(0, CELL / 2, CELL, CELL / 2)
    g.strokeRect(CELL / 2, 0, CELL / 2, CELL / 2)
  })
  draw('t_door', () => {
    g.fillStyle(COLORS.door, 1).fillRect(0, 0, CELL, CELL)
    g.fillStyle(0x2e1f12, 1).fillRect(CELL * 0.42, CELL * 0.3, CELL * 0.16, CELL * 0.16)
  })
  draw('t_hazard', () => {
    g.fillStyle(COLORS.hazardCore, 1).fillRect(0, CELL * 0.55, CELL, CELL * 0.45)
    g.fillStyle(COLORS.hazardSpike, 1)
    for (let i = 0; i < 4; i++) {
      const x0 = i * (CELL / 4)
      g.fillTriangle(x0, CELL * 0.55, x0 + CELL / 8, CELL * 0.15, x0 + CELL / 4, CELL * 0.55)
    }
  })
  draw('t_enemy', () => {
    g.fillStyle(COLORS.enemySpike, 1)
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2
      g.fillTriangle(
        CELL / 2, CELL / 2,
        CELL / 2 + Math.cos(a) * CELL * 0.46, CELL / 2 + Math.sin(a) * CELL * 0.46,
        CELL / 2 + Math.cos(a + 0.5) * CELL * 0.46, CELL / 2 + Math.sin(a + 0.5) * CELL * 0.46,
      )
    }
    g.fillStyle(COLORS.enemyBody, 1).fillCircle(CELL / 2, CELL / 2, CELL * 0.32)
    g.fillStyle(0xffffff, 1).fillCircle(CELL * 0.42, CELL * 0.44, CELL * 0.06)
    g.fillStyle(0xffffff, 1).fillCircle(CELL * 0.58, CELL * 0.44, CELL * 0.06)
  })
  draw('t_coin', () => {
    g.fillStyle(COLORS.coin, 1).fillCircle(CELL / 2, CELL / 2, CELL * 0.3)
    g.fillStyle(COLORS.coinInner, 1).fillCircle(CELL / 2, CELL / 2, CELL * 0.16)
  })
  draw('t_key', () => {
    g.fillStyle(COLORS.key, 1).fillCircle(CELL * 0.38, CELL * 0.4, CELL * 0.16)
    g.fillStyle(COLORS.key, 1).fillRect(CELL * 0.46, CELL * 0.36, CELL * 0.34, CELL * 0.09)
    g.fillStyle(COLORS.key, 1).fillRect(CELL * 0.68, CELL * 0.45, CELL * 0.08, CELL * 0.14)
  })
  draw('t_checkpoint', () => {
    g.fillStyle(COLORS.checkpointPole, 1).fillRect(CELL * 0.46, CELL * 0.1, CELL * 0.08, CELL * 0.8)
    g.fillStyle(COLORS.checkpointFlag, 1).fillTriangle(CELL * 0.54, CELL * 0.12, CELL * 0.54, CELL * 0.4, CELL * 0.9, CELL * 0.26)
  })
  draw('t_finish', () => {
    g.fillStyle(COLORS.finishPole, 1).fillRect(CELL * 0.46, CELL * 0.05, CELL * 0.08, CELL * 0.9)
    g.fillStyle(COLORS.finishFlag, 1).fillTriangle(CELL * 0.54, CELL * 0.08, CELL * 0.54, CELL * 0.36, CELL * 0.92, CELL * 0.22)
  })
  draw('t_player', () => {
    g.fillStyle(COLORS.playerBody, 1).fillRoundedRect(CELL * 0.2, CELL * 0.12, CELL * 0.6, CELL * 0.76, 8)
    g.fillStyle(COLORS.playerFace, 1).fillCircle(CELL * 0.4, CELL * 0.36, CELL * 0.07)
    g.fillStyle(COLORS.playerFace, 1).fillCircle(CELL * 0.6, CELL * 0.36, CELL * 0.07)
  })
  g.destroy()
}

function cellCenter(r, c) { return { x: c * CELL + CELL / 2, y: r * CELL + CELL / 2 } }

function makeSceneConfig({ grid, mode, goal, onState, onEnd }) {
  const rows = grid.length
  const cols = grid[0]?.length || 0
  const solidSet = solidTilesForMode(mode)

  let player, solidGroup, hazardsGroup, coinsGroup, keysGroup, checkpointGroup, finishZone
  let doors = []
  let enemies = []
  let lives = 3
  let keysHeld = 0
  let collected = 0
  let totalCoins = 0
  let respawn = cellCenter(0, 0)
  let ended = false
  let survivalTimer = 0

  function reportState(extra) {
    onState({ lives, keysHeld, collected, totalCoins, time: Math.ceil(survivalTimer), survivalGoal: SURVIVAL_GOAL_SECONDS, ...extra })
  }

  function endGame(scene, status) {
    if (ended) return
    ended = true
    scene.physics.pause()
    if (player) player.setTint(status === 'win' ? 0x9be39b : 0xff8a8a)
    onEnd({ status, collected, totalCoins, keysHeld, time: Math.ceil(survivalTimer) })
  }

  function respawnPlayer(scene) {
    player.setVelocity(0, 0)
    player.setPosition(respawn.x, respawn.y)
    scene.cameras.main.flash(150, 255, 80, 80)
  }

  function hurtPlayer(scene) {
    if (ended) return
    lives -= 1
    reportState()
    if (lives <= 0) { endGame(scene, 'lose'); return }
    respawnPlayer(scene)
  }

  return {
    create() {
      buildTextures(this)
      this.physics.world.setBounds(0, 0, cols * CELL, (rows + 3) * CELL)
      this.cameras.main.setBackgroundColor('#15151c')

      solidGroup = this.physics.add.staticGroup()
      hazardsGroup = this.physics.add.staticGroup()
      coinsGroup = this.physics.add.staticGroup()
      keysGroup = this.physics.add.staticGroup()
      checkpointGroup = this.physics.add.staticGroup()
      doors = []
      enemies = []
      finishZone = null
      let startPos = null

      grid.forEach((row, r) => row.forEach((cellType, c) => {
        const { x, y } = cellCenter(r, c)
        if (cellType === 'start' && !startPos) startPos = { x, y }
        // Земля/платформа лишаються видимою підлогою навіть коли не тверді
        // (у режимі «Вигляд зверху» твердою є лише «Стіна») — інакше рівень
        // виглядав би порожнім попри розставлені тайли.
        if ((cellType === 'ground' || cellType === 'platform') && !solidSet.has(cellType)) {
          this.add.image(x, y, `t_${cellType}`).setDepth(-1)
        }
        if (cellType === 'door') {
          const d = solidGroup.create(x, y, 't_door')
          d.locked = true
          doors.push(d)
        } else if (solidSet.has(cellType)) {
          solidGroup.create(x, y, `t_${cellType}`)
        } else if (cellType === 'enemy') {
          const e = this.physics.add.sprite(x, y, 't_enemy')
          e.body.setAllowGravity(mode === 'platformer')
          e.body.setCollideWorldBounds(true)
          e.body.setSize(CELL * 0.6, CELL * 0.6)
          e.patrolAxis = mode === 'platformer' ? 'x' : (Math.random() < 0.5 ? 'x' : 'y')
          if (e.patrolAxis === 'x') e.setVelocityX(55); else e.setVelocityY(55)
          enemies.push(e)
        } else if (cellType === 'hazard') {
          hazardsGroup.create(x, y, 't_hazard')
        } else if (cellType === 'collectible') {
          coinsGroup.create(x, y, 't_coin'); totalCoins++
        } else if (cellType === 'key') {
          keysGroup.create(x, y, 't_key')
        } else if (cellType === 'checkpoint') {
          checkpointGroup.create(x, y, 't_checkpoint')
        } else if (cellType === 'finish') {
          finishZone = this.physics.add.staticImage(x, y, 't_finish')
        }
      }))

      if (!startPos) startPos = cellCenter(0, 0)
      respawn = startPos
      player = this.physics.add.sprite(startPos.x, startPos.y, 't_player')
      player.body.setSize(CELL * 0.6, CELL * 0.76)
      player.setCollideWorldBounds(true)
      player.body.setAllowGravity(mode === 'platformer')

      this.physics.add.collider(player, solidGroup)
      enemies.forEach((e) => this.physics.add.collider(e, solidGroup))
      this.physics.add.collider(player, enemies, () => hurtPlayer(this))
      this.physics.add.overlap(player, hazardsGroup, () => hurtPlayer(this))
      this.physics.add.overlap(player, coinsGroup, (p, coin) => { coin.destroy(); collected++; reportState() })
      this.physics.add.overlap(player, keysGroup, (p, key) => { key.destroy(); keysHeld++; reportState() })
      this.physics.add.overlap(player, checkpointGroup, (p, cp) => {
        respawn = { x: cp.x, y: cp.y }
        if (!cp.activated) { cp.activated = true; cp.setTint(0x9be3c8) }
      })
      doors.forEach((d) => {
        this.physics.add.overlap(player, d, () => {
          if (d.locked && keysHeld > 0) {
            d.locked = false
            keysHeld -= 1
            solidGroup.remove(d, false, false)
            d.setAlpha(0.25)
            d.body.enable = false
            reportState()
          }
        })
      })
      if (finishZone) {
        this.physics.add.overlap(player, finishZone, () => {
          if (ended) return
          if (goal === 'Зібрати всі предмети' && collected < totalCoins) {
            reportState({ hint: `Збери всі предмети (${collected}/${totalCoins}) перед фінішем` })
            return
          }
          endGame(this, 'win')
        })
      }

      this.cursors = this.input.keyboard.createCursorKeys()
      this.wasd = this.input.keyboard.addKeys('W,A,S,D,SPACE')
      reportState()
    },

    update(_time, deltaMs) {
      if (ended || !player?.body) return
      const left = this.cursors.left.isDown || this.wasd.A.isDown
      const right = this.cursors.right.isDown || this.wasd.D.isDown
      const up = this.cursors.up.isDown || this.wasd.W.isDown
      const down = this.cursors.down.isDown || this.wasd.S.isDown
      const jumpPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up)
        || Phaser.Input.Keyboard.JustDown(this.wasd.W)
        || Phaser.Input.Keyboard.JustDown(this.wasd.SPACE)

      if (mode === 'platformer') {
        const speed = 170
        if (left) { player.setVelocityX(-speed); player.setFlipX(true) }
        else if (right) { player.setVelocityX(speed); player.setFlipX(false) }
        else player.setVelocityX(0)
        if (jumpPressed && player.body.blocked.down) player.setVelocityY(-420)
      } else {
        const speed = 160
        let vx = 0, vy = 0
        if (left) vx = -speed
        if (right) vx = speed
        if (up) vy = -speed
        if (down) vy = speed
        if (vx !== 0 && vy !== 0) { vx *= 0.7071; vy *= 0.7071 }
        player.setVelocity(vx, vy)
        if (vx < 0) player.setFlipX(true); else if (vx > 0) player.setFlipX(false)
      }

      if (player.y > (rows + 1.5) * CELL) hurtPlayer(this)

      enemies.forEach((e) => {
        if (!e.body) return
        if (e.patrolAxis === 'x' && (e.body.blocked.left || e.body.blocked.right)) e.setVelocityX(-e.body.velocity.x)
        if (e.patrolAxis === 'y' && (e.body.blocked.up || e.body.blocked.down)) e.setVelocityY(-e.body.velocity.y)
      })

      if (goal === 'Вижити певний час' && !ended) {
        const before = Math.floor(survivalTimer)
        survivalTimer += deltaMs / 1000
        if (Math.floor(survivalTimer) !== before) reportState()
        if (survivalTimer >= SURVIVAL_GOAL_SECONDS) endGame(this, 'win')
      }
    },
  }
}

export default function GamePlayer({ grid, mode, goal }) {
  const containerRef = useRef(null)
  const gameRef = useRef(null)
  const [state, setState] = useState(null)
  const [result, setResult] = useState(null)
  const [running, setRunning] = useState(false)

  function stop() {
    if (gameRef.current) { gameRef.current.destroy(true); gameRef.current = null }
    setRunning(false)
  }

  function start() {
    stop()
    setResult(null)
    setState(null)
    const cols = grid[0]?.length || 0
    const rows = grid.length
    gameRef.current = new Phaser.Game({
      type: Phaser.AUTO,
      width: cols * CELL,
      height: rows * CELL,
      parent: containerRef.current,
      backgroundColor: '#15151c',
      physics: { default: 'arcade', arcade: { gravity: { y: mode === 'platformer' ? 900 : 0 }, debug: false } },
      scene: makeSceneConfig({ grid, mode, goal, onState: setState, onEnd: setResult }),
    })
    setRunning(true)
  }

  useEffect(() => () => { if (gameRef.current) gameRef.current.destroy(true) }, [])

  return (
    <div className="gds-play">
      {state && (
        <div className="gds-play-hud">
          <span>❤️ {state.lives}</span>
          <span>⭐ {state.collected}/{state.totalCoins}</span>
          <span>🔑 {state.keysHeld}</span>
          {goal === 'Вижити певний час' && <span>⏱ {state.time}/{state.survivalGoal}с</span>}
          {state.hint && <span className="gds-play-hint">{state.hint}</span>}
        </div>
      )}
      <div className="gds-play-canvas-wrap" ref={containerRef} />
      {!running && !result && (
        <p className="cl-tab-desc">
          Натисни «Грати», щоб пройти рівень. Керування: {mode === 'platformer'
            ? 'стрілки або A/D — рух, Пробіл чи ↑ — стрибок.'
            : 'стрілки або WASD — рух у 4 напрямки.'}
        </p>
      )}
      {result && (
        <div className={'gds-play-result' + (result.status === 'win' ? ' win' : ' lose')}>
          <p className="eyebrow">{result.status === 'win' ? '🏁 Рівень пройдено!' : '💀 Гру закінчено'}</p>
          <p className="cl-tab-desc">Предметів зібрано: {result.collected}/{result.totalCoins}. Ключів: {result.keysHeld}.</p>
          <button className="harmony-btn" onClick={start}>↻ Спробувати ще раз</button>
        </div>
      )}
      <div className="cl-picker-top" style={{ marginTop: 10 }}>
        <button className="complete-btn" onClick={start}>{running ? '↻ Перезапустити' : '▶ Грати'}</button>
        {running && <button className="cl-mini-btn" onClick={stop}>⏹ Стоп</button>}
      </div>
    </div>
  )
}
