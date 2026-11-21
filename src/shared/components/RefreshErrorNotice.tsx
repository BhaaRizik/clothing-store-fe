import styled from 'styled-components'

const Notice = styled.p`
  margin-bottom: ${({ theme }) => theme.space.md};
  padding: ${({ theme }) => `${theme.space.xs} ${theme.space.sm}`};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  background: ${({ theme }) => theme.colors.surface};
  border-left: 3px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
`

/** Non-blocking notice shown when a background refresh fails but previously loaded content is still shown. */
export function RefreshErrorNotice() {
  return <Notice role="status">We couldn't refresh this page. Showing the last loaded information.</Notice>
}
