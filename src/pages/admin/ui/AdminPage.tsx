import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearAccessToken } from '@shared/lib/auth/tokenStorage'
import { DashboardHeader } from '@shared/ui/dashboard-header/DashboardHeader'
import { DashboardShell } from '@shared/ui/dashboard-shell/DashboardShell'
import { SectionCard } from '@shared/ui/section-card/SectionCard'
import { StatsGrid } from '@shared/ui/stats-grid/StatsGrid'
import { TabNav } from '@shared/ui/tab-nav/TabNav'
import { adminTabs } from '../model/adminTabs'
import type { TabKey } from '../model/types'
import { useAdminDashboard } from '../model/useAdminDashboard'
import { ApplicationsTable } from './components/ApplicationsTable'
import styles from './AdminPage.module.css'

export function AdminPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabKey>('applications')
  const { stats, applications, isLoading, error } = useAdminDashboard()

  const handleLogout = () => {
    clearAccessToken()
    navigate('/login', { replace: true })
  }

  return (
    <DashboardShell>
      <DashboardHeader title="Spotly" onLogout={handleLogout} />

      <StatsGrid
        items={[
          { label: 'Всего залов', value: stats.gymsCount },
          {
            label: 'Пользователи',
            value: stats.users.total.toLocaleString('ru-RU'),
            details: [
              `Админы: ${stats.users.admins.toLocaleString('ru-RU')}`,
              `Тренеры: ${stats.users.trainers.toLocaleString('ru-RU')}`,
              `Клиенты: ${stats.users.clients.toLocaleString('ru-RU')}`,
            ],
          },
          { label: 'Заявки', value: stats.applicationsCount },
        ]}
      />

      <TabNav tabs={adminTabs} activeTab={activeTab} onChange={setActiveTab} ariaLabel="Вкладки суперадмина" />

      <SectionCard>
        {activeTab === 'applications' ? (
          <>
            <h2 className={styles.contentTitle}>Заявки на регистрацию</h2>
            <ApplicationsTable isLoading={isLoading} error={error} applications={applications} />
          </>
        ) : (
          <p className={styles.sectionState}>
            Раздел «{adminTabs.find((tab) => tab.key === activeTab)?.label}» в разработке
          </p>
        )}
      </SectionCard>
    </DashboardShell>
  )
}
