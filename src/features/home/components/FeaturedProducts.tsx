import styled from 'styled-components'
import { ProductCard } from '@/features/catalog'
import { ErrorState } from '@/shared/components/ErrorState'
import { LoadingState } from '@/shared/components/LoadingState'
import { RefreshErrorNotice } from '@/shared/components/RefreshErrorNotice'
import { StateMessage } from '@/shared/components/StateMessage'
import { ButtonLink } from '@/shared/components/ui/Button'
import { ResponsiveGrid } from '@/shared/components/ui/ResponsiveGrid'
import { useFeaturedProducts } from '../hooks/useFeaturedProducts'
import { HomeSection } from './HomeSection'

const Actions = styled.div`
  display: flex;
  justify-content: center;
  margin-top: ${({ theme }) => theme.space.md};
`

function FeaturedProductsContent() {
  const { data: products, isError, isRefetchError, refetch } = useFeaturedProducts()

  if (!products) {
    if (isError) {
      return <ErrorState titleAs="h3" title="We couldn't load the featured products" onRetry={() => void refetch()} />
    }
    return <LoadingState label="Loading featured products" />
  }

  if (products.length === 0) {
    return (
      <StateMessage
        role="status"
        titleAs="h3"
        title="No featured products right now"
        description="Explore our categories to find something you like."
        actions={<ButtonLink to="/categories">Browse categories</ButtonLink>}
      />
    )
  }

  return (
    <>
      {isRefetchError && <RefreshErrorNotice />}
      <ResponsiveGrid $columns={{ base: 2, md: 3, lg: 4 }}>
        {products.map((product) => (
          <li key={product.id}>
            <ProductCard product={product} />
          </li>
        ))}
      </ResponsiveGrid>
      <Actions>
        <ButtonLink to="/categories" variant="secondary">
          View all categories
        </ButtonLink>
      </Actions>
    </>
  )
}

export function FeaturedProducts() {
  return (
    <HomeSection title="Featured products">
      <FeaturedProductsContent />
    </HomeSection>
  )
}
