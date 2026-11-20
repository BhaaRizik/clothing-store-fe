import { describe, expect, it } from 'vitest'
import { resolveAssetUrl } from './assetUrl'

describe('resolveAssetUrl', () => {
  it('prefixes root-relative paths with the API origin', () => {
    expect(resolveAssetUrl('/images/catalog/shirt.svg', 'http://localhost:8080')).toBe(
      'http://localhost:8080/images/catalog/shirt.svg',
    )
  })

  it('does not double the slash when the origin ends with one', () => {
    expect(resolveAssetUrl('/images/a.svg', 'https://api.example.com/')).toBe('https://api.example.com/images/a.svg')
  })

  it('leaves absolute and protocol-relative URLs unchanged', () => {
    expect(resolveAssetUrl('https://cdn.example.com/a.jpg', 'http://localhost:8080')).toBe('https://cdn.example.com/a.jpg')
    expect(resolveAssetUrl('//cdn.example.com/a.jpg', 'http://localhost:8080')).toBe('//cdn.example.com/a.jpg')
  })

  it('returns null for missing or blank URLs', () => {
    expect(resolveAssetUrl(null)).toBeNull()
    expect(resolveAssetUrl(undefined)).toBeNull()
    expect(resolveAssetUrl('   ')).toBeNull()
  })
})
