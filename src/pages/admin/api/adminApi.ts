import { httpClient } from '@shared/lib/http/httpClient'
import type {
  AdminUsersStats,
  CountPayload,
  EditableGym,
  EditableUser,
  GymReviewAdmin,
  GymApplication,
  PlatformSubscription,
  SubscriptionText,
  TrainerReviewAdmin,
  UserRole,
  UsersCountPayload,
} from '@entities/admin'
import {
  extractArrayPayload,
  extractCount,
  extractUsersStats,
  toEditableGym,
  toEditableUser,
  toGymReviewAdmin,
  toPlatformSubscription,
  toSubscriptionText,
  toTrainerReviewAdmin,
} from './adminApiMappers'

export async function fetchGymsCount(): Promise<number> {
  const payload = await httpClient.request<CountPayload>('/gyms/count')
  return extractCount(payload)
}

export async function fetchUsersStats(): Promise<AdminUsersStats> {
  const payload = await httpClient.request<UsersCountPayload>('/auth/users/count')
  return extractUsersStats(payload)
}

export async function fetchApplications(): Promise<GymApplication[]> {
  const payload = await httpClient.request<GymApplication[]>('/gyms/applications')
  return Array.isArray(payload) ? payload : []
}

export async function fetchApplicationById(applicationId: string): Promise<GymApplication | null> {
  const applications = await fetchApplications()
  return applications.find((application) => application.id === applicationId) ?? null
}

export async function fetchPlatformSubscriptions(): Promise<PlatformSubscription[]> {
  const payload = await httpClient.request<unknown>('/subscriptions/')

  return extractArrayPayload(payload)
    .map(toPlatformSubscription)
    .filter((subscription): subscription is PlatformSubscription => subscription !== null)
}

export async function approveApplication(applicationId: string, subscriptionId: string): Promise<void> {
  await httpClient.request('/gyms/', {
    method: 'POST',
    body: {
      gym_application_id: applicationId,
      platform_subscription_id: subscriptionId,
    },
  })
}

export async function rejectApplication(applicationId: string, comment: string): Promise<void> {
  await httpClient.request(`/gyms/applications/${applicationId}/reject`, {
    method: 'PATCH',
    body: { comment },
  })
}

export async function fetchSubscriptionText(): Promise<SubscriptionText | null> {
  const payload = await httpClient.request<unknown>('/subscriptions/text')
  return toSubscriptionText(payload)
}

export async function updateSubscriptionText(id: string, description: string): Promise<void> {
  await httpClient.request('/subscriptions/text', {
    method: 'PUT',
    body: {
      id,
      description,
    },
  })
}

export async function fetchGymReviews(): Promise<GymReviewAdmin[]> {
  const payload = await httpClient.request<unknown>('/admin/reviews/gyms')

  return extractArrayPayload(payload)
    .map(toGymReviewAdmin)
    .filter((review): review is GymReviewAdmin => review !== null)
}

export async function fetchTrainerReviews(): Promise<TrainerReviewAdmin[]> {
  const payload = await httpClient.request<unknown>('/admin/reviews/trainers')

  return extractArrayPayload(payload)
    .map(toTrainerReviewAdmin)
    .filter((review): review is TrainerReviewAdmin => review !== null)
}

export async function deleteGymReview(reviewId: string): Promise<void> {
  await httpClient.request(`/admin/reviews/gyms/${reviewId}`, {
    method: 'DELETE',
  })
}

export async function deleteTrainerReview(reviewId: string): Promise<void> {
  await httpClient.request(`/admin/reviews/trainers/${reviewId}`, {
    method: 'DELETE',
  })
}

export async function fetchUsersByRole(role: Exclude<UserRole, 'SUPER_ADMIN'>): Promise<EditableUser[]> {
  const payload = await httpClient.request<unknown>(`/auth/users?role=${role}&include_blocked=True`)

  return extractArrayPayload(payload)
    .map(toEditableUser)
    .filter((user): user is EditableUser => user !== null)
}

export async function blockUser(userId: string, comment: string): Promise<void> {
  await httpClient.request(`/auth/users/${userId}/block`, {
    method: 'POST',
    body: { comment },
  })
}

export async function unblockUser(userId: string): Promise<void> {
  await httpClient.request(`/auth/users/${userId}/unblock`, {
    method: 'POST',
  })
}

export async function updateUserById(
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

export async function fetchGyms(): Promise<EditableGym[]> {
  const payload = await httpClient.request<unknown>('/gyms')

  return extractArrayPayload(payload)
    .map(toEditableGym)
    .filter((gym): gym is EditableGym => gym !== null)
}

export async function blockGym(gymId: string, comment: string): Promise<void> {
  await httpClient.request(`/gyms/${gymId}/block`, {
    method: 'POST',
    body: { comment },
  })
}

export async function unblockGym(gymId: string): Promise<void> {
  await httpClient.request(`/gyms/${gymId}/unblock`, {
    method: 'POST',
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
