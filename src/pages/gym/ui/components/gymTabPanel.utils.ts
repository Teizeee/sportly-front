import { gymTabs } from '../../model/gymTabs'
import type {
  BookingStatus,
  GymReview,
  GymTabKey,
  TrainerPackage,
  TrainerSlotAvailability,
} from '../../model/types'

export const noop = () => undefined
export const membershipDurations = [1, 3, 6, 12] as const

export type MembershipDuration = (typeof membershipDurations)[number]

export type MembershipFormState = {
  name: string
  price: string
  durationMonths: MembershipDuration
  description: string
}

export type TrainerPackageFormState = {
  name: string
  price: string
  sessionCount: string
  trainerId: string
  description: string
}

export type TrainerCreateFormState = {
  last_name: string
  first_name: string
  patronymic: string
  phone: string
  email: string
  description: string
  password: string
}

export const initialMembershipFormState: MembershipFormState = {
  name: '',
  price: '',
  durationMonths: 1,
  description: '',
}

export const initialTrainerPackageFormState: TrainerPackageFormState = {
  name: '',
  price: '',
  sessionCount: '',
  trainerId: '',
  description: '',
}

export const initialTrainerCreateFormState: TrainerCreateFormState = {
  last_name: '',
  first_name: '',
  patronymic: '',
  phone: '',
  email: '',
  description: '',
  password: '',
}

const rubPriceFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

const reviewDateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  year: '2-digit',
})

const bookingDateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const slotTimeFormatter = new Intl.DateTimeFormat('ru-RU', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

export function normalizeDuration(months: number): MembershipDuration {
  return membershipDurations.includes(months as MembershipDuration) ? (months as MembershipDuration) : 1
}

export function formatPrice(value: string): string {
  const amount = Number(value)

  if (!Number.isFinite(amount)) {
    return value
  }

  return rubPriceFormatter.format(amount)
}

export function buildPlaceholderLabel(tab: GymTabKey): string {
  return gymTabs.find((item) => item.key === tab)?.label ?? tab
}

export function buildTrainerPackageTitle(packageItem: TrainerPackage): string {
  const firstName = packageItem.trainer?.user?.first_name?.trim()
  const lastName = packageItem.trainer?.user?.last_name?.trim()

  if (!firstName || !lastName) {
    return packageItem.name
  }

  return `${firstName} ${lastName[0]}. - ${packageItem.name}`
}

export function resolveTrainerLabelForPackage(packageItem: TrainerPackage): string {
  const firstName = packageItem.trainer?.user?.first_name?.trim()
  const lastName = packageItem.trainer?.user?.last_name?.trim()

  if (firstName && lastName) {
    return `${firstName} ${lastName}`
  }

  return `Тренер ${packageItem.trainer_id.slice(0, 8)}`
}

export function parsePrice(value: string): number | null {
  const normalized = value.trim().replace(',', '.')

  if (!normalized) {
    return null
  }

  const parsed = Number(normalized)

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null
  }

  return parsed
}

export function parseSessionCount(value: string): number | null {
  const normalized = value.trim()

  if (!normalized) {
    return null
  }

  const parsed = Number(normalized)

  if (!Number.isInteger(parsed) || parsed < 1) {
    return null
  }

  return parsed
}

export function formatDurationLabel(months: MembershipDuration): string {
  if (months === 1) {
    return '1 месяц'
  }

  if (months === 3 || months === 6) {
    return `${months} месяца`
  }

  return `${months} месяцев`
}

export function normalizePhone(phone: string | null): string {
  const trimmed = phone?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : '-'
}

export function formatSessionsLeft(sessionsLeft: number | null): string {
  if (sessionsLeft === null || !Number.isFinite(sessionsLeft)) {
    return '-'
  }

  return `${sessionsLeft} занятий`
}

export function formatReviewAuthor(review: GymReview): string {
  const fullName = [review.author.first_name, review.author.last_name, review.author.patronymic ?? '']
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .join(' ')

  return fullName || 'Пользователь'
}

export function formatReviewDate(isoDate: string): string {
  const date = new Date(isoDate)

  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return reviewDateFormatter.format(date)
}

export function clampRating(value: number): number {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.max(0, Math.min(5, Math.round(value)))
}

export function getTodayDateInputValue(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function shiftDateByDays(dateValue: string, days: number): string {
  const date = new Date(`${dateValue}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return getTodayDateInputValue()
  }

  date.setDate(date.getDate() + days)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function formatBookingDateLabel(dateValue: string): string {
  const date = new Date(`${dateValue}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return bookingDateFormatter.format(date)
}

export function formatSlotTimeLabel(dateTime: string): string {
  const date = new Date(dateTime)

  if (Number.isNaN(date.getTime())) {
    return '--:--'
  }

  return slotTimeFormatter.format(date)
}

export function formatBookedUserName(slot: TrainerSlotAvailability): string {
  const bookedUser = slot.booked_user

  if (!bookedUser) {
    return 'Нет бронирований'
  }

  const firstName = bookedUser.first_name.trim()
  const lastInitial = bookedUser.last_name.trim().charAt(0)

  if (!firstName) {
    return 'Нет бронирований'
  }

  if (!lastInitial) {
    return firstName
  }

  return `${firstName} ${lastInitial}.`
}

export function resolveBookingStatusText(status: BookingStatus): string {
  if (status === 'VISITED') {
    return 'Посетил'
  }

  if (status === 'NOT_VISITED') {
    return 'Отсутствовал'
  }

  if (status === 'CANCELLED') {
    return 'Отменено'
  }

  return ''
}
