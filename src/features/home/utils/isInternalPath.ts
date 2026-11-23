/**
 * True for same-origin app paths (`/sale`). Rejects absolute URLs, protocol-relative URLs (`//host`),
 * `/\host`, which browsers also treat as protocol-relative, and paths with whitespace or control characters
 * (browsers strip tabs/newlines, so `/<TAB>/host` would become `//host`).
 */
export function isInternalPath(url: string | null | undefined): url is string {
  return typeof url === 'string' && /^\/(?![/\\])[^\s\p{Cc}]*$/u.test(url)
}
