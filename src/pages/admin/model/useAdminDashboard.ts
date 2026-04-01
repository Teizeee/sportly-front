import { useEffect, useState } from 'react'
import type { AdminDashboardStats, GymApplication } from '@entities/admin'
import { fetchApplications, fetchGymsCount, fetchUsersStats } from '../api/adminApi'

type AdminDashboardState = {
  stats: AdminDashboardStats
  applications: GymApplication[]
  isLoading: boolean
  error: string | null
}

const initialStats: AdminDashboardStats = {
  gymsCount: 0,
  users: { total: 0, admins: 0, trainers: 0, clients: 0 },
  applicationsCount: 0,
}

export function useAdminDashboard(): AdminDashboardState {
  const [stats, setStats] = useState<AdminDashboardStats>(initialStats)
  const [applications, setApplications] = useState<GymApplication[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadPageData() {
      setIsLoading(true)
      setError(null)

      try {
        const [gymsCount, users, applicationsPayload] = await Promise.all([
          fetchGymsCount(),
          fetchUsersStats(),
          fetchApplications(),
        ])

        if (!isMounted) {
          return
        }

        setApplications(applicationsPayload)
        setStats({
          gymsCount,
          users,
          applicationsCount: applicationsPayload.length,
        })
      } catch {
        if (!isMounted) {
          return
        }

        setError('Не удалось загрузить данные страницы')
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadPageData()

    return () => {
      isMounted = false
    }
  }, [])

  return { stats, applications, isLoading, error }
}
