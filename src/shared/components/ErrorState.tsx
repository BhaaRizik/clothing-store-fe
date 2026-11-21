import type { ReactNode } from 'react'
import { StateMessage, type StateMessageProps } from './StateMessage'
import { Button } from './ui/Button'

type ErrorStateProps = {
  title?: string
  description?: string
  onRetry: () => void
  /** Extra actions shown next to the retry button. */
  actions?: ReactNode
  titleAs?: StateMessageProps['titleAs']
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'Please check your connection and try again.',
  onRetry,
  actions,
  titleAs,
}: ErrorStateProps) {
  return (
    <StateMessage
      role="alert"
      title={title}
      description={description}
      titleAs={titleAs}
      actions={
        <>
          <Button onClick={onRetry}>Try again</Button>
          {actions}
        </>
      }
    />
  )
}
