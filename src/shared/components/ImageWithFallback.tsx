import { useState } from 'react'
import styled from 'styled-components'
import { resolveAssetUrl } from '@/shared/api/assetUrl'

const Frame = styled.div<{ $aspectRatio: string }>`
  position: relative;
  width: 100%;
  aspect-ratio: ${({ $aspectRatio }) => $aspectRatio};
  overflow: hidden;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.md};
`

const Img = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`

const Placeholder = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: ${({ theme }) => theme.space.md};
  text-align: center;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  background: ${({ theme }) => theme.colors.surfaceMuted};
`

type ImageWithFallbackProps = {
  src: string | null | undefined
  alt: string
  /** Accessible name of the placeholder shown when there is no image or it fails to load. */
  fallbackLabel?: string
  aspectRatio?: string
  loading?: 'lazy' | 'eager'
  className?: string
}

/** Image that renders a neutral placeholder when `src` is missing or fails to load. */
export function ImageWithFallback({
  src,
  alt,
  fallbackLabel = 'No image available',
  aspectRatio = '3 / 4',
  loading = 'lazy',
  className,
}: ImageWithFallbackProps) {
  // Tracking the failed URL (instead of a boolean) resets the fallback automatically when `src` changes.
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const resolvedSrc = resolveAssetUrl(src)
  const showFallback = !resolvedSrc || failedSrc === resolvedSrc

  return (
    <Frame $aspectRatio={aspectRatio} className={className}>
      {showFallback ? (
        <Placeholder role="img" aria-label={fallbackLabel}>
          <span aria-hidden="true">No image</span>
        </Placeholder>
      ) : (
        <Img src={resolvedSrc} alt={alt} loading={loading} decoding="async" onError={() => setFailedSrc(resolvedSrc)} />
      )}
    </Frame>
  )
}
