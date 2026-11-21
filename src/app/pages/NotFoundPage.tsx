import { StateMessage } from '@/shared/components/StateMessage'
import { ButtonLink } from '@/shared/components/ui/Button'

export function NotFoundPage() {
  return (
    <>
      <title>Page not found | Clothing Store</title>
      <StateMessage
        titleAs="h1"
        title="Page not found"
        description="The page you're looking for doesn't exist."
        actions={
          <>
            <ButtonLink to="/categories">Browse categories</ButtonLink>
            <ButtonLink to="/" variant="secondary">
              Go to home
            </ButtonLink>
          </>
        }
      />
    </>
  )
}
