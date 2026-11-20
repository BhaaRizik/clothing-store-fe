import styled, { keyframes } from 'styled-components'
import { VisuallyHidden } from './ui/VisuallyHidden'

const spin = keyframes`
  to { transform: rotate(360deg); }
`

const Wrapper = styled.div`
  display: flex;
  justify-content: center;
  padding: ${({ theme }) => theme.space.xxl};
`

const Spinner = styled.span`
  width: 2.5rem;
  height: 2.5rem;
  border: 3px solid ${({ theme }) => theme.colors.surfaceMuted};
  border-top-color: ${({ theme }) => theme.colors.primary};
  border-radius: 50%;
  animation: ${spin} 800ms linear infinite;
`

type LoadingStateProps = {
  label?: string
}

export function LoadingState({ label = 'Loading' }: LoadingStateProps) {
  return (
    <Wrapper role="status">
      <Spinner aria-hidden="true" />
      <VisuallyHidden>{label}</VisuallyHidden>
    </Wrapper>
  )
}
