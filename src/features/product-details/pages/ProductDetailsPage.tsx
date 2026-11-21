import { Link, useParams } from 'react-router'
import styled from 'styled-components'
import { isNotFoundError } from '@/shared/api/apiError'
import { ErrorState } from '@/shared/components/ErrorState'
import { LoadingState } from '@/shared/components/LoadingState'
import { Price } from '@/shared/components/Price'
import { RefreshErrorNotice } from '@/shared/components/RefreshErrorNotice'
import { StateMessage } from '@/shared/components/StateMessage'
import { ButtonLink } from '@/shared/components/ui/Button'
import { PageTitle } from '@/shared/components/ui/PageTitle'
import { media } from '@/shared/theme/theme'
import { ProductGallery } from '../components/ProductGallery'
import { useProductDetails } from '../hooks/useProductDetails'

const Layout = styled.article`
  display: grid;
  gap: ${({ theme }) => theme.space.xl};

  ${media.md} {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    align-items: start;
  }
`

const Info = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.md};
`

const BackLink = styled(Link)`
  align-self: flex-start;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`

const Brand = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: ${({ theme }) => theme.colors.textMuted};
`

const Description = styled.p`
  white-space: pre-line;
  max-width: 65ch;
`

export function ProductDetailsPage() {
  const { slug = '' } = useParams()
  const { data: product, error, isError, isRefetchError, refetch } = useProductDetails(slug)

  // Not-found / error only when nothing was loaded; a failed background refetch keeps the content.
  if (!product) {
    if (isNotFoundError(error)) {
      return (
        <>
          <title>Product not found | Clothing Store</title>
          <StateMessage
            titleAs="h1"
            title="Product not found"
            description="This product doesn't exist or is no longer available."
            actions={<ButtonLink to="/categories">Browse categories</ButtonLink>}
          />
        </>
      )
    }
    if (isError) {
      return (
        <ErrorState
          titleAs="h1"
          title="We couldn't load this product"
          onRetry={() => void refetch()}
          actions={
            <ButtonLink to="/categories" variant="secondary">
              Browse categories
            </ButtonLink>
          }
        />
      )
    }
    return <LoadingState label="Loading product" />
  }

  return (
    <>
      <title>{`${product.name} | Clothing Store`}</title>
      {isRefetchError && <RefreshErrorNotice />}
      <Layout>
        <ProductGallery key={product.id} images={product.images} productName={product.name} />
        <Info>
          <BackLink to={`/categories/${encodeURIComponent(product.category.slug)}`}>
            Back to {product.category.name}
          </BackLink>
          {product.brand && <Brand>{product.brand}</Brand>}
          <PageTitle>{product.name}</PageTitle>
          <Price price={product.price} salePrice={product.salePrice} size="lg" />
          {product.description?.trim() && <Description>{product.description}</Description>}
        </Info>
      </Layout>
    </>
  )
}
