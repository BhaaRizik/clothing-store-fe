import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios'
import { describe, expect, it } from 'vitest'
import { ApiError, isNotFoundError, isUnknownResourceError, toApiError } from './apiError'

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

  it('exposes non-standard problem members as extensions', () => {
    const error = toApiError(
      axiosErrorWithResponse(409, {
        title: 'Conflict',
        status: 409,
        code: 'CART_ITEM_LIMIT_EXCEEDED',
        instance: '/api/v1/cart/items',
        maxItemQuantity: 10,
      }),
    )
    expect(error.code).toBe('CART_ITEM_LIMIT_EXCEEDED')
    expect(error.extensions).toEqual({ maxItemQuantity: 10 })
  })

  it('falls back to an HTTP code when the body is not problem details', () => {
    expect(toApiError(axiosErrorWithResponse(502, '<html>'))).toMatchObject({ status: 502, code: 'HTTP_502' })
  })

  it('maps a missing response to a network error', () => {
    const error = toApiError(new AxiosError('Network Error', 'ERR_NETWORK'))
    expect(error).toMatchObject({ status: 0, code: 'NETWORK_ERROR' })
  })
})

describe('isUnknownResourceError', () => {
  const invalid = (field: string) =>
    new ApiError({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'One or more request parameters are invalid.',
      fieldErrors: [{ field, message: 'must be a lowercase kebab-case slug of at most 200 characters' }],
    })

  it('treats a 404 as an unknown resource', () => {
    expect(isUnknownResourceError(new ApiError({ status: 404, code: 'PRODUCT_NOT_FOUND', message: 'x' }))).toBe(true)
  })

  it('treats a 400 VALIDATION_ERROR on the slug as an unknown resource', () => {
    expect(isUnknownResourceError(invalid('slug'))).toBe(true)
  })

  it('checks the given fields instead of slug when provided', () => {
    expect(isUnknownResourceError(invalid('category'), ['category'])).toBe(true)
    expect(isUnknownResourceError(invalid('slug'), ['category'])).toBe(false)
  })

  it('does not treat validation errors on other fields, other 400s or other failures as unknown resources', () => {
    expect(isUnknownResourceError(invalid('page'))).toBe(false)
    expect(isUnknownResourceError(new ApiError({ status: 400, code: 'HTTP_400', message: 'x', fieldErrors: [{ field: 'slug', message: 'x' }] }))).toBe(false)
    expect(isUnknownResourceError(new ApiError({ status: 500, code: 'INTERNAL_ERROR', message: 'x' }))).toBe(false)
    expect(isUnknownResourceError(new Error('boom'))).toBe(false)
  })
})
