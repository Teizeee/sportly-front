import type { EditableGym, EditableUser } from '@entities/admin'
import { API_BASE_URL } from '@shared/config/api'

export function formatUserName(user: EditableUser): string {
  return [user.last_name, user.first_name, user.patronymic ?? ''].join(' ').trim()
}

export function isUserBlocked(user: EditableUser): boolean {
  return user.blocked_at !== null && user.blocked_at !== undefined
}

export function isGymBlocked(gym: EditableGym): boolean {
  return gym.status === 'BLOCKED'
}

export function resolveAvatarBaseUrl(): string {
  return API_BASE_URL.replace(/\/api\/v1\/?$/, '/')
}

export function readTrainerPassword(user: EditableUser): string {
  return typeof user.trainer_profile?.password === 'string' ? user.trainer_profile.password : ''
}

export function normalizeInputTime(value: string): string | null {
  const normalized = value.trim().replace(',', '.')
  if (normalized.length === 0) return null

  const match = normalized.match(/^([01]?\d|2[0-3])(?:(?::|\.)(\d{2}))?$/)

  if (!match) {
    return null
  }

  const minutes = match[2] ?? '00'

  if (minutes !== '00') {
    return null
  }

  const hour = match[1].padStart(2, '0')

  return `${hour}:00:00`
}

export function toInputHour(value: string | null): string {
  if (!value) return ''
  const match = value.match(/^(\d{2}):00(?::00)?$/)
  return match ? String(Number(match[1])) : ''
}
