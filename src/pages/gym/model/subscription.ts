const DAY_IN_MS = 24 * 60 * 60 * 1000

export type GymSubscriptionWarningMessage = 'Ваша подписка истекла!' | 'До конца подписки осталось меньше 7 дней!' | null

function parseDateOnly(value: string | null | undefined): Date | null {
  if (!value) {
    return null
  }

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)

  if (!match) {
    const fallback = new Date(value)
    return Number.isNaN(fallback.getTime()) ? null : fallback
  }

  const [, yearRaw, monthRaw, dayRaw] = match
  const year = Number(yearRaw)
  const monthIndex = Number(monthRaw) - 1
  const day = Number(dayRaw)
  const date = new Date(year, monthIndex, day)

  return Number.isNaN(date.getTime()) ? null : date
}

function getTodayDateOnly(now: Date = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

export function getGymSubscriptionWarning(endDate: string | null | undefined): GymSubscriptionWarningMessage {
  const subscriptionEndDate = parseDateOnly(endDate)

  if (!subscriptionEndDate) {
    return null
  }

  const today = getTodayDateOnly()
  const dateOnly = getTodayDateOnly(subscriptionEndDate)
  const diffDays = Math.floor((dateOnly.getTime() - today.getTime()) / DAY_IN_MS)

  if (diffDays < 0) {
    return 'Ваша подписка истекла!'
  }

  if (diffDays < 7) {
    return 'До конца подписки осталось меньше 7 дней!'
  }

  return null
}

export function formatSubscriptionEndDate(value: string | null | undefined): string {
  const date = parseDateOnly(value)

  if (!date) {
    return '-'
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  }).format(date)
}
