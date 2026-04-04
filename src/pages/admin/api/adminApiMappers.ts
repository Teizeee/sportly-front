import type {
  AdminUsersStats,
  CountPayload,
  EditableGym,
  EditableUser,
  GymReviewAdmin,
  PlatformSubscription,
  ReviewGymInfo,
  ReviewUserInfo,
  SubscriptionText,
  TrainerReviewAdmin,
  UsersCountPayload,
} from '@entities/admin'

export function extractCount(payload: CountPayload): number {
  if (typeof payload === 'number' && Number.isFinite(payload)) {
    return payload
  }

  if (payload && typeof payload === 'object') {
    const possible = [payload.count, payload.total, payload.value, payload.users_count, payload.gyms_count].find(
      (value) => typeof value === 'number' && Number.isFinite(value),
    )

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

export function extractUsersStats(payload: UsersCountPayload): AdminUsersStats {
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
    readFirstNumber(source, ['trainers', 'trainers_count', 'trainer_count']) ?? (getFiniteNumber(rolesSource.TRAINER) ?? 0)

  const clients =
    readFirstNumber(source, ['clients', 'clients_count', 'client_count']) ?? (getFiniteNumber(rolesSource.CLIENT) ?? 0)

  const calculatedTotal = admins + trainers + clients
  const total = readFirstNumber(source, ['count', 'total', 'value', 'users_count', 'usersCount']) ?? calculatedTotal

  return { total, admins, trainers, clients }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

export function extractArrayPayload(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload
  }

  const source = asRecord(payload)

  if (!source) {
    return []
  }

  const nested = source.items ?? source.results ?? source.data ?? source.subscriptions

  return Array.isArray(nested) ? nested : []
}

export function toPlatformSubscription(raw: unknown): PlatformSubscription | null {
  const source = asRecord(raw)

  if (!source) {
    return null
  }

  const id = typeof source.id === 'string' ? source.id : null
  const value = getFiniteNumber(source.value)
  const description = typeof source.description === 'string' ? source.description : null

  if (!id || value === null || !description || description.length === 0) {
    return null
  }

  return {
    id,
    value,
    description,
  }
}

export function toSubscriptionText(raw: unknown): SubscriptionText | null {
  const baseSource = asRecord(raw)
  const source = asRecord(baseSource?.data) ?? baseSource

  if (!source) {
    return null
  }

  const id = typeof source.id === 'string' || typeof source.id === 'number' ? String(source.id) : null
  const description = typeof source.description === 'string' ? source.description : null

  if (!id || description === null) {
    return null
  }

  return { id, description }
}

export function toEditableUser(raw: unknown): EditableUser | null {
  const source = asRecord(raw)

  if (!source) {
    return null
  }

  const id = typeof source.id === 'string' ? source.id : null
  const firstName = typeof source.first_name === 'string' ? source.first_name : null
  const lastName = typeof source.last_name === 'string' ? source.last_name : null
  const email = typeof source.email === 'string' ? source.email : null
  const patronymic = typeof source.patronymic === 'string' || source.patronymic === null ? source.patronymic : null
  const birthDate = typeof source.birth_date === 'string' || source.birth_date === null ? source.birth_date : null
  const blockedAt = typeof source.blocked_at === 'string' || source.blocked_at === null ? source.blocked_at : null
  const role =
    source.role === 'CLIENT' || source.role === 'TRAINER' || source.role === 'GYM_ADMIN' || source.role === 'SUPER_ADMIN'
      ? source.role
      : 'CLIENT'
  const trainerProfileRaw = asRecord(source.trainer_profile)
  const trainerProfileId = typeof trainerProfileRaw?.id === 'string' ? trainerProfileRaw.id : null
  const trainerProfileUserId = typeof trainerProfileRaw?.user_id === 'string' ? trainerProfileRaw.user_id : null
  const trainerProfileGymId = typeof trainerProfileRaw?.gym_id === 'string' ? trainerProfileRaw.gym_id : null
  const trainerProfilePhone = typeof trainerProfileRaw?.phone === 'string' ? trainerProfileRaw.phone : null
  const trainerProfileDescription = typeof trainerProfileRaw?.description === 'string' ? trainerProfileRaw.description : null
  const trainerProfilePassword =
    typeof trainerProfileRaw?.password === 'string' || trainerProfileRaw?.password === null ? trainerProfileRaw.password : null

  if (!id || !firstName || !lastName || !email) {
    return null
  }

  return {
    id,
    first_name: firstName,
    last_name: lastName,
    email,
    patronymic,
    birth_date: birthDate,
    role,
    trainer_profile:
      trainerProfileId && trainerProfileUserId && trainerProfileGymId && trainerProfilePhone && trainerProfileDescription
        ? {
            id: trainerProfileId,
            user_id: trainerProfileUserId,
            gym_id: trainerProfileGymId,
            phone: trainerProfilePhone,
            description: trainerProfileDescription,
            password: trainerProfilePassword,
          }
        : null,
    blocked_at: blockedAt,
  }
}

export function toEditableGym(raw: unknown): EditableGym | null {
  const source = asRecord(raw)

  if (!source) {
    return null
  }

  const id = typeof source.id === 'string' ? source.id : null
  const gymApplication = asRecord(source.gym_application)
  const title =
    typeof source.title === 'string' ? source.title : typeof gymApplication?.title === 'string' ? gymApplication.title : null
  const address =
    typeof source.address === 'string'
      ? source.address
      : typeof gymApplication?.address === 'string'
        ? gymApplication.address
        : null
  const description =
    typeof source.description === 'string'
      ? source.description
      : typeof gymApplication?.description === 'string'
        ? gymApplication.description
        : null
  const phone =
    typeof source.phone === 'string' ? source.phone : typeof gymApplication?.phone === 'string' ? gymApplication.phone : null
  const subscriptionRaw = asRecord(source.subscription)
  const subscriptionEndDate =
    typeof subscriptionRaw?.end_date === 'string' && subscriptionRaw.end_date.length > 0 ? subscriptionRaw.end_date : null
  const scheduleRaw = Array.isArray(source.schedule) ? source.schedule : []
  const schedule = scheduleRaw
    .map((item) => {
      const scheduleItem = asRecord(item)

      if (!scheduleItem) {
        return null
      }

      const dayOfWeek = typeof scheduleItem.day_of_week === 'number' ? scheduleItem.day_of_week : null
      const scheduleId = typeof scheduleItem.id === 'string' ? scheduleItem.id : null
      const openTime =
        typeof scheduleItem.open_time === 'string' || scheduleItem.open_time === null ? scheduleItem.open_time : null
      const closeTime =
        typeof scheduleItem.close_time === 'string' || scheduleItem.close_time === null ? scheduleItem.close_time : null

      if (dayOfWeek === null || !Number.isInteger(dayOfWeek)) {
        return null
      }

      return {
        id: scheduleId ?? `${id ?? 'gym'}-${dayOfWeek}`,
        day_of_week: dayOfWeek,
        open_time: openTime,
        close_time: closeTime,
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
  const status = source.status === 'ACTIVE' || source.status === 'BLOCKED' ? source.status : undefined

  if (!id || !title || !phone || !address || !description) {
    return null
  }

  return {
    id,
    title,
    address,
    description,
    phone,
    schedule,
    subscription_end_date: subscriptionEndDate,
    status,
  }
}

function toReviewUserInfo(raw: unknown): ReviewUserInfo | null {
  const source = asRecord(raw)

  if (!source) {
    return null
  }

  const id = typeof source.id === 'string' ? source.id : null
  const firstName = typeof source.first_name === 'string' ? source.first_name : null
  const lastName = typeof source.last_name === 'string' ? source.last_name : null
  const patronymic = typeof source.patronymic === 'string' || source.patronymic === null ? source.patronymic : null

  if (!id || !firstName || !lastName) {
    return null
  }

  return {
    id,
    first_name: firstName,
    last_name: lastName,
    patronymic,
  }
}

function toReviewGymInfo(raw: unknown): ReviewGymInfo | null {
  const source = asRecord(raw)

  if (!source) {
    return null
  }

  const id = typeof source.id === 'string' ? source.id : null
  const title = typeof source.title === 'string' ? source.title : null
  const address = typeof source.address === 'string' ? source.address : null

  if (!id || !title || !address) {
    return null
  }

  return { id, title, address }
}

export function toGymReviewAdmin(raw: unknown): GymReviewAdmin | null {
  const source = asRecord(raw)

  if (!source) {
    return null
  }

  const id = typeof source.id === 'string' ? source.id : null
  const rating = typeof source.rating === 'number' && Number.isFinite(source.rating) ? source.rating : null
  const comment = typeof source.comment === 'string' || source.comment === null ? source.comment : null
  const createdAt = typeof source.created_at === 'string' ? source.created_at : null
  const gym = toReviewGymInfo(source.gym)
  const author = toReviewUserInfo(source.author)

  if (!id || rating === null || !createdAt || !gym || !author) {
    return null
  }

  return {
    id,
    rating,
    comment,
    created_at: createdAt,
    gym,
    author,
  }
}

export function toTrainerReviewAdmin(raw: unknown): TrainerReviewAdmin | null {
  const source = asRecord(raw)

  if (!source) {
    return null
  }

  const id = typeof source.id === 'string' ? source.id : null
  const rating = typeof source.rating === 'number' && Number.isFinite(source.rating) ? source.rating : null
  const comment = typeof source.comment === 'string' || source.comment === null ? source.comment : null
  const createdAt = typeof source.created_at === 'string' ? source.created_at : null
  const gym = toReviewGymInfo(source.gym)
  const trainer = toReviewUserInfo(source.trainer)
  const author = toReviewUserInfo(source.author)

  if (!id || rating === null || !createdAt || !gym || !trainer || !author) {
    return null
  }

  return {
    id,
    rating,
    comment,
    created_at: createdAt,
    gym,
    trainer,
    author,
  }
}
