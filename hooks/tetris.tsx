import type { ClientModule } from 'claude-code'

type Piece = { kind: number; rot: number; x: number; y: number }
type Game = {
  board: number[][]
  piece: Piece
  next: number
  score: number
  lines: number
  over: boolean
  paused: boolean
  // The board has proven it holds the keyboard (a click or a key reached it).
  // Starts false, so a fresh pane is held until the person focuses it.
  active: boolean
  // The last `blurs` count seen in the props: a higher one means the person
  // typed in the prompt, so the keyboard left the board.
  seenBlurs: number
  // Ticks without input, and ticks since the last drop: both mutated in place,
  // never redrawn on their own.
  idle: number
  t: number
}

const W = 10
const H = 20
const TICK_MS = 100
// The surface never says when the keyboard leaves the board (another window,
// a click in the chat): no key for this long counts as having lost it.
const IDLE_TICKS = 80

// Cells (x, y) of each piece in its own box; SIZES holds the box side.
const SHAPES: [number, number][][] = [
  [[0, 1], [1, 1], [2, 1], [3, 1]], // I
  [[0, 0], [1, 0], [0, 1], [1, 1]], // O
  [[1, 0], [0, 1], [1, 1], [2, 1]], // T
  [[1, 0], [2, 0], [0, 1], [1, 1]], // S
  [[0, 0], [1, 0], [1, 1], [2, 1]], // Z
  [[0, 0], [0, 1], [1, 1], [2, 1]], // J
  [[2, 0], [0, 1], [1, 1], [2, 1]], // L
]
const SIZES = [4, 2, 3, 3, 3, 3, 3]
const COLORS = ['cyan', 'yellow', 'magenta', 'green', 'red', 'blue', 'white']
const LINE_SCORES = [0, 100, 300, 500, 800]

const randomKind = () => Math.floor(Math.random() * SHAPES.length)

const cellsOf = (p: Piece): [number, number][] =>
  SHAPES[p.kind].map(([cx, cy]) => {
    let x = cx
    let y = cy
    for (let i = 0; i < p.rot; i++) {
      const n = SIZES[p.kind]
      ;[x, y] = [n - 1 - y, x]
    }

    return [x + p.x, y + p.y]
  })

const fits = (board: number[][], p: Piece) =>
  cellsOf(p).every(
    ([x, y]) => x >= 0 && x < W && y >= 0 && y < H && board[y][x] === 0,
  )

const level = (g: Game) => Math.floor(g.lines / 10)

const spawn = (g: Game, board: number[][]): Game => {
  const piece: Piece = { kind: g.next, rot: 0, x: 3, y: 0 }

  return { ...g, board, piece, next: randomKind(), over: !fits(board, piece), t: 0 }
}

const newGame = (): Game =>
  spawn(
    {
      board: [],
      piece: { kind: 0, rot: 0, x: 3, y: 0 },
      next: randomKind(),
      score: 0,
      lines: 0,
      over: false,
      paused: false,
      active: false,
      seenBlurs: 0,
      idle: 0,
      t: 0,
    },
    Array.from({ length: H }, () => Array<number>(W).fill(0)),
  )

const lock = (g: Game): Game => {
  const board = g.board.map(row => row.slice())
  for (const [x, y] of cellsOf(g.piece)) board[y][x] = g.piece.kind + 1

  const kept = board.filter(row => row.some(c => c === 0))
  const cleared = H - kept.length
  const emptyRows = Array.from({ length: cleared }, () => Array<number>(W).fill(0))
  const scored = {
    ...g,
    lines: g.lines + cleared,
    score: g.score + LINE_SCORES[cleared] * (level(g) + 1),
  }

  return spawn(scored, [...emptyRows, ...kept])
}

const move = (g: Game, dx: number, dy: number, drot = 0): Game | null => {
  const rot = (g.piece.rot + drot + 4) % 4
  // wall kicks for rotations: try the spot, then one and two cells to each side
  const kicks = drot === 0 ? [0] : [0, -1, 1, -2, 2]
  for (const k of kicks) {
    const piece = { ...g.piece, rot, x: g.piece.x + dx + k, y: g.piece.y + dy }
    if (fits(g.board, piece)) return { ...g, piece }
  }

  return null
}

const drop = (g: Game): Game => {
  const down = move(g, 0, 1)

  return down ? { ...down, t: 0 } : lock(g)
}

const hardDrop = (g: Game): Game => {
  let cur = g
  for (let next = move(cur, 0, 1); next; next = move(cur, 0, 1)) cur = next

  return lock(cur)
}

const Tetris: ClientModule<{ isFocused: boolean; blurs: number }, Game> = (props, surface) => {
  const { Box, Text } = surface.elements

  if (surface.state === undefined) {
    surface.setState({ ...newGame(), seenBlurs: props?.blurs ?? 0 })

    surface.every(TICK_MS, () => {
      const g = surface.state
      if (!g || !g.active) return

      g.idle += 1
      if (g.idle >= IDLE_TICKS) return surface.setState({ ...g, active: false })
      if (g.over || g.paused) return

      g.t += 1
      const period = Math.max(2, 10 - level(g))
      if (g.t >= period) surface.setState(drop(g))
    })

    // A click on the board is what gives it the keyboard; the pointer leaving
    // it (towards the chat, say) is the nearest sign that the keyboard left.
    surface.onPointer(e => {
      const g = surface.state
      if (!g) return
      if (e.type === 'down') surface.setState({ ...g, active: true, idle: 0 })
      else if (e.type === 'leave' && g.active) surface.setState({ ...g, active: false })
    })

    // A key reaching the board proves it holds the keyboard.
    surface.onKey(({ key }) => {
      const g0 = surface.state
      if (!g0) return
      const g = { ...g0, active: true, idle: 0 }
      if (key === 'r') return surface.setState({ ...newGame(), active: true, seenBlurs: g.seenBlurs })
      if (key === 'p') return surface.setState({ ...g, paused: !g.paused })
      if (g.over || g.paused) return surface.setState(g)

      let next: Game | null = null
      if (key === 'left' || key === 'a') next = move(g, -1, 0)
      else if (key === 'right' || key === 'd') next = move(g, 1, 0)
      else if (key === 'down' || key === 's') next = drop(g)
      else if (key === 'up' || key === 'w' || key === 'x') next = move(g, 0, 0, 1)
      else if (key === 'z') next = move(g, 0, 0, -1)
      else if (key === ' ') next = hardDrop(g)
      surface.setState(next ?? g)
    })

    return <Text dimColor>Cargando…</Text>
  }

  const g = surface.state
  // The pane holding the keyboard (a click in the aside outside the board)
  // means the board does not; typing in the prompt means it left too.
  if (props && (props.isFocused || props.blurs !== g.seenBlurs)) {
    g.seenBlurs = props.blurs
    g.active = false
  }
  const shown = g.board.map(row => row.slice())
  if (!g.over) {
    for (const [x, y] of cellsOf(g.piece)) shown[y][x] = g.piece.kind + 1
  }

  const nextCells = SHAPES[g.next]

  return (
    <Box flexDirection="row" gap={1}>
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor={g.over ? 'red' : g.active ? undefined : 'yellow'}
      >
        {shown.map(row => (
          <Box flexDirection="row">
            {row.map(c =>
              c === 0 ? (
                <Text dimColor>· </Text>
              ) : (
                <Text backgroundColor={COLORS[c - 1]}>{'  '}</Text>
              ),
            )}
          </Box>
        ))}
      </Box>
      <Box flexDirection="column" width={16} flexShrink={0}>
        <Text bold>TETRIS</Text>
        <Text>Puntos {g.score}</Text>
        <Text>Líneas {g.lines}</Text>
        <Text>Nivel {level(g) + 1}</Text>
        <Text> </Text>
        <Text dimColor>Siguiente</Text>
        {[0, 1].map(y => (
          <Box flexDirection="row">
            {[0, 1, 2, 3].map(x =>
              nextCells.some(([cx, cy]) => cx === x && cy === y) ? (
                <Text backgroundColor={COLORS[g.next]}>{'  '}</Text>
              ) : (
                <Text>{'  '}</Text>
              ),
            )}
          </Box>
        ))}
        <Text> </Text>
        {g.over && <Text color="red" bold>GAME OVER</Text>}
        {g.paused && g.active && <Text color="yellow" bold>PAUSA</Text>}
        {!g.active && !g.over && <Text color="yellow" bold>SIN FOCO</Text>}
        {!g.active && !g.over && <Text dimColor>haz clic en el tablero</Text>}
        <Text> </Text>
        <Text dimColor>←→ mover</Text>
        <Text dimColor>↑ girar</Text>
        <Text dimColor>↓ bajar</Text>
        <Text dimColor>esp caída</Text>
        <Text dimColor>p pausa</Text>
        <Text dimColor>r reiniciar</Text>
        <Text dimColor>esc salir</Text>

      </Box>
    </Box>
  )
}

export default Tetris
