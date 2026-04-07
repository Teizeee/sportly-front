import { httpClient } from '@shared/lib/http/httpClient'
import type {
  GymClientListItem,
  CurrentGymAdmin,
  GymMembershipOption,
  GymPackageOption,
  GymReview,
  GymApplicationPayload,
  GymTrainerListItem,
  GymTrainerOption,
  MembershipType,
  SubscriptionTextPayload,
  TrainerPackage,
} from '../model/types'

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value
  }

  const source = asRecord(value)
  const nested = source?.items ?? source?.results ?? source?.data

  return Array.isArray(nested) ? nested : []
}

function toGymApplication(raw: unknown): GymApplicationPayload | null {
  const source = asRecord(raw)

  if (!source) {
    return null
  }

  const id = typeof source.id === 'string' ? source.id : null
  const title = typeof source.title === 'string' ? source.title : null
  const address = typeof source.address === 'string' ? source.address : null
  const description = typeof source.description === 'string' ? source.description : null
  const phone = typeof source.phone === 'string' ? source.phone : null
  const status = typeof source.status === 'string' ? source.status : null
  const createdAt = typeof source.created_at === 'string' ? source.created_at : null

  if (!id || !title || !address || !description || !phone || !status || !createdAt) {
    return null
  }

  return {
    id,
    title,
    address,
    description,
    phone,
    status,
    created_at: createdAt,
  }
}

function toMembershipType(raw: unknown): MembershipType | null {
  const source = asRecord(raw)

  if (!source) {
    return null
  }

  const id = typeof source.id === 'string' ? source.id : null
  const name = typeof source.name === 'string' ? source.name : null
  const description = typeof source.description === 'string' ? source.description : null
  const price = typeof source.price === 'string' ? source.price : null
  const durationMonths = typeof source.duration_months === 'number' ? source.duration_months : null

  if (!id || !name || !description || !price || durationMonths === null) {
    return null
  }

  return {
    id,
    name,
    description,
    price,
    duration_months: durationMonths,
  }
}

function toTrainerPackage(raw: unknown): TrainerPackage | null {
  const source = asRecord(raw)

  if (!source) {
    return null
  }

  const id = typeof source.id === 'string' ? source.id : null
  const trainerId = typeof source.trainer_id === 'string' ? source.trainer_id : null
  const name = typeof source.name === 'string' ? source.name : null
  const sessionCount = typeof source.session_count === 'number' ? source.session_count : null
  const price = typeof source.price === 'string' ? source.price : null
  const description = typeof source.description === 'string' ? source.description : null

  if (!id || !trainerId || !name || sessionCount === null || !price || !description) {
    return null
  }

  const trainerRaw = asRecord(source.trainer)
  const trainerUserRaw = asRecord(trainerRaw?.user)

  return {
    id,
    trainer_id: trainerId,
    name,
    session_count: sessionCount,
    price,
    description,
    trainer: trainerRaw
      ? {
          id: typeof trainerRaw.id === 'string' ? trainerRaw.id : trainerId,
          user_id: typeof trainerRaw.user_id === 'string' ? trainerRaw.user_id : '',
          gym_id: typeof trainerRaw.gym_id === 'string' ? trainerRaw.gym_id : '',
          phone: typeof trainerRaw.phone === 'string' ? trainerRaw.phone : null,
          description: typeof trainerRaw.description === 'string' ? trainerRaw.description : null,
          user: trainerUserRaw
            ? {
                id: typeof trainerUserRaw.id === 'string' ? trainerUserRaw.id : '',
                first_name: typeof trainerUserRaw.first_name === 'string' ? trainerUserRaw.first_name : '',
                last_name: typeof trainerUserRaw.last_name === 'string' ? trainerUserRaw.last_name : '',
                email: typeof trainerUserRaw.email === 'string' ? trainerUserRaw.email : '',
                role: typeof trainerUserRaw.role === 'string' ? trainerUserRaw.role : '',
              }
            : null,
        }
      : null,
  }
}

function toGymReview(raw: unknown): GymReview | null {
  const source = asRecord(raw)

  if (!source) {
    return null
  }

  const id = typeof source.id === 'string' ? source.id : null
  const userId = typeof source.user_id === 'string' ? source.user_id : null
  const gymId = typeof source.gym_id === 'string' ? source.gym_id : null
  const rating = typeof source.rating === 'number' ? source.rating : null
  const comment = typeof source.comment === 'string' ? source.comment : null
  const createdAt = typeof source.created_at === 'string' ? source.created_at : null
  const authorRaw = asRecord(source.author)

  if (!id || !userId || !gymId || rating === null || !createdAt || !authorRaw) {
    return null
  }

  const authorId = typeof authorRaw.id === 'string' ? authorRaw.id : null
  const authorFirstName = typeof authorRaw.first_name === 'string' ? authorRaw.first_name.trim() : ''
  const authorLastName = typeof authorRaw.last_name === 'string' ? authorRaw.last_name.trim() : ''
  const authorPatronymic = typeof authorRaw.patronymic === 'string' ? authorRaw.patronymic.trim() : null

  if (!authorId || !authorFirstName || !authorLastName) {
    return null
  }

  return {
    id,
    user_id: userId,
    gym_id: gymId,
    rating,
    comment,
    created_at: createdAt,
    author: {
      id: authorId,
      first_name: authorFirstName,
      last_name: authorLastName,
      patronymic: authorPatronymic && authorPatronymic.length > 0 ? authorPatronymic : null,
    },
  }
}

function toGymMembershipOption(raw: unknown): GymMembershipOption | null {
  const source = asRecord(raw)

  if (!source) {
    return null
  }

  const id = typeof source.id === 'string' ? source.id : null
  const name = typeof source.name === 'string' ? source.name.trim() : ''

  if (!id || !name) {
    return null
  }

  return {
    id,
    label: name,
  }
}

function toGymPackageOption(raw: unknown): GymPackageOption | null {
  const source = asRecord(raw)

  if (!source) {
    return null
  }

  const id = typeof source.id === 'string' ? source.id : null
  const name = typeof source.name === 'string' ? source.name.trim() : ''

  if (!id || !name) {
    return null
  }

  return {
    id,
    label: name,
  }
}

export async function fetchCurrentGymAdmin(): Promise<CurrentGymAdmin> {
  const payload = await httpClient.request<CurrentGymAdmin>('/auth/me')

  return {
    ...payload,
    gym_application: toGymApplication(payload.gym_application),
    gym: payload.gym
      ? {
          ...payload.gym,
          gym_application: toGymApplication(payload.gym.gym_application),
          membership_types: asArray(payload.gym.membership_types)
            .map(toMembershipType)
            .filter((item): item is MembershipType => item !== null),
          trainer_packages: asArray(payload.gym.trainer_packages)
            .map(toTrainerPackage)
            .filter((item): item is TrainerPackage => item !== null),
        }
      : null,
  }
}

export async function fetchGymSubscriptionText(): Promise<SubscriptionTextPayload | null> {
  const payload = await httpClient.request<unknown>('/subscriptions/text')
  const source = asRecord(payload)
  const data = asRecord(source?.data) ?? source

  if (!data) {
    return null
  }

  const id = typeof data.id === 'string' || typeof data.id === 'number' ? String(data.id) : null
  const description = typeof data.description === 'string' ? data.description : null

  if (!id || description === null) {
    return null
  }

  return { id, description }
}

export async function submitGymApplication(payload: {
  title: string
  address: string
  description: string
  phone: string
}): Promise<void> {
  await httpClient.request('/gyms/applications', {
    method: 'POST',
    body: payload,
  })
}

export async function updateGymById(
  gymId: string,
  payload: {
    title: string
    address: string
    description: string
    phone: string
    schedule: Array<{
      id: string
      day_of_week: number
      open_time: string | null
      close_time: string | null
    }>
    subscription: {
      end_date: string
    } | null
  },
): Promise<void> {
  await httpClient.request(`/gyms/${gymId}`, {
    method: 'PUT',
    body: payload,
  })
}

export async function uploadGymPhoto(gymId: string, file: File): Promise<void> {
  const body = new FormData()
  body.append('file', file)

  await httpClient.request(`/gyms/${gymId}/photos`, {
    method: 'POST',
    body,
  })
}

export async function createGymMembership(payload: {
  name: string
  description: string
  price: number
  duration_months: 1 | 3 | 6 | 12
}): Promise<void> {
  await httpClient.request('/gyms/memberships', {
    method: 'POST',
    body: payload,
  })
}

export async function updateGymMembership(
  membershipTypeId: string,
  payload: {
    name: string
    description: string
    price: number
    duration_months: 1 | 3 | 6 | 12
  },
): Promise<void> {
  await httpClient.request(`/gyms/memberships/${membershipTypeId}`, {
    method: 'PUT',
    body: payload,
  })
}

export async function deleteGymMembership(membershipTypeId: string): Promise<void> {
  await httpClient.request(`/gyms/memberships/${membershipTypeId}`, {
    method: 'DELETE',
  })
}

function toGymTrainer(raw: unknown): GymTrainerListItem | null {
  const source = asRecord(raw)

  if (!source) {
    return null
  }

  const userId = typeof source.id === 'string' ? source.id : null
  const email = typeof source.email === 'string' ? source.email.trim() : ''
  const firstName = typeof source.first_name === 'string' ? source.first_name.trim() : ''
  const lastName = typeof source.last_name === 'string' ? source.last_name.trim() : ''
  const patronymic = typeof source.patronymic === 'string' ? source.patronymic.trim() : null
  const trainerProfile = asRecord(source.trainer_profile)
  const trainerId = typeof trainerProfile?.id === 'string' ? trainerProfile.id : null
  const trainerPhone = typeof trainerProfile?.phone === 'string' ? trainerProfile.phone.trim() : ''
  const trainerDescription = typeof trainerProfile?.description === 'string' ? trainerProfile.description.trim() : ''
  const trainerPassword = typeof trainerProfile?.password === 'string' ? trainerProfile.password.trim() : ''

  if (!userId || !trainerId || !firstName || !lastName || !email) {
    return null
  }

  return {
    user_id: userId,
    trainer_id: trainerId,
    full_name: [firstName, lastName, patronymic].filter((item): item is string => typeof item === 'string' && item.length > 0).join(' '),
    first_name: firstName,
    last_name: lastName,
    patronymic: patronymic && patronymic.length > 0 ? patronymic : null,
    email,
    phone: trainerPhone || null,
    description: trainerDescription || null,
    password: trainerPassword || null,
  }
}

function toGymClient(raw: unknown): GymClientListItem | null {
  const source = asRecord(raw)

  if (!source) {
    return null
  }

  const userId = typeof source.id === 'string' ? source.id : null
  const firstName = typeof source.first_name === 'string' ? source.first_name.trim() : ''
  const lastName = typeof source.last_name === 'string' ? source.last_name.trim() : ''
  const patronymic = typeof source.patronymic === 'string' ? source.patronymic.trim() : ''
  const blockedAt = typeof source.blocked_at === 'string' || source.blocked_at === null ? source.blocked_at : null
  const fallbackName = typeof source.email === 'string' ? source.email.trim() : ''
  const fullName = [lastName, firstName, patronymic].filter((item) => item.length > 0).join(' ')
  const activeMembershipRaw = asRecord(source.active_membership)
  const membershipName =
    typeof activeMembershipRaw?.membership_type_name === 'string' ? activeMembershipRaw.membership_type_name.trim() : ''
  const activePackageRaw = asRecord(source.active_package)
  const packageName =
    typeof activePackageRaw?.trainer_package_name === 'string' ? activePackageRaw.trainer_package_name.trim() : ''
  const trainerFirstName = typeof activePackageRaw?.trainer_first_name === 'string' ? activePackageRaw.trainer_first_name.trim() : ''
  const trainerLastName = typeof activePackageRaw?.trainer_last_name === 'string' ? activePackageRaw.trainer_last_name.trim() : ''
  const packageSessionCount =
    typeof activePackageRaw?.trainer_package_session_count === 'number' ? activePackageRaw.trainer_package_session_count : null
  const packageSessionsLeft = typeof activePackageRaw?.sessions_left === 'number' ? activePackageRaw.sessions_left : null
  const trainerFullName = [trainerLastName, trainerFirstName].filter((item) => item.length > 0).join(' ')
  const packageTitleFromTrainer =
    trainerFullName.length > 0 && packageSessionCount !== null ? `${trainerFullName} - ${packageSessionCount} занятий` : ''

  if (!userId) {
    return null
  }

  return {
    user_id: userId,
    full_name: fullName || fallbackName || `Пользователь ${userId.slice(0, 8)}`,
    blocked_at: blockedAt,
    active_membership_name: membershipName || null,
    active_package_name: packageTitleFromTrainer || packageName || null,
    active_package_sessions_left: packageSessionsLeft,
  }
}

export async function fetchGymTrainerUsers(gymId: string): Promise<GymTrainerListItem[]> {
  const payload = await httpClient.request<unknown>(`/auth/users?gym_id=${encodeURIComponent(gymId)}&role=TRAINER`)

  return asArray(payload)
    .map(toGymTrainer)
    .filter((item): item is GymTrainerListItem => item !== null)
}

export async function fetchGymClientUsers(gymId: string): Promise<GymClientListItem[]> {
  const payload = await httpClient.request<unknown>(
    `/auth/users?gym_id=${encodeURIComponent(gymId)}&role=CLIENT&include_blocked=True`,
  )

  return asArray(payload)
    .map(toGymClient)
    .filter((item): item is GymClientListItem => item !== null)
}

export async function fetchGymTrainers(gymId: string): Promise<GymTrainerOption[]> {
  const trainers = await fetchGymTrainerUsers(gymId)

  return trainers.map((trainer) => ({
    trainer_id: trainer.trainer_id,
    label: trainer.full_name,
  }))
}

export async function fetchGymMembershipOptions(gymId: string): Promise<GymMembershipOption[]> {
  const payload = await httpClient.request<unknown>(`/gyms/${gymId}/memberships`)

  return asArray(payload)
    .map(toGymMembershipOption)
    .filter((item): item is GymMembershipOption => item !== null)
}

export async function fetchGymPackageOptions(gymId: string): Promise<GymPackageOption[]> {
  const payload = await httpClient.request<unknown>(`/gyms/${gymId}/packages`)

  return asArray(payload)
    .map(toGymPackageOption)
    .filter((item): item is GymPackageOption => item !== null)
}

export async function deleteGymUserAccount(userId: string): Promise<void> {
  await httpClient.request(`/auth/users/${userId}`, {
    method: 'DELETE',
  })
}

export async function blockGymClientUser(gymId: string, userId: string): Promise<void> {
  await httpClient.request(`/gyms/${gymId}/block/${userId}`, {
    method: 'POST',
  })
}

export async function unblockGymClientUser(gymId: string, userId: string): Promise<void> {
  await httpClient.request(`/gyms/${gymId}/unblock/${userId}`, {
    method: 'POST',
  })
}

export async function assignClientTrainerPackage(userId: string, trainerPackageId: string): Promise<void> {
  await httpClient.request('/gyms/user-trainer-packages', {
    method: 'POST',
    body: {
      user_id: userId,
      trainer_package_id: trainerPackageId,
    },
  })
}

export async function assignClientMembership(userId: string, membershipTypeId: string): Promise<void> {
  await httpClient.request('/gyms/client-memberships', {
    method: 'POST',
    body: {
      user_id: userId,
      membership_type_id: membershipTypeId,
    },
  })
}

export async function createGymTrainerUser(payload: {
  email: string
  first_name: string
  last_name: string
  patronymic: string
  role: 'TRAINER'
  password: string
  phone: string
  description: string
  gym_id: string
}): Promise<void> {
  await httpClient.request('/auth/register', {
    method: 'POST',
    body: payload,
  })
}

export async function updateGymUserById(
  userId: string,
  payload: {
    last_name: string
    first_name: string
    patronymic: string | null
    email: string
    phone?: string | null
    description?: string | null
    password?: string | null
  },
): Promise<void> {
  const normalizedPayload = Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined))

  await httpClient.request(`/auth/users/${userId}`, {
    method: 'PUT',
    body: normalizedPayload,
  })
}

export async function createGymTrainerPackage(payload: {
  trainer_id: string
  name: string
  session_count: number
  price: number
  description: string
}): Promise<void> {
  await httpClient.request('/gyms/packages', {
    method: 'POST',
    body: payload,
  })
}

export async function updateGymTrainerPackage(
  trainerPackageId: string,
  payload: {
    trainer_id: string
    name: string
    session_count: number
    price: number
    description: string
  },
): Promise<void> {
  await httpClient.request(`/gyms/packages/${trainerPackageId}`, {
    method: 'PUT',
    body: payload,
  })
}

export async function deleteGymTrainerPackage(trainerPackageId: string): Promise<void> {
  await httpClient.request(`/gyms/packages/${trainerPackageId}`, {
    method: 'DELETE',
  })
}

export async function fetchGymReviews(gymId: string): Promise<GymReview[]> {
  const payload = await httpClient.request<unknown>(`/gyms/${gymId}/reviews`)

  return asArray(payload)
    .map(toGymReview)
    .filter((item): item is GymReview => item !== null)
}
