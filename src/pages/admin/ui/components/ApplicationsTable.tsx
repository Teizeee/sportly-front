import type { GymApplication } from '@entities/admin'
import { formatAdminName, formatDate } from '../../model/formatters'
import styles from './ApplicationsTable.module.css'

type ApplicationsTableProps = {
  isLoading: boolean
  error: string | null
  applications: GymApplication[]
  onApplicationClick: (application: GymApplication) => void
  onApproveClick: (application: GymApplication) => void
  onRejectClick: (application: GymApplication) => void
}

export function ApplicationsTable({
  isLoading,
  error,
  applications,
  onApplicationClick,
  onApproveClick,
  onRejectClick,
}: ApplicationsTableProps) {
  if (isLoading) {
    return <p className={styles.sectionState}>Загрузка...</p>
  }

  if (error) {
    return <p className={styles.sectionState}>{error}</p>
  }

  if (applications.length === 0) {
    return <p className={styles.sectionState}>Новых заявок нет</p>
  }

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Зал</th>
            <th>Админ</th>
            <th>Email</th>
            <th>Телефон</th>
            <th>Дата</th>
            <th aria-label="Действия" />
          </tr>
        </thead>
        <tbody>
          {applications.map((application) => (
            <tr key={application.id} className={styles.row} onClick={() => onApplicationClick(application)}>
              <td>{application.title}</td>
              <td>{formatAdminName(application)}</td>
              <td>{application.gym_admin.email}</td>
              <td>{application.phone}</td>
              <td>{formatDate(application.created_at)}</td>
              <td>
                <div className={styles.actionsCell}>
                  <button
                    type="button"
                    className={styles.approveButton}
                    onClick={(event) => {
                      event.stopPropagation()
                      onApproveClick(application)
                    }}
                  >
                    Одобрить
                  </button>
                  <button
                    type="button"
                    className={styles.rejectButton}
                    onClick={(event) => {
                      event.stopPropagation()
                      onRejectClick(application)
                    }}
                  >
                    Отклонить
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
