import { httpClient } from '@shared/lib/http/httpClient'

export type RegisterRequest = {
  email: string
  first_name: string
  last_name: string
  patronymic: string
  role: 'GYM_ADMIN'
  password: string
}

export type RegisterResponse = {
  id: string
  email: string
  first_name: string
  last_name: string
  patronymic?: string | null
}

export function register(payload: RegisterRequest): Promise<RegisterResponse> {
  return httpClient.request<RegisterResponse>('/auth/register', {
    method: 'POST',
    body: payload,
    skipAuth: true,
  })
}
