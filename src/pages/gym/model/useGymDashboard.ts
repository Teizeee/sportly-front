import { useEffect, useState } from 'react'
import { fetchCurrentGymAdmin } from '../api/gymDashboardApi'

type GymDashboardState = {
  adminName: string
  isLoading: boolean
  error: string | null
}

export function useGymDashboard(): GymDashboardState {
  const [adminName, setAdminName] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadDashboard() {
      setIsLoading(true)
      setError(null)

      try {
        const me = await fetchCurrentGymAdmin()

        if (!isMounted) {
          return
        }

        setAdminName(`${me.first_name} ${me.last_name}`.trim())
      } catch {
        if (!isMounted) {
          return
        }

        setError('Не удалось загрузить данные профиля')
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadDashboard()

    return () => {
      isMounted = false
    }
  }, [])

  return { adminName, isLoading, error }
}

