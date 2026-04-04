import type { AdminDashboardStats } from '@entities/admin'

export function buildAdminStatsItems(stats: AdminDashboardStats) {
  return [
    { label: 'Всего залов', value: stats.gymsCount },
    {
      label: 'Пользователи',
      value: stats.users.total.toLocaleString('ru-RU'),
      details: [
        `Админы: ${stats.users.admins.toLocaleString('ru-RU')}`,
        `Тренеры: ${stats.users.trainers.toLocaleString('ru-RU')}`,
        `Клиенты: ${stats.users.clients.toLocaleString('ru-RU')}`,
      ],
    },
    { label: 'Заявки', value: stats.applicationsCount },
  ]
}
