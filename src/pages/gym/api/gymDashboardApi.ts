import { httpClient } from '@shared/lib/http/httpClient'
import type { CurrentUser } from '@entities/auth'

export async function fetchCurrentGymAdmin(): Promise<CurrentUser> {
  return httpClient.request<CurrentUser>('/auth/me')
}

