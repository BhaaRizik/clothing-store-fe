import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { getProducts } from '@/features/catalog/api/productApi'
import { getCategories } from '@/features/categories/api/categoryApi'
import { countH1, deferred, ils, makeCategory, serverError } from '@/test/fixtures'
import { makeProduct, makeProducts, productPage } from '@/test/products'
import { renderRoute } from '@/test/renderRoute'
import { getPromotions } from '../api/promotionApi'
import type { PromotionResponse } from '../types/promotion'
import { HomePage } from './HomePage'

vi.mock('@/features/categories/api/categoryApi')
vi.mock('@/features/catalog/api/productApi')
vi.mock('../api/promotionApi')

function makePromotion(overrides: Partial<PromotionResponse> = {}): PromotionResponse {
  return {
    id: 'promo-1',
    title: 'New season',
    subtitle: 'Fresh styles for spring',
    imageUrl: 'https://cdn.example.com/new-season.jpg',
    imageAlt: 'Models wearing spring outfits',
    ctaLabel: 'Shop women',
    ctaUrl: '/categories/women',
    ...overrides,
  }
}

type MockOptions = {
  promotions?: PromotionResponse[] | Error
  categories?: ReturnType<typeof makeCategory>[] | Error
  products?: ReturnType<typeof makeProduct>[] | Error
}

function mockApis({
  promotions = [makePromotion()],
  categories = [makeCategory()],
  products = makeProducts(1, 2),
}: MockOptions = {}) {
  if (promotions instanceof Error) vi.mocked(getPromotions).mockRejectedValue(promotions)
  else vi.mocked(getPromotions).mockResolvedValue(promotions)
  if (categories instanceof Error) vi.mocked(getCategories).mockRejectedValue(categories)
  else vi.mocked(getCategories).mockResolvedValue(categories)
  if (products instanceof Error) vi.mocked(getProducts).mockRejectedValue(products)
  else vi.mocked(getProducts).mockResolvedValue(productPage(products, 0, products.length, 8))
}

const renderPage = () => renderRoute(<HomePage />)

const section = (name: string) => screen.getByRole('region', { name })

describe('HomePage', () => {
  it('renders the intro, promotions, categories and featured products in order', async () => {
    mockApis()
    renderPage()

    expect(screen.getByRole('heading', { level: 1, name: 'Welcome to Clothing Store' })).toBeInTheDocument()
    expect(screen.getByText('Discover clothing and accessories for every occasion.')).toBeInTheDocument()

    expect(await screen.findByRole('heading', { level: 3, name: 'New season' })).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: 'Women' })).toHaveAttribute('href', '/categories/women')
    expect(await screen.findByRole('link', { name: 'Product 1' })).toHaveAttribute('href', '/products/product-1')

    const headings = screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)
    expect(headings).toEqual(['Promotions', 'Shop by category', 'Featured products'])
    expect(countH1()).toBe(1)
  })

  it('uses h3 for items inside the h2 sections', async () => {
    mockApis()
    renderPage()

    const categories = await screen.findByRole('region', { name: 'Shop by category' })
    expect(await within(categories).findByRole('heading', { level: 3, name: 'Women' })).toBeInTheDocument()
    const products = section('Featured products')
    expect(await within(products).findByRole('heading', { level: 3, name: 'Product 1' })).toBeInTheDocument()
  })

  it('renders a promotion banner with image alt text, subtitle and an internal CTA link', async () => {
    mockApis()
    renderPage()

    const promotions = await screen.findByRole('region', { name: 'Promotions' })
    expect(within(promotions).getByRole('img', { name: 'Models wearing spring outfits' })).toHaveAttribute(
      'src',
      'https://cdn.example.com/new-season.jpg',
    )
    expect(within(promotions).getByText('Fresh styles for spring')).toBeInTheDocument()
    expect(within(promotions).getByRole('link', { name: 'Shop women' })).toHaveAttribute('href', '/categories/women')
  })

  it('renders several promotions as stacked banners in API order', async () => {
    mockApis({ promotions: [makePromotion(), makePromotion({ id: 'promo-2', title: 'Summer sale' })] })
    renderPage()

    const promotions = await screen.findByRole('region', { name: 'Promotions' })
    const titles = within(promotions).getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)
    expect(titles).toEqual(['New season', 'Summer sale'])
  })

  it.each<[string, Partial<PromotionResponse>]>([
    ['ctaUrl is null', { ctaUrl: null }],
    ['ctaLabel is null', { ctaLabel: null }],
    ['ctaLabel is blank', { ctaLabel: '   ' }],
    ['ctaUrl is absolute', { ctaUrl: 'https://x.example' }],
    ['ctaUrl is protocol-relative', { ctaUrl: '//x.example' }],
  ])('hides the CTA when %s', async (_, overrides) => {
    mockApis({ promotions: [makePromotion({ subtitle: null, ...overrides })] })
    renderPage()

    const promotions = await screen.findByRole('region', { name: 'Promotions' })
    expect(within(promotions).getByRole('heading', { level: 3, name: 'New season' })).toBeInTheDocument()
    expect(within(promotions).queryByRole('link')).not.toBeInTheDocument()
    expect(within(promotions).queryByText('Fresh styles for spring')).not.toBeInTheDocument()
  })

  it('opens the promotion CTA target', async () => {
    mockApis()
    const { user } = renderPage()

    await user.click(await screen.findByRole('link', { name: 'Shop women' }))
    expect(screen.getByTestId('location')).toHaveTextContent('/categories/women')
  })

  it('renders no promotions section when there are no active promotions', async () => {
    mockApis({ promotions: [] })
    renderPage()

    expect(await screen.findByRole('link', { name: 'Product 1' })).toBeInTheDocument()
    expect(getPromotions).toHaveBeenCalled()
    expect(screen.queryByRole('region', { name: 'Promotions' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Promotions' })).not.toBeInTheDocument()
  })

  it.each([['an HTML string', '<!doctype html><html></html>'], ['an object', { items: [] }]])(
    'renders no promotions section when the response body is %s',
    async (_label, body) => {
      mockApis({ promotions: [] })
      vi.mocked(getPromotions).mockResolvedValue(body as unknown as PromotionResponse[])
      renderPage()

      expect(await screen.findByRole('link', { name: 'Product 1' })).toBeInTheDocument()
      expect(await screen.findByRole('link', { name: 'Women' })).toBeInTheDocument()
      expect(screen.queryByRole('region', { name: 'Promotions' })).not.toBeInTheDocument()
    },
  )

  it('hides promotions silently when the request fails and still renders the other sections', async () => {
    mockApis({ promotions: serverError() })
    renderPage()

    expect(await screen.findByRole('link', { name: 'Women' })).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: 'Product 1' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Promotions' })).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('renders nothing for promotions while they load', async () => {
    const pending = deferred<PromotionResponse[]>()
    mockApis()
    vi.mocked(getPromotions).mockReturnValue(pending.promise)
    renderPage()

    expect(await screen.findByRole('link', { name: 'Product 1' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Promotions' })).not.toBeInTheDocument()

    pending.resolve([makePromotion()])
    expect(await screen.findByRole('region', { name: 'Promotions' })).toBeInTheDocument()
  })

  it('shows a section error with retry for categories while products still render', async () => {
    mockApis()
    vi.mocked(getCategories).mockRejectedValueOnce(serverError()).mockResolvedValueOnce([makeCategory()])
    const { user } = renderPage()

    const categories = section('Shop by category')
    const alert = await within(categories).findByRole('alert')
    expect(alert).toHaveTextContent("We couldn't load the categories")
    expect(await screen.findByRole('link', { name: 'Product 1' })).toBeInTheDocument()
    expect(within(section('Featured products')).queryByRole('alert')).not.toBeInTheDocument()

    await user.click(within(alert).getByRole('button', { name: 'Try again' }))

    expect(await screen.findByRole('link', { name: 'Women' })).toBeInTheDocument()
    expect(getCategories).toHaveBeenCalledTimes(2)
  })

  it('shows an empty state without a call to action when there are no categories', async () => {
    mockApis({ categories: [] })
    renderPage()

    const categories = section('Shop by category')
    expect(await within(categories).findByRole('heading', { name: 'No categories yet' })).toBeInTheDocument()
    expect(within(categories).queryByRole('link')).not.toBeInTheDocument()
  })

  it('shows loading states per section', () => {
    vi.mocked(getPromotions).mockReturnValue(deferred<PromotionResponse[]>().promise)
    vi.mocked(getCategories).mockReturnValue(deferred<never>().promise)
    vi.mocked(getProducts).mockReturnValue(deferred<never>().promise)
    renderPage()

    expect(within(section('Shop by category')).getByRole('status')).toHaveTextContent('Loading categories')
    expect(within(section('Featured products')).getByRole('status')).toHaveTextContent('Loading featured products')
  })

  it('requests up to 8 newest featured products and links to all categories', async () => {
    mockApis({ products: makeProducts(1, 8) })
    renderPage()

    const products = section('Featured products')
    expect(await within(products).findByRole('link', { name: 'Product 8' })).toBeInTheDocument()
    expect(within(products).getAllByRole('listitem')).toHaveLength(8)
    expect(getProducts).toHaveBeenCalledWith(expect.objectContaining({ featured: true, size: 8, sort: 'newest' }))
    expect(within(products).getByRole('link', { name: 'View all categories' })).toHaveAttribute('href', '/categories')
  })

  it('shows prices exactly as returned by the API', async () => {
    mockApis({ products: [makeProduct({ price: ils('149.90'), salePrice: ils('99.90') })] })
    renderPage()

    const products = section('Featured products')
    expect(await within(products).findByText(/99\.90/)).toBeInTheDocument()
    expect(within(products).getByText(/149\.90/)).toBeInTheDocument()
  })

  it('shows an empty state with a browse categories link when nothing is featured', async () => {
    mockApis({ products: [] })
    renderPage()

    const products = section('Featured products')
    expect(await within(products).findByRole('heading', { name: 'No featured products right now' })).toBeInTheDocument()
    expect(within(products).getByRole('link', { name: 'Browse categories' })).toHaveAttribute('href', '/categories')
    expect(within(products).queryByRole('link', { name: 'View all categories' })).not.toBeInTheDocument()
  })

  it('shows a section error with retry for featured products while categories still render', async () => {
    mockApis()
    vi.mocked(getProducts).mockRejectedValueOnce(serverError()).mockResolvedValueOnce(productPage(makeProducts(1, 1), 0, 1, 8))
    const { user } = renderPage()

    const products = section('Featured products')
    const alert = await within(products).findByRole('alert')
    expect(alert).toHaveTextContent("We couldn't load the featured products")
    expect(await screen.findByRole('link', { name: 'Women' })).toBeInTheDocument()

    await user.click(within(alert).getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('link', { name: 'Product 1' })).toBeInTheDocument()
  })

  it('keeps a single h1 when every section fails', async () => {
    mockApis({ promotions: serverError(), categories: serverError(), products: serverError() })
    renderPage()

    await waitFor(() => expect(screen.getAllByRole('alert')).toHaveLength(2))
    expect(countH1()).toBe(1)
    expect(screen.getByRole('heading', { level: 1, name: 'Welcome to Clothing Store' })).toBeInTheDocument()
  })
})
