import { useCallback, useEffect, useState } from 'react'
import type { AdminDashboardStats, GymApplication } from '@entities/admin'
import { fetchApplications, fetchGymsCount, fetchUsersStats } from '../api/adminApi'

type AdminDashboardState = {
  stats: AdminDashboardStats
  applications: GymApplication[]
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
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

  const loadPageData = useCallback(async (isCancelled?: () => boolean) => {
    setIsLoading(true)
    setError(null)

    try {
      const [gymsCount, users, applicationsPayload] = await Promise.all([
        fetchGymsCount(),
        fetchUsersStats(),
        fetchApplications(),
      ])

      if (isCancelled?.()) {
        return
      }

      setApplications(applicationsPayload)
      setStats({
        gymsCount,
        users,
        applicationsCount: applicationsPayload.length,
      })
    } catch {
      if (isCancelled?.()) {
        return
      }

      setError('Не удалось загрузить данные страницы')
    } finally {
      if (!isCancelled?.()) {
        setIsLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    void loadPageData(() => cancelled)

    return () => {
      cancelled = true
    }
  }, [loadPageData])

  return {
    stats,
    applications,
    isLoading,
    error,
    refresh: () => loadPageData(),
  }
}
