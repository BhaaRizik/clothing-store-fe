import { StateMessage } from '@/shared/components/StateMessage'
import { Button, ButtonLink } from '@/shared/components/ui/Button'

/** Route error boundary: unexpected render/loader errors (e.g. a failed lazy chunk). */
export function RouteErrorPage() {
  return (
    <StateMessage
      role="alert"
      titleAs="h1"
      title="Something went wrong"
      description="An unexpected error occurred while showing this page."
      actions={
        <>
          <Button onClick={() => window.location.reload()}>Reload page</Button>
          <ButtonLink to="/categories" variant="secondary">
            Browse categories
          </ButtonLink>
        </>
      }
    />
  )
}
