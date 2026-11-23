import { CategoryCard, useCategories } from '@/features/categories'
import { ErrorState } from '@/shared/components/ErrorState'
import { LoadingState } from '@/shared/components/LoadingState'
import { RefreshErrorNotice } from '@/shared/components/RefreshErrorNotice'
import { StateMessage } from '@/shared/components/StateMessage'
import { ResponsiveGrid } from '@/shared/components/ui/ResponsiveGrid'
import { HomeSection } from './HomeSection'

function CategoryHighlightsContent() {
  const { data: categories, isError, isRefetchError, refetch } = useCategories()

  // Error state only when nothing was loaded; a failed background refetch keeps the content.
  if (!categories) {
    if (isError) {
      return <ErrorState titleAs="h3" title="We couldn't load the categories" onRetry={() => void refetch()} />
    }
    return <LoadingState label="Loading categories" />
  }

  if (categories.length === 0) {
    return (
      <StateMessage
        role="status"
        titleAs="h3"
        title="No categories yet"
        description="We're getting the collection ready. Please check back soon."
      />
    )
  }

  return (
    <>
      {isRefetchError && <RefreshErrorNotice />}
      <ResponsiveGrid $columns={{ base: 1, md: 2, lg: 3 }}>
        {categories.map((category) => (
          <li key={category.id}>
            <CategoryCard category={category} titleAs="h3" />
          </li>
        ))}
      </ResponsiveGrid>
    </>
  )
}

export function CategoryHighlights() {
  return (
    <HomeSection title="Shop by category">
      <CategoryHighlightsContent />
    </HomeSection>
  )
}
