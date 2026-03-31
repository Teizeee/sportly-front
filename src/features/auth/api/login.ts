import { httpClient } from '@shared/lib/http/httpClient'

export type LoginRequest = {
  email: string
  password: string
}

export type LoginResponse = {
  access_token: string
  token_type?: string
}

export function login(payload: LoginRequest): Promise<LoginResponse> {
  return httpClient.request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: payload,
    skipAuth: true,
  })
}
