import type { GymApplication } from '@entities/admin'
import { ApplicationsTable } from './ApplicationsTable'
import styles from '../AdminPage.module.css'

type AdminApplicationsSectionProps = {
  isLoading: boolean
  error: string | null
  applications: GymApplication[]
  onApplicationClick: (application: GymApplication) => void
  onApproveClick: (application: GymApplication) => void
  onRejectClick: (application: GymApplication) => void
}

export function AdminApplicationsSection({
  isLoading,
  error,
  applications,
  onApplicationClick,
  onApproveClick,
  onRejectClick,
}: AdminApplicationsSectionProps) {
  return (
    <>
      <h2 className={styles.contentTitle}>Заявки на регистрацию</h2>
      <ApplicationsTable
        isLoading={isLoading}
        error={error}
        applications={applications}
        onApplicationClick={onApplicationClick}
        onApproveClick={onApproveClick}
        onRejectClick={onRejectClick}
      />
    </>
  )
}
