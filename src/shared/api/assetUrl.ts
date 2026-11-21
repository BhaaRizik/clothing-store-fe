const apiOrigin = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '')

/**
 * Resolves an asset URL returned by the API.
 * Root-relative paths (e.g. `/images/catalog/x.svg`) are served by the backend, so they are
 * prefixed with the API origin; absolute URLs (https://, CDN) and protocol-relative URLs pass through.
 */
export function resolveAssetUrl(url: string | null | undefined, origin: string = apiOrigin): string | null {
  const trimmed = url?.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return `${origin.replace(/\/+$/, '')}${trimmed}`
  }
  return trimmed
}
