import { httpClient } from '@shared/lib/http/httpClient'
import type {
  CurrentGymAdmin,
  GymApplicationPayload,
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
