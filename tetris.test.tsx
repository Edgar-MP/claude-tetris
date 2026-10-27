import { expect, test } from 'claude-code/testing'

const PANE = {
  plugin: 'tetris',
  component: 'Pane',
  requestId: 'tetris',
  props: {
    title: 'Tetris',
    isFocused: true,
    bodyColumns: 44,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 24 },
    view: {},
  },
} as const

const mount = async ($: any, on: any, isFocused = true) => {
  on('command.register', () => ({ value: { command: 'tetris' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('session.start', (_: unknown, e: { cwd: string }) => ({ cwd: e.cwd }))

  return $.ui.mount({ ...PANE, props: { ...PANE.props, isFocused }, surface: 'terminal' })
}

const shown = async (ui: any) =>
  (await ui.findAll({ type: 'Text', in: 'game' })).map((t: any) => t.text)

test('draws a 10x20 board and the side panel', async ($, on) => {
  const ui = await mount($, on)
  const texts: string[] = await shown(ui)

  // 200 board cells + the 8 cells of the next-piece preview
  expect(texts.filter(t => t === '· ' || t === '  ').length).toBeGreaterThanOrEqual(200)
  expect(texts).toContain('TETRIS')
  expect(texts).toContain('Puntos 0')
  await ui.unmount()
})

test('keys play and pause, gravity runs and restart works', async ($, on) => {
  const ui = await mount($, on)

  await ui.key({ key: 'left', in: 'game' })
  await ui.key({ key: 'up', in: 'game' })
  await ui.key({ key: ' ', in: 'game' })
  await ui.advance(5000)
  expect(await shown(ui)).not.toContain('GAME OVER')

  await ui.key({ key: 'p', in: 'game' })
  expect(await shown(ui)).toContain('PAUSA')
  await ui.key({ key: 'p', in: 'game' })
  expect(await shown(ui)).not.toContain('PAUSA')

  // dropping every piece straight down fills the middle column: game over
  for (let i = 0; i < 40; i++) await ui.key({ key: ' ', in: 'game' })
  expect(await shown(ui)).toContain('GAME OVER')

  await ui.key({ key: 'r', in: 'game' })
  expect(await shown(ui)).not.toContain('GAME OVER')
  await ui.unmount()
})

test('without focus the game says so and gravity stops', async ($, on) => {
  const ui = await mount($, on, false)
  const before = (await shown(ui)).join('|')

  await ui.advance(5000)
  const after = await shown(ui)

  expect(after).toContain('SIN FOCO')
  expect(after.join('|').replace('SIN FOCO|haz clic o Tab|', '')).toBe(before.replace('SIN FOCO|haz clic o Tab|', ''))
  await ui.unmount()
})
