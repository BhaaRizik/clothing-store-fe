import { useState } from 'react'
import styled from 'styled-components'
import { ImageWithFallback } from '@/shared/components/ImageWithFallback'
import type { ImageRef } from '@/shared/types/image'

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.sm};
`

const Thumbnails = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(64px, 1fr));
  gap: ${({ theme }) => theme.space.xs};
`

const ThumbButton = styled.button`
  display: block;
  width: 100%;
  padding: 0;
  background: none;
  border: 2px solid transparent;
  border-radius: ${({ theme }) => theme.radii.md};
  cursor: pointer;

  &[aria-pressed='true'] {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`

type ProductGalleryProps = {
  images: ImageRef[]
  productName: string
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const selected = images[selectedIndex] ?? images[0]

  return (
    <Wrapper>
      <ImageWithFallback
        src={selected?.url}
        alt={selected?.alt?.trim() || productName}
        fallbackLabel={`No image available for ${productName}`}
        loading="eager"
      />
      {images.length > 1 && (
        <Thumbnails aria-label="Product images">
          {images.map((image, index) => (
            <li key={`${index}-${image.url ?? 'no-url'}`}>
              <ThumbButton
                type="button"
                aria-pressed={index === selectedIndex}
                aria-label={`Show image ${index + 1} of ${images.length}`}
                onClick={() => setSelectedIndex(index)}
              >
                <ImageWithFallback src={image.url} alt="" fallbackLabel="Image unavailable" aspectRatio="1 / 1" />
              </ThumbButton>
            </li>
          ))}
        </Thumbnails>
      )}
    </Wrapper>
  )
}
