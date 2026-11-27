import { useEffect, useId, useRef } from 'react'
import { Link, useParams } from 'react-router'
import styled from 'styled-components'
import { useCategory } from '@/features/categories'
import { isNotFoundError } from '@/shared/api/apiError'
import { describeError } from '@/shared/api/errorCopy'
import { ErrorState } from '@/shared/components/ErrorState'
import { LoadingState } from '@/shared/components/LoadingState'
import { RefreshErrorNotice } from '@/shared/components/RefreshErrorNotice'
import { StateMessage } from '@/shared/components/StateMessage'
import { Button, ButtonLink } from '@/shared/components/ui/Button'
import { PageTitle } from '@/shared/components/ui/PageTitle'
import { ResponsiveGrid } from '@/shared/components/ui/ResponsiveGrid'
import { VisuallyHidden } from '@/shared/components/ui/VisuallyHidden'
import { ProductCard } from '../components/ProductCard'
import { useCategoryProducts } from '../hooks/useCategoryProducts'

const Header = styled.header`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.xs};
  margin-bottom: ${({ theme }) => theme.space.xl};
`

const BackLink = styled(Link)`
  align-self: flex-start;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`

const Description = styled.p`
  max-width: 60ch;
  color: ${({ theme }) => theme.colors.textMuted};
`

const ResultCount = styled.p`
  margin-bottom: ${({ theme }) => theme.space.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`

const LoadMoreArea = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.space.md};
  margin-top: ${({ theme }) => theme.space.xl};
`

type CategoryNotFoundProps = {
  /** 'h1' when it replaces the whole page; 'h2' when shown below the category header. */
  titleAs: 'h1' | 'h2'
}

function CategoryNotFound({ titleAs }: CategoryNotFoundProps) {
  return (
    <>
      <title>Category not found | Clothing Store</title>
      <StateMessage
        titleAs={titleAs}
        title="Category not found"
        description="This category doesn't exist or is no longer available."
        actions={<ButtonLink to="/categories">Browse all categories</ButtonLink>}
      />
    </>
  )
}

type ProductsSectionProps = {
  categorySlug: string
}

function ProductsSection({ categorySlug }: ProductsSectionProps) {
  const products = useCategoryProducts(categorySlug)
  const headingId = useId()
  const gridRef = useRef<HTMLUListElement>(null)
  /** Index of the first card requested by "Load more"; focused once it renders. */
  const pendingFocusIndex = useRef<number | null>(null)
  const itemCount = products.data?.items.length ?? 0

  useEffect(() => {
    const index = pendingFocusIndex.current
    if (index === null || itemCount <= index) return
    pendingFocusIndex.current = null
    gridRef.current?.children[index]?.querySelector<HTMLAnchorElement>('a')?.focus()
  }, [itemCount])

  if (!products.data) {
    // The category can disappear between the two requests; the page header already has the h1.
    if (isNotFoundError(products.error)) return <CategoryNotFound titleAs="h2" />
    if (products.isError) {
      return (
        <ErrorState
          title="We couldn't load the products"
          error={products.error}
          onRetry={() => void products.refetch()}
        />
      )
    }
    return <LoadingState label="Loading products" />
  }

  const { items, totalItems } = products.data

  if (items.length === 0) {
    return (
      <StateMessage
        role="status"
        title="No products in this category yet"
        description="New items are added regularly. In the meantime, explore our other categories."
        actions={<ButtonLink to="/categories">Browse other categories</ButtonLink>}
      />
    )
  }

  const loadMore = () => {
    // aria-disabled keeps the button focusable while loading, so guard double activation here.
    if (products.isFetchingNextPage) return
    pendingFocusIndex.current = items.length
    void products.fetchNextPage()
  }

  return (
    <section aria-labelledby={headingId}>
      <VisuallyHidden as="h2" id={headingId}>
        Products
      </VisuallyHidden>
      {products.isRefetchError && <RefreshErrorNotice />}
      <ResultCount aria-live="polite">
        Showing {items.length} of {totalItems} {totalItems === 1 ? 'product' : 'products'}
      </ResultCount>
      <ResponsiveGrid ref={gridRef} $columns={{ base: 2, md: 3, lg: 4 }}>
        {items.map((product) => (
          <li key={product.id}>
            <ProductCard product={product} />
          </li>
        ))}
      </ResponsiveGrid>
      <LoadMoreArea>
        {products.isFetchNextPageError && (
          <p role="alert">We couldn't load more products. {describeError(products.error).description}</p>
        )}
        {products.hasNextPage && (
          <Button variant="secondary" onClick={loadMore} aria-disabled={products.isFetchingNextPage}>
            {products.isFetchingNextPage ? 'Loading…' : 'Load more'}
          </Button>
        )}
      </LoadMoreArea>
    </section>
  )
}

export function CategoryProductsPage() {
  const { slug = '' } = useParams()
  const category = useCategory(slug)

  // Not-found / error only when nothing was loaded; a failed background refetch keeps the content.
  if (!category.data) {
    if (isNotFoundError(category.error)) return <CategoryNotFound titleAs="h1" />
    if (category.isError) {
      return (
        <ErrorState
          titleAs="h1"
          title="We couldn't load this category"
          error={category.error}
          onRetry={() => void category.refetch()}
        />
      )
    }
    return <LoadingState label="Loading category" />
  }

  return (
    <>
      <title>{`${category.data.name} | Clothing Store`}</title>
      <Header>
        <BackLink to="/categories">All categories</BackLink>
        <PageTitle>{category.data.name}</PageTitle>
        {category.data.description && <Description>{category.data.description}</Description>}
      </Header>
      {category.isRefetchError && <RefreshErrorNotice />}
      <ProductsSection categorySlug={category.data.slug} />
    </>
  )
}
