export type CountPayload =
  | number
  | {
      count?: number
      total?: number
      value?: number
      users_count?: number
      gyms_count?: number
    }

export type UsersCountPayload =
  | CountPayload
  | {
      count?: number
      total?: number
      value?: number
      users_count?: number
      usersCount?: number
      admins?: number
      admins_count?: number
      admin_count?: number
      gym_admins?: number
      gym_admins_count?: number
      super_admins?: number
      super_admins_count?: number
      trainers?: number
      trainers_count?: number
      trainer_count?: number
      clients?: number
      clients_count?: number
      client_count?: number
      by_role?: Record<string, unknown>
      roles?: Record<string, unknown>
      role_counts?: Record<string, unknown>
    }

export type AdminUsersStats = {
  total: number
  admins: number
  trainers: number
  clients: number
}

export type GymApplication = {
  id: string
  title: string
  phone: string
  created_at: string
  gym_admin: {
    first_name: string
    last_name: string
    patronymic?: string | null
    email: string
  }
}

export type AdminDashboardStats = {
  gymsCount: number
  users: AdminUsersStats
  applicationsCount: number
}
