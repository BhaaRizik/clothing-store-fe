import { toApiError } from './apiError'

/**
 * - `network`: no response was received (the server could not be reached).
 * - `timeout`: the request was sent but no response arrived in time.
 * - `server`: the server answered with a 5xx (including 503 SERVICE_UNAVAILABLE).
 * - `other`: any other failure (4xx, unexpected client errors).
 */
export type ErrorKind = 'network' | 'timeout' | 'server' | 'other'

export type ErrorCopy = {
  title: string
  description: string
}

export function errorKind(error: unknown): ErrorKind {
  const { status, code } = toApiError(error)
  if (status >= 500) return 'server'
  if (status !== 0) return 'other'
  if (code === 'TIMEOUT') return 'timeout'
  return code === 'UNKNOWN_ERROR' ? 'other' : 'network'
}

/**
 * Network, timeout and server failures leave the outcome of a write unknown: the server may have applied it,
 * so server state must be reloaded rather than assumed.
 */
export const isOutcomeUnknown = (error: unknown): boolean => errorKind(error) !== 'other'

const COPY: Record<ErrorKind, ErrorCopy> = {
  network: {
    title: "We can't reach the server",
    description: "We can't reach the server. Check your internet connection and try again.",
  },
  timeout: {
    title: 'The server is taking too long',
    description: 'The server took too long to respond. Please try again.',
  },
  server: {
    title: 'Something went wrong on our side',
    description: "There's a problem on our side. Please try again later.",
  },
  other: {
    title: 'Something went wrong',
    description: 'Something unexpected happened. Please try again.',
  },
}

/** User-facing title and description for a failed request, by kind of failure. */
export const describeError = (error: unknown): ErrorCopy => COPY[errorKind(error)]
