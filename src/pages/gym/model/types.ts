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

export type ReviewAuthor = {
  id: string
  first_name: string
  last_name: string
  patronymic: string | null
}

export type GymReview = {
  id: string
  user_id: string
  gym_id: string
  rating: number
  comment: string | null
  created_at: string
  author: ReviewAuthor
}

export type GymTrainerOption = {
  trainer_id: string
  label: string
}

export type GymTrainerListItem = {
  user_id: string
  trainer_id: string
  full_name: string
  first_name: string
  last_name: string
  patronymic: string | null
  email: string
  phone: string | null
  description: string | null
  password: string | null
}

export type GymClientListItem = {
  user_id: string
  full_name: string
  blocked_at: string | null
  active_membership_name: string | null
  active_package_name: string | null
  active_package_sessions_left: number | null
}

export type BookingStatus = 'CREATED' | 'CANCELLED' | 'VISITED' | 'NOT_VISITED'

export type BookedUserShort = {
  id: string
  first_name: string
  last_name: string
  patronymic: string | null
}

export type TrainerSlotAvailability = {
  id: string | null
  trainer_id: string
  start_time: string
  end_time: string
  created_at: string | null
  booking_id: string | null
  booking_status: BookingStatus | null
  booked_user: BookedUserShort | null
}

export type GymMembershipOption = {
  id: string
  label: string
}

export type GymPackageOption = {
  id: string
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
