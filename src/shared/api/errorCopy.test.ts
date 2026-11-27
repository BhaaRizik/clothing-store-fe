import { AxiosError } from 'axios'
import { describe, expect, it } from 'vitest'
import { ApiError } from './apiError'
import { describeError, errorKind, isOutcomeUnknown } from './errorCopy'

const apiError = (status: number, code: string) => new ApiError({ status, code, message: code })

describe('errorKind', () => {
  it.each([
    [apiError(0, 'NETWORK_ERROR'), 'network'],
    [new AxiosError('Network Error', 'ERR_NETWORK'), 'network'],
    [apiError(0, 'TIMEOUT'), 'timeout'],
    [new AxiosError('timeout', 'ECONNABORTED'), 'timeout'],
    [apiError(500, 'INTERNAL_ERROR'), 'server'],
    [apiError(503, 'SERVICE_UNAVAILABLE'), 'server'],
    [apiError(502, 'HTTP_502'), 'server'],
    [apiError(404, 'ROUTE_NOT_FOUND'), 'other'],
    [apiError(405, 'METHOD_NOT_ALLOWED'), 'other'],
    [apiError(409, 'INSUFFICIENT_STOCK'), 'other'],
    [apiError(0, 'UNKNOWN_ERROR'), 'other'],
    [new Error('boom'), 'other'],
    [undefined, 'other'],
  ])('classifies %s as %s', (error, kind) => {
    expect(errorKind(error)).toBe(kind)
  })
})

describe('isOutcomeUnknown', () => {
  it('is true for network, timeout and server failures only', () => {
    expect(isOutcomeUnknown(apiError(0, 'NETWORK_ERROR'))).toBe(true)
    expect(isOutcomeUnknown(apiError(0, 'TIMEOUT'))).toBe(true)
    expect(isOutcomeUnknown(apiError(503, 'SERVICE_UNAVAILABLE'))).toBe(true)
    expect(isOutcomeUnknown(apiError(409, 'CART_CONFLICT'))).toBe(false)
    expect(isOutcomeUnknown(apiError(400, 'VALIDATION_ERROR'))).toBe(false)
  })
})

describe('describeError', () => {
  it('tells the user the server cannot be reached for network failures', () => {
    expect(describeError(apiError(0, 'NETWORK_ERROR'))).toEqual({
      title: "We can't reach the server",
      description: "We can't reach the server. Check your internet connection and try again.",
    })
  })

  it('tells the user the server was too slow for timeouts', () => {
    expect(describeError(apiError(0, 'TIMEOUT')).description).toBe('The server took too long to respond. Please try again.')
  })

  it.each([500, 503])('blames the server, not the connection, for %s', (status) => {
    const copy = describeError(apiError(status, `HTTP_${status}`))
    expect(copy).toEqual({
      title: 'Something went wrong on our side',
      description: "There's a problem on our side. Please try again later.",
    })
  })

  it('uses a generic message for other failures', () => {
    const copy = describeError(new Error('boom'))
    expect(copy.title).toBe('Something went wrong')
    expect(copy.description).toBe('Something unexpected happened. Please try again.')
    expect(copy.description).not.toMatch(/connection/i)
  })
})
