const ACCESS_TOKEN_KEY = 'sportly_access_token'
const USER_ROLE_KEY = 'sportly_user_role'

export type UserRole = 'GYM_ADMIN' | 'SUPER_ADMIN'

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function setAccessToken(token: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, token)
}

export function getUserRole(): UserRole | null {
  const role = localStorage.getItem(USER_ROLE_KEY)

  if (role === 'GYM_ADMIN' || role === 'SUPER_ADMIN') {
    return role
  }

  return null
}

export function setUserRole(role: UserRole): void {
  localStorage.setItem(USER_ROLE_KEY, role)
}

export function clearAccessToken(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(USER_ROLE_KEY)
}
