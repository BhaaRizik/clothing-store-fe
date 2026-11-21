import styled from 'styled-components'
import { ErrorState } from '@/shared/components/ErrorState'
import { LoadingState } from '@/shared/components/LoadingState'
import { RefreshErrorNotice } from '@/shared/components/RefreshErrorNotice'
import { StateMessage } from '@/shared/components/StateMessage'
import { ButtonLink } from '@/shared/components/ui/Button'
import { PageTitle } from '@/shared/components/ui/PageTitle'
import { ResponsiveGrid } from '@/shared/components/ui/ResponsiveGrid'
import { CategoryCard } from '../components/CategoryCard'
import { useCategories } from '../hooks/useCategories'

const Header = styled.header`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.xs};
  margin-bottom: ${({ theme }) => theme.space.xl};
`

const Intro = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
`

function CategoryListContent() {
  const { data: categories, isError, isRefetchError, refetch } = useCategories()

  // Error state only when nothing was loaded; a failed background refetch keeps the content.
  if (!categories) {
    if (isError) {
      return <ErrorState title="We couldn't load the categories" onRetry={() => void refetch()} />
    }
    return <LoadingState label="Loading categories" />
  }

  if (categories.length === 0) {
    return (
      <StateMessage
        role="status"
        title="No categories yet"
        description="We're getting the collection ready. Please check back soon."
        actions={<ButtonLink to="/">Back to home</ButtonLink>}
      />
    )
  }

  return (
    <>
      {isRefetchError && <RefreshErrorNotice />}
      <ResponsiveGrid $columns={{ base: 1, md: 2, lg: 3 }}>
        {categories.map((category) => (
          <li key={category.id}>
            <CategoryCard category={category} />
          </li>
        ))}
      </ResponsiveGrid>
    </>
  )
}

export function CategoryListPage() {
  return (
    <>
      <title>Categories | Clothing Store</title>
      <Header>
        <PageTitle>Shop by category</PageTitle>
        <Intro>Choose a category to see its products.</Intro>
      </Header>
      <CategoryListContent />
    </>
  )
}
