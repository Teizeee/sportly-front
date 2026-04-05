import type { UserRole } from '@entities/admin'

export type EditingTabKey = 'users' | 'trainers' | 'gymAdmins' | 'gyms'

export const editingPanelText = {
  users: 'Пользователи',
  trainers: 'Тренеры',
  gymAdmins: 'Админы залов',
  gyms: 'Залы',
  editing: 'Редактирование',
  tabsAria: 'Вкладки редактирования',
  search: 'Поиск',
  loadError: 'Не удалось загрузить данные для вкладки',
  loading: 'Загружаем данные...',
  edit: 'Редактировать',
  block: 'Заблокировать',
  unblock: 'Разблокировать',
  empty: 'Ничего не найдено',
  userBlockTitle: 'Вы действительно хотите заблокировать пользователя?',
  userUnblockTitle: 'Вы действительно хотите разблокировать пользователя?',
  gymBlockTitle: 'Вы действительно хотите заблокировать зал?',
  gymUnblockTitle: 'Вы действительно хотите разблокировать зал?',
  blockReason: 'Причина блокировки',
  yes: 'Да',
  no: 'Нет',
  userBlockError: 'Не удалось изменить статус пользователя',
  gymBlockError: 'Не удалось изменить статус зала',
  requiredFields: 'Заполните обязательные поля',
  saveError: 'Не удалось сохранить изменения',
  lastName: 'Фамилия',
  firstName: 'Имя',
  patronymic: 'Отчество',
  phone: 'Номер',
  gymName: 'Название зала',
  gymPhone: 'Номер телефона',
  address: 'Адрес',
  email: 'Email',
  description: 'Описание',
  gymDescription: 'Описание зала',
  schedule: 'Время работы',
  subscriptionUntil: 'Подписка до',
  invalidTime: 'Время работы должно быть только по ровным часам (например, 8.00, 21.00)',
  invalidDate: 'Поле «Подписка до» должно быть в формате даты',
  invalidSchedulePair:
    'Для каждого дня укажите либо оба времени (от и до), либо оставьте оба пустыми',
  descriptionCounterMax: 255,
  password: 'Пароль',
  passwordPlaceholder: 'Оставьте пустым, если не нужно менять',
  save: 'Сохранить',
} as const

export type EditingPanelText = typeof editingPanelText

export type GymWorkDay = {
  key: number
  label: string
}

export const gymWorkDays: GymWorkDay[] = [
  { key: 0, label: 'Понедельник' },
  { key: 1, label: 'Вторник' },
  { key: 2, label: 'Среда' },
  { key: 3, label: 'Четверг' },
  { key: 4, label: 'Пятница' },
  { key: 5, label: 'Суббота' },
  { key: 6, label: 'Воскресенье' },
]

export const editingTabs: Array<{ key: EditingTabKey; label: string }> = [
  { key: 'users', label: editingPanelText.users },
  { key: 'trainers', label: editingPanelText.trainers },
  { key: 'gymAdmins', label: editingPanelText.gymAdmins },
  { key: 'gyms', label: editingPanelText.gyms },
]

export const roleByTab: Record<Exclude<EditingTabKey, 'gyms'>, Exclude<UserRole, 'SUPER_ADMIN'>> = {
  users: 'CLIENT',
  trainers: 'TRAINER',
  gymAdmins: 'GYM_ADMIN',
}
