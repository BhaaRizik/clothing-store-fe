import { describe, expect, it } from 'vitest'
import type { ProductImage } from '../types/productDetails'
import { imagesForColor } from './imagesForColor'

const image = (name: string, color: string | null): ProductImage => ({ url: `https://cdn.example.com/${name}.jpg`, alt: name, color })

const images = [
  image('white-front', 'White'),
  image('detail', null),
  image('blue-front', 'Light blue'),
  image('white-back', 'White'),
  image('label', null),
]

const alts = (list: ProductImage[]) => list.map((i) => i.alt)

describe('imagesForColor', () => {
  it('returns all images in order when no color is selected', () => {
    expect(imagesForColor(images, null)).toBe(images)
  })

  it('returns images tagged with the color, then untagged images, keeping API order', () => {
    expect(alts(imagesForColor(images, 'White'))).toEqual(['white-front', 'white-back', 'detail', 'label'])
    expect(alts(imagesForColor(images, 'Light blue'))).toEqual(['blue-front', 'detail', 'label'])
  })

  it('falls back to the full gallery when the color has no tagged images', () => {
    expect(imagesForColor(images, 'Navy')).toBe(images)
  })

  it('matches the color name exactly', () => {
    expect(imagesForColor(images, 'white')).toBe(images)
  })

  it('returns only the tagged images when there are no untagged ones', () => {
    const tagged = [image('a', 'Red'), image('b', 'Navy')]
    expect(alts(imagesForColor(tagged, 'Navy'))).toEqual(['b'])
  })

  it('returns an empty list for a product without images', () => {
    expect(imagesForColor([], 'Navy')).toEqual([])
  })
})
