import { API_BASE_URL } from '@shared/config/api'
import { clearAccessToken, getAccessToken } from '@shared/lib/auth/tokenStorage'
import { ApiError } from '@shared/lib/http/ApiError'

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

type RequestOptions = {
  method?: RequestMethod
  body?: unknown
  headers?: HeadersInit
  skipAuth?: boolean
}

function isRegisterPath(pathname: string): boolean {
  return pathname.endsWith('/register') || pathname.endsWith('/auth/register')
}

function buildUrl(path: string): URL {
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path
  return new URL(normalizedPath, API_BASE_URL)
}

async function parseResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return null
  }

  const contentType = response.headers.get('content-type')

  if (contentType?.includes('application/json')) {
    return response.json()
  }

  return response.text()
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers, skipAuth = false } = options
  const url = buildUrl(path)
  const requestHeaders = new Headers(headers)
  const requestBody = body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined

  if (body !== undefined && !(body instanceof FormData) && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json')
  }

  if (!skipAuth && !isRegisterPath(url.pathname)) {
    const accessToken = getAccessToken()

    if (accessToken) {
      requestHeaders.set('Authorization', `Bearer ${accessToken}`)
    }
  }

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: requestBody,
  })

  const payload = await parseResponseBody(response)

  if (response.status === 401) {
    clearAccessToken()

    if (window.location.pathname !== '/login') {
      window.location.assign('/login')
    }
  }

  if (!response.ok) {
    throw new ApiError('Request failed', response.status, payload)
  }

  return payload as T
}

export const httpClient = { request }
