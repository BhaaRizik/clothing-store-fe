import axios from 'axios'
import { toApiError } from './apiError'

const apiOrigin = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '')

/** The single Axios instance for the app. Errors are always rejected as `ApiError`. */
export const httpClient = axios.create({
  baseURL: `${apiOrigin}/api/v1`,
  timeout: 15_000,
  headers: { Accept: 'application/json, application/problem+json' },
})

httpClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(toApiError(error)),
)
