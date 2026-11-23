import { describe, expect, it } from 'vitest'
import { isInternalPath } from './isInternalPath'

describe('isInternalPath', () => {
  it.each(['/', '/categories/women', '/products/linen-shirt?x=1'])('accepts %s', (url) => {
    expect(isInternalPath(url)).toBe(true)
  })

  it.each([null, undefined, '', 'categories', 'https://x.example', '//x.example', '/\\x.example', 'javascript:alert(1)', '/\t/x.example', '/\n/x.example', '/a b'])(
    'rejects %s',
    (url) => {
      expect(isInternalPath(url)).toBe(false)
    },
  )
})
