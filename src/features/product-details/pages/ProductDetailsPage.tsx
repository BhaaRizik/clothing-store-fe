import { useParams } from 'react-router'
import { isNotFoundError } from '@/shared/api/apiError'
import { ErrorState } from '@/shared/components/ErrorState'
import { LoadingState } from '@/shared/components/LoadingState'
import { RefreshErrorNotice } from '@/shared/components/RefreshErrorNotice'
import { StateMessage } from '@/shared/components/StateMessage'
import { ButtonLink } from '@/shared/components/ui/Button'
import { ProductDetailsView } from '../components/ProductDetailsView'
import { useProductDetails } from '../hooks/useProductDetails'

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
      <ProductDetailsView key={product.id} product={product} />
    </>
  )
}
