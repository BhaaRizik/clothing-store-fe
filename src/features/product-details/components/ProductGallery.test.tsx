import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { ThemeProvider } from 'styled-components'
import { describe, expect, it } from 'vitest'
import { theme } from '@/shared/theme/theme'
import type { ImageRef } from '@/shared/types/image'
import { ProductGallery } from './ProductGallery'

const withTheme = (ui: ReactElement) => <ThemeProvider theme={theme}>{ui}</ThemeProvider>
const image = (alt: string | null, name = alt ?? 'x'): ImageRef => ({ url: `https://cdn.example.com/${name}.jpg`, alt })
const mainImage = () => screen.getAllByRole('img')[0]

describe('ProductGallery', () => {
  it("names thumbnails with the image's alt text, falling back to the position when alt is empty", () => {
    render(withTheme(<ProductGallery images={[image('White shirt, front'), image('  ', 'blank'), image(null, 'none')]} productName="Shirt" />))

    expect(screen.getByRole('button', { name: 'Show image 1 of 3: White shirt, front' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Show image 2 of 3' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Show image 3 of 3' })).toBeInTheDocument()
  })

  it('keeps the main image and the pressed thumbnail in agreement when the list shrinks', async () => {
    const user = userEvent.setup()
    const { rerender } = render(withTheme(<ProductGallery images={[image('A'), image('B'), image('C')]} productName="Shirt" />))
    await user.click(screen.getByRole('button', { name: 'Show image 3 of 3: C' }))
    expect(mainImage()).toHaveAccessibleName('C')

    rerender(withTheme(<ProductGallery images={[image('A'), image('B')]} productName="Shirt" />))

    expect(mainImage()).toHaveAccessibleName('A')
    expect(screen.getByRole('button', { name: 'Show image 1 of 2: A' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Show image 2 of 2: B' })).toHaveAttribute('aria-pressed', 'false')
  })
})
