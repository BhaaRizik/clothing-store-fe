import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { makeCategory } from '@/test/fixtures'
import { renderRoute } from '@/test/renderRoute'
import { CategoryCard } from './CategoryCard'

describe('CategoryCard', () => {
  it('is reachable with Tab and opens the category listing with Enter', async () => {
    const { user } = renderRoute(<CategoryCard category={makeCategory()} />)

    const link = screen.getByRole('link', { name: 'Women' })
    expect(link).toHaveAttribute('href', '/categories/women')

    await user.tab()
    expect(link).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(screen.getByTestId('location')).toHaveTextContent('/categories/women')
  })

  it('shows the category image with the category name as alt text', () => {
    renderRoute(<CategoryCard category={makeCategory()} />)
    expect(screen.getByRole('img', { name: 'Women' })).toHaveAttribute('src', 'https://cdn.example.com/women.jpg')
  })
})
