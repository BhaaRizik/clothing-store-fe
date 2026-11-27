import axios from 'axios'

export type ApiFieldError = {
  field: string
  message: string
}

type ApiErrorInit = {
  status: number
  code: string
  message: string
  fieldErrors?: ApiFieldError[]
  extensions?: Record<string, unknown>
}

/**
 * Normalized API error. `status` is 0 when no HTTP response was received.
 * `code` is the backend's stable error code (e.g. CATEGORY_NOT_FOUND) or a client-side code
 * (NETWORK_ERROR, TIMEOUT, UNKNOWN_ERROR, HTTP_<status>).
 */
export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly fieldErrors: ApiFieldError[]
  /** Non-standard ProblemDetail members (RFC 9457 extensions), e.g. `maxItemQuantity`. */
  readonly extensions: Readonly<Record<string, unknown>>

  constructor({ status, code, message, fieldErrors = [], extensions = {} }: ApiErrorInit) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.fieldErrors = fieldErrors
    this.extensions = extensions
  }
}

/** RFC 9457 problem details as produced by the backend. */
type ProblemDetail = {
  type?: unknown
  title?: unknown
  status?: unknown
  detail?: unknown
  code?: unknown
  errors?: unknown
}

const STANDARD_MEMBERS = new Set(['type', 'title', 'status', 'detail', 'instance', 'code', 'errors'])

const toExtensions = (problem: object): Record<string, unknown> =>
  Object.fromEntries(Object.entries(problem).filter(([key]) => !STANDARD_MEMBERS.has(key)))

const asString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.length > 0 ? value : undefined

function toFieldErrors(value: unknown): ApiFieldError[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item: unknown) => {
    if (typeof item !== 'object' || item === null) return []
    const { field, message } = item as Record<string, unknown>
    return typeof field === 'string' && typeof message === 'string' ? [{ field, message }] : []
  })
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error

  if (axios.isAxiosError(error)) {
    if (error.response) {
      const { status, data } = error.response
      const problem: ProblemDetail = typeof data === 'object' && data !== null ? data : {}
      return new ApiError({
        status,
        code: asString(problem.code) ?? `HTTP_${status}`,
        message: asString(problem.detail) ?? asString(problem.title) ?? `Request failed with status ${status}.`,
        fieldErrors: toFieldErrors(problem.errors),
        extensions: toExtensions(problem),
      })
    }
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new ApiError({ status: 0, code: 'TIMEOUT', message: 'The request timed out.' })
    }
    return new ApiError({ status: 0, code: 'NETWORK_ERROR', message: 'Unable to reach the server.' })
  }

  return new ApiError({
    status: 0,
    code: 'UNKNOWN_ERROR',
    message: error instanceof Error ? error.message : 'An unexpected error occurred.',
  })
}

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError

export const isNotFoundError = (error: unknown): boolean => isApiError(error) && error.status === 404

/**
 * The requested resource does not exist: a 404, or a 400 VALIDATION_ERROR rejecting one of `fields` as malformed
 * (the backend answers a malformed slug such as `/products/Bad_Slug` with 400 on field `slug`).
 */
export const isUnknownResourceError = (error: unknown, fields: readonly string[] = ['slug']): boolean =>
  isNotFoundError(error) ||
  (isApiError(error) &&
    error.status === 400 &&
    error.code === 'VALIDATION_ERROR' &&
    error.fieldErrors.some((fieldError) => fields.includes(fieldError.field)))
