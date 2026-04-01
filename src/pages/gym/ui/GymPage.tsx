import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearAccessToken } from '@shared/lib/auth/tokenStorage'
import { DashboardHeader } from '@shared/ui/dashboard-header/DashboardHeader'
import { DashboardShell } from '@shared/ui/dashboard-shell/DashboardShell'
import { SectionCard } from '@shared/ui/section-card/SectionCard'
import { StatsGrid } from '@shared/ui/stats-grid/StatsGrid'
import { TabNav } from '@shared/ui/tab-nav/TabNav'
import { gymTabs } from '../model/gymTabs'
import type { GymTabKey } from '../model/types'
import { useGymDashboard } from '../model/useGymDashboard'
import { GymTabPanel } from './components/GymTabPanel'

export function GymPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<GymTabKey>('overview')
  const { adminName, isLoading, error } = useGymDashboard()

  const handleLogout = () => {
    clearAccessToken()
    navigate('/login', { replace: true })
  }

  return (
    <DashboardShell>
      <DashboardHeader title="Spotly Gym" onLogout={handleLogout} />

      <StatsGrid
        items={[
          { label: 'Статус', value: 'ACTIVE' },
          { label: 'Роль', value: 'GYM_ADMIN' },
          { label: 'Профиль', value: adminName || '-', hint: 'Данные из /auth/me' },
        ]}
      />

      <TabNav
        tabs={gymTabs}
        activeTab={activeTab}
        onChange={setActiveTab}
        ariaLabel="Вкладки администратора зала"
      />

      <SectionCard>
        <GymTabPanel activeTab={activeTab} adminName={adminName} isLoading={isLoading} error={error} />
      </SectionCard>
    </DashboardShell>
  )
}

