import { AxiosError, AxiosHeaders, type AxiosAdapter, type AxiosResponse } from 'axios'
import { describe, expect, it } from 'vitest'
import { ApiError } from './apiError'
import { errorKind } from './errorCopy'
import { httpClient } from './httpClient'

/**
 * A transport that answers with a raw body, settled the way axios' own adapters do: a status rejected by
 * `validateStatus` becomes an AxiosError carrying the response. Response parsing and the client's
 * error interceptor run unchanged.
 */
const respondWith =
  (status: number, body: string, contentType: string): AxiosAdapter =>
  (config) => {
    const response: AxiosResponse = {
      data: body,
      status,
      statusText: '',
      headers: new AxiosHeaders({ 'Content-Type': contentType }),
      config,
      request: {},
    }
    if (config.validateStatus?.(status)) return Promise.resolve(response)
    return Promise.reject(
      new AxiosError(`Request failed with status code ${status}`, AxiosError.ERR_BAD_RESPONSE, config, {}, response),
    )
  }

/** A transport that fails without a response, as the XHR adapter does on timeout or a dropped connection. */
const failWith =
  (message: string, code: string): AxiosAdapter =>
  (config) =>
    Promise.reject(new AxiosError(message, code, config, {}))

const requestWith = (adapter: AxiosAdapter): Promise<unknown> =>
  httpClient.get('/categories', { adapter }).then(
    () => {
      throw new Error('Expected the request to fail')
    },
    (reason: unknown) => reason,
  )

describe('httpClient errors', () => {
  it('normalizes a 503 application/problem+json response to SERVICE_UNAVAILABLE (a server failure)', async () => {
    const problem = JSON.stringify({
      type: 'about:blank',
      title: 'Service Unavailable',
      status: 503,
      detail: 'The service is temporarily unavailable.',
      code: 'SERVICE_UNAVAILABLE',
    })

    const error = await requestWith(respondWith(503, problem, 'application/problem+json'))

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      status: 503,
      code: 'SERVICE_UNAVAILABLE',
      message: 'The service is temporarily unavailable.',
    })
    expect(errorKind(error)).toBe('server')
  })

  it('normalizes a timed-out request (ECONNABORTED) to TIMEOUT', async () => {
    const error = await requestWith(failWith('timeout of 15000ms exceeded', AxiosError.ECONNABORTED))

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 0, code: 'TIMEOUT' })
    expect(errorKind(error)).toBe('timeout')
  })

  it('normalizes an unreachable server to NETWORK_ERROR', async () => {
    const error = await requestWith(failWith('Network Error', AxiosError.ERR_NETWORK))

    expect(error).toMatchObject({ status: 0, code: 'NETWORK_ERROR' })
    expect(errorKind(error)).toBe('network')
  })
})
