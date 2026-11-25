import { describe, expect, it } from 'vitest'
import { safeHex } from './safeHex'

describe('safeHex', () => {
  it.each(['#fff', '#FFFA', '#1f2a44', '#1f2a44cc'])('accepts the hex color %s', (hex) => {
    expect(safeHex(hex)).toBe(hex)
  })

  it.each([
    ['null', null],
    ['empty', ''],
    ['a color name', 'red'],
    ['injected CSS', 'red;background:url(x)'],
    ['hex followed by CSS', '#fff;background:url(x)'],
    ['a 5-digit hex', '#12345'],
  ])('rejects %s', (_label, value) => {
    expect(safeHex(value)).toBeNull()
  })
})
