/** Image reference as returned by the API. Both fields may be null; a null `url` renders a fallback. */
export type ImageRef = {
  url: string | null
  alt: string | null
}
