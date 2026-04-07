import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchCurrentGymAdmin, fetchGymSubscriptionText } from '../api/gymDashboardApi'
import type { CurrentGymAdmin, GymApplicationPayload, MembershipType, TrainerPackage } from './types'

type GymDashboardState = {
  me: CurrentGymAdmin | null
  applicationDraft: GymApplicationPayload | null
  membershipTypes: MembershipType[]
  trainerPackages: TrainerPackage[]
  subscriptionText: string
  isLoading: boolean
  servicesLoading: boolean
  error: string | null
  servicesError: string | null
}

type UseGymDashboardResult = GymDashboardState & {
  refresh: () => Promise<void>
}

const initialState: GymDashboardState = {
  me: null,
  applicationDraft: null,
  membershipTypes: [],
  trainerPackages: [],
  subscriptionText: '',
  isLoading: true,
  servicesLoading: false,
  error: null,
  servicesError: null,
}

export function useGymDashboard(): UseGymDashboardResult {
  const [state, setState] = useState<GymDashboardState>(initialState)
  const refreshRequestIdRef = useRef(0)

  const refresh = useCallback(async () => {
    const requestId = refreshRequestIdRef.current + 1
    refreshRequestIdRef.current = requestId
    const isLatestRequest = () => refreshRequestIdRef.current === requestId

    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
      servicesError: null,
    }))

    try {
      const me = await fetchCurrentGymAdmin()
      const applicationDraft = me.gym_application ?? me.gym?.gym_application ?? null

      if (!isLatestRequest()) {
        return
      }

      setState((prev) => ({
        ...prev,
        me,
        applicationDraft,
        membershipTypes: me.gym?.membership_types ?? [],
        trainerPackages: me.gym?.trainer_packages ?? [],
        subscriptionText: '',
        servicesLoading: false,
        isLoading: false,
      }))

      if (!me.gym) {
        try {
          const subscriptionTextPayload = await fetchGymSubscriptionText()

          if (!isLatestRequest()) {
            return
          }

          setState((prev) => ({
            ...prev,
            subscriptionText: subscriptionTextPayload?.description ?? '',
          }))
        } catch {
          if (!isLatestRequest()) {
            return
          }

          setState((prev) => ({
            ...prev,
            subscriptionText: '',
          }))
        }
      }
    } catch {
      if (!isLatestRequest()) {
        return
      }

      setState((prev) => ({
        ...prev,
        isLoading: false,
        servicesLoading: false,
        error: 'Не удалось загрузить данные профиля',
      }))
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { ...state, refresh }
}
