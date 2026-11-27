import type { ReactNode } from 'react'
import { describeError } from '../api/errorCopy'
import { StateMessage, type StateMessageProps } from './StateMessage'
import { Button } from './ui/Button'

type ErrorStateProps = {
  title?: string
  description?: string
  /** The failure being shown. Without an explicit title/description, the copy matches its kind (network, timeout, server). */
  error?: unknown
  onRetry: () => void
  /** Extra actions shown next to the retry button. */
  actions?: ReactNode
  titleAs?: StateMessageProps['titleAs']
}

export function ErrorState({ title, description, error, onRetry, actions, titleAs }: ErrorStateProps) {
  const copy = describeError(error)
  return (
    <StateMessage
      role="alert"
      title={title ?? copy.title}
      description={description ?? copy.description}
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
