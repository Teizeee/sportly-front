export type GymTabKey = 'services' | 'trainers' | 'bookings' | 'reviews' | 'clients'

export type GymApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | string

export type GymStatus = 'ACTIVE' | 'BLOCKED' | string

export type GymAdminRole = 'GYM_ADMIN' | string

export type GymApplicationPayload = {
  id: string
  title: string
  address: string
  description: string
  phone: string
  status: GymApplicationStatus
  created_at: string
}

export type GymScheduleItem = {
  id: string
  day_of_week: number
  open_time: string | null
  close_time: string | null
}

export type GymSubscription = {
  end_date: string
}

export type MembershipType = {
  id: string
  name: string
  description: string
  price: string
  duration_months: number
}

export type TrainerBaseUser = {
  id: string
  first_name: string
  last_name: string
  email: string
  role: string
}

export type TrainerPayload = {
  id: string
  user_id: string
  gym_id: string
  phone: string | null
  description: string | null
  user: TrainerBaseUser | null
}

export type TrainerPackage = {
  id: string
  trainer_id: string
  name: string
  session_count: number
  price: string
  description: string
  trainer: TrainerPayload | null
}

export type GymTrainerOption = {
  trainer_id: string
  label: string
}

export type GymPayload = {
  id: string
  status: GymStatus
  gym_application: GymApplicationPayload | null
  schedule: GymScheduleItem[]
  subscription: GymSubscription | null
  membership_types?: MembershipType[]
  trainer_packages?: TrainerPackage[]
}

export type CurrentGymAdmin = {
  email: string
  first_name: string
  last_name: string
  role: GymAdminRole
  id: string
  created_at: string
  gym_application: GymApplicationPayload | null
  gym: GymPayload | null
}

export type SubscriptionTextPayload = {
  id: string
  description: string
}
