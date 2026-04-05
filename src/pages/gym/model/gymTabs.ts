import type { GymTabKey } from './types'

export const gymTabs: Array<{ key: GymTabKey; label: string }> = [
  { key: 'services', label: 'Услуги' },
  { key: 'trainers', label: 'Тренеры' },
  { key: 'bookings', label: 'Бронирования' },
  { key: 'reviews', label: 'Отзывы' },
  { key: 'clients', label: 'Клиенты' },
]
