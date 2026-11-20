import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios'
import { describe, expect, it } from 'vitest'
import { ApiError, isNotFoundError, toApiError } from './apiError'

function axiosErrorWithResponse(status: number, data: unknown): AxiosError {
  const config = { headers: new AxiosHeaders() }
  const response: AxiosResponse = { status, statusText: '', headers: {}, config, data }
  return new AxiosError('Request failed', 'ERR_BAD_REQUEST', config, undefined, response)
}

describe('toApiError', () => {
  it('normalizes a problem+json response', () => {
    const error = toApiError(
      axiosErrorWithResponse(404, {
        type: 'about:blank',
        title: 'Not Found',
        status: 404,
        detail: 'Category not found',
        code: 'CATEGORY_NOT_FOUND',
      }),
    )
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 404, code: 'CATEGORY_NOT_FOUND', message: 'Category not found' })
    expect(isNotFoundError(error)).toBe(true)
  })

  it('keeps validation field errors', () => {
    const error = toApiError(
      axiosErrorWithResponse(400, {
        title: 'Bad Request',
        code: 'VALIDATION_ERROR',
        errors: [{ field: 'size', message: 'must be less than or equal to 100' }, { bogus: true }],
      }),
    )
    expect(error.code).toBe('VALIDATION_ERROR')
    expect(error.message).toBe('Bad Request')
    expect(error.fieldErrors).toEqual([{ field: 'size', message: 'must be less than or equal to 100' }])
  })

  it('falls back to an HTTP code when the body is not problem details', () => {
    expect(toApiError(axiosErrorWithResponse(502, '<html>'))).toMatchObject({ status: 502, code: 'HTTP_502' })
  })

  it('maps a missing response to a network error', () => {
    const error = toApiError(new AxiosError('Network Error', 'ERR_NETWORK'))
    expect(error).toMatchObject({ status: 0, code: 'NETWORK_ERROR' })
  })
})
