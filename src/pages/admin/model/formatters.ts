import type { GymApplication } from '@entities/admin'

export function formatDate(value: string): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return new Intl.DateTimeFormat('ru-RU').format(date)
}

export function formatAdminName(application: GymApplication): string {
  const parts = [
    application.gym_admin.last_name,
    application.gym_admin.first_name,
    application.gym_admin.patronymic,
  ]

  return parts.filter(Boolean).join(' ')
}
