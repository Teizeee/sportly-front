import { httpClient } from '@shared/lib/http/httpClient'
import type { AdminUsersStats, CountPayload, GymApplication, UsersCountPayload } from '@entities/admin'

function extractCount(payload: CountPayload): number {
  if (typeof payload === 'number' && Number.isFinite(payload)) {
    return payload
  }

  if (payload && typeof payload === 'object') {
    const possible = [
      payload.count,
      payload.total,
      payload.value,
      payload.users_count,
      payload.gyms_count,
    ].find((value) => typeof value === 'number' && Number.isFinite(value))

    if (typeof possible === 'number') {
      return possible
    }
  }

  return 0
}

function getFiniteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null
}

function readFirstNumber(source: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const value = getFiniteNumber(source[key])

    if (value !== null) {
      return value
    }
  }

  return null
}

function extractUsersStats(payload: UsersCountPayload): AdminUsersStats {
  if (!payload || typeof payload !== 'object') {
    const total = extractCount(payload as CountPayload)
    return { total, admins: 0, trainers: 0, clients: 0 }
  }

  const source = payload as Record<string, unknown>
  const rolesSourceRaw = source.by_role ?? source.roles ?? source.role_counts
  const rolesSource =
    rolesSourceRaw && typeof rolesSourceRaw === 'object'
      ? (rolesSourceRaw as Record<string, unknown>)
      : ({} as Record<string, unknown>)

  const admins =
    readFirstNumber(source, ['admins', 'admins_count', 'admin_count']) ??
    (getFiniteNumber(rolesSource.SUPER_ADMIN) ?? 0) +
      (getFiniteNumber(rolesSource.GYM_ADMIN) ?? 0) +
      (readFirstNumber(source, ['super_admins', 'super_admins_count']) ?? 0) +
      (readFirstNumber(source, ['gym_admins', 'gym_admins_count']) ?? 0)

  const trainers =
    readFirstNumber(source, ['trainers', 'trainers_count', 'trainer_count']) ??
    (getFiniteNumber(rolesSource.TRAINER) ?? 0)

  const clients =
    readFirstNumber(source, ['clients', 'clients_count', 'client_count']) ??
    (getFiniteNumber(rolesSource.CLIENT) ?? 0)

  const calculatedTotal = admins + trainers + clients
  const total =
    readFirstNumber(source, ['count', 'total', 'value', 'users_count', 'usersCount']) ?? calculatedTotal

  return { total, admins, trainers, clients }
}

export async function fetchGymsCount(): Promise<number> {
  const payload = await httpClient.request<CountPayload>('/gyms/count')
  return extractCount(payload)
}

export async function fetchUsersStats(): Promise<AdminUsersStats> {
  const payload = await httpClient.request<UsersCountPayload>('/auth/users/count')
  return extractUsersStats(payload)
}

export async function fetchApplications(): Promise<GymApplication[]> {
  const payload = await httpClient.request<GymApplication[]>('/gyms/applications')
  return Array.isArray(payload) ? payload : []
}
