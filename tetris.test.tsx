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

const mount = async ($: any, on: any, isFocused = false) => {
  on('command.register', () => ({ value: { command: 'tetris' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('session.start', (_: unknown, e: { cwd: string }) => ({ cwd: e.cwd }))

  return $.ui.mount({ ...PANE, props: { ...PANE.props, isFocused }, surface: 'terminal' })
}

const shown = async (ui: any): Promise<string[]> =>
  (await ui.findAll({ type: 'Text', in: 'game' })).map((t: any) => t.text)

test('opens held: SIN FOCO, and gravity does not run', async ($, on) => {
  const ui = await mount($, on)
  const before = (await shown(ui)).join('|')

  await ui.advance(5000)
  const after = await shown(ui)

  expect(after).toContain('SIN FOCO')
  expect(after.join('|')).toBe(before)
  await ui.unmount()
})

test('a click gives it the focus and the game runs', async ($, on) => {
  const ui = await mount($, on)

  await ui.pointer({ type: 'down', x: 3, y: 3, button: 'left', in: 'game' })
  const before = (await shown(ui)).join('|')
  expect(await shown(ui)).not.toContain('SIN FOCO')

  await ui.advance(1000)
  expect((await shown(ui)).join('|')).not.toBe(before)
  await ui.unmount()
})

test('a key alone also gives it the focus, and the keys play', async ($, on) => {
  const ui = await mount($, on)

  await ui.key({ key: 'left', in: 'game' })
  expect(await shown(ui)).not.toContain('SIN FOCO')
  await ui.key({ key: 'up', in: 'game' })
  await ui.key({ key: ' ', in: 'game' })

  await ui.key({ key: 'p', in: 'game' })
  expect(await shown(ui)).toContain('PAUSA')
  await ui.key({ key: 'p', in: 'game' })
  expect(await shown(ui)).not.toContain('PAUSA')

  for (let i = 0; i < 40; i++) await ui.key({ key: ' ', in: 'game' })
  expect(await shown(ui)).toContain('GAME OVER')
  await ui.key({ key: 'r', in: 'game' })
  expect(await shown(ui)).not.toContain('GAME OVER')
  await ui.unmount()
})

test('the pointer leaving the board pauses it; a key brings it back', async ($, on) => {
  const ui = await mount($, on)

  await ui.pointer({ type: 'down', x: 2, y: 2, button: 'left', in: 'game' })
  expect(await shown(ui)).not.toContain('SIN FOCO')

  await ui.pointer({ type: 'leave', x: 2, y: 2, in: 'game' })
  expect(await shown(ui)).toContain('SIN FOCO')

  await ui.key({ key: 'left', in: 'game' })
  expect(await shown(ui)).not.toContain('SIN FOCO')
  await ui.unmount()
})

test('no input for 8 s counts as lost focus; a key brings it back', async ($, on) => {
  const ui = await mount($, on)

  await ui.key({ key: 'left', in: 'game' })
  await ui.advance(7000)
  expect(await shown(ui)).not.toContain('SIN FOCO')

  await ui.advance(2000)
  expect(await shown(ui)).toContain('SIN FOCO')

  await ui.key({ key: 'right', in: 'game' })
  expect(await shown(ui)).not.toContain('SIN FOCO')
  await ui.unmount()
})

test('the pane holding the keyboard means the board does not: held', async ($, on) => {
  const ui = await mount($, on, true)

  await ui.key({ key: 'left', in: 'game' })
  expect(await shown(ui)).toContain('SIN FOCO')
  await ui.unmount()
})

test('typing in the prompt takes the focus away from the board', async ($, on) => {
  // Nothing beneath the plugin answers it: this stands for the engine.
  on('prompt.change', (_: unknown, e: { text: string }) => ({ text: e.text }))
  const ui = await mount($, on)

  await ui.key({ key: 'left', in: 'game' })
  expect(await shown(ui)).not.toContain('SIN FOCO')

  await $.prompt.change({ text: 'hola', cursor: 4, origin: { kind: 'history' } })
  expect(await shown(ui)).toContain('SIN FOCO')

  await ui.pointer({ type: 'down', x: 1, y: 1, button: 'left', in: 'game' })
  expect(await shown(ui)).not.toContain('SIN FOCO')
  await ui.unmount()
})
