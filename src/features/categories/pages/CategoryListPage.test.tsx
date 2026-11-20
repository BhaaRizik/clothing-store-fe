import { act, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { countH1, makeCategory, serverError } from '@/test/fixtures'
import { renderRoute } from '@/test/renderRoute'
import { getCategories } from '../api/categoryApi'
import { CategoryListPage } from './CategoryListPage'

vi.mock('../api/categoryApi')

const renderPage = () => renderRoute(<CategoryListPage />, { path: '/categories' })

describe('CategoryListPage', () => {
  it('lists categories as links to their product listing', async () => {
    vi.mocked(getCategories).mockResolvedValue([
      makeCategory(),
      makeCategory({ id: 'cat-2', slug: 'men', name: 'Men', description: null, imageUrl: null }),
    ])
    const { user } = renderPage()

    expect(screen.getByRole('status')).toHaveTextContent('Loading categories')

    const list = await screen.findByRole('list')
    expect(within(list).getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByRole('link', { name: 'Women' })).toHaveAttribute('href', '/categories/women')
    expect(screen.getByText('Dresses, tops and more')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'No image available for Men' })).toBeInTheDocument()
    expect(countH1()).toBe(1)

    await user.click(screen.getByRole('link', { name: 'Men' }))
    expect(screen.getByTestId('location')).toHaveTextContent('/categories/men')
  })

  it('shows an empty state with a next action when there are no categories', async () => {
    vi.mocked(getCategories).mockResolvedValue([])
    renderPage()

    expect(await screen.findByRole('heading', { name: 'No categories yet' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to home' })).toHaveAttribute('href', '/')
    expect(countH1()).toBe(1)
  })

  it('shows an error with retry and recovers', async () => {
    vi.mocked(getCategories).mockRejectedValueOnce(serverError()).mockResolvedValueOnce([makeCategory()])
    const { user } = renderPage()

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent("We couldn't load the categories")
    expect(countH1()).toBe(1)

    await user.click(within(alert).getByRole('button', { name: 'Try again' }))

    expect(await screen.findByRole('link', { name: 'Women' })).toBeInTheDocument()
    expect(getCategories).toHaveBeenCalledTimes(2)
  })

  it('keeps the loaded categories when a background refetch fails', async () => {
    vi.mocked(getCategories).mockResolvedValueOnce([makeCategory()]).mockRejectedValueOnce(serverError())
    const { queryClient } = renderPage()
    expect(await screen.findByRole('link', { name: 'Women' })).toBeInTheDocument()

    await act(() => queryClient.refetchQueries())

    expect(await screen.findByRole('status')).toHaveTextContent("We couldn't refresh this page")
    expect(getCategories).toHaveBeenCalledTimes(2)
    expect(screen.getByRole('link', { name: 'Women' })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
