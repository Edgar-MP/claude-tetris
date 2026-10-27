import type { Register } from 'claude-code'

const PANE = 'tetris'
const OPEN = {
  id: PANE,
  title: 'Tetris',
  focus: true,
  closeOnEscape: true,
  rows: 26,
  columns: 44,
} as const

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'tetris',
      description: 'Juega al Tetris en un panel mientras esperas',
    })

    return next(e)
  })

  on('command.run', { command: 'tetris' }, async $ => {
    await $.ui.open(OPEN)

    return { text: 'Tetris abierto. Si las teclas no responden, haz clic en el tablero.' }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e, next) => {
    const { Client } = $.ui.resolve(e)
    if (!Client) return next(e)

    return (
      <Client key="game" module="./tetris.tsx" props={{ isFocused: e.props.isFocused }} />
    )
  })
}
