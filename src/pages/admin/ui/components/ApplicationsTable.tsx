import type { GymApplication } from '@entities/admin'
import { formatAdminName, formatDate } from '../../model/formatters'
import styles from './ApplicationsTable.module.css'

type ApplicationsTableProps = {
  isLoading: boolean
  error: string | null
  applications: GymApplication[]
}

export function ApplicationsTable({ isLoading, error, applications }: ApplicationsTableProps) {
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
            <tr key={application.id}>
              <td>{application.title}</td>
              <td>{formatAdminName(application)}</td>
              <td>{application.gym_admin.email}</td>
              <td>{application.phone}</td>
              <td>{formatDate(application.created_at)}</td>
              <td>
                <div className={styles.actionsCell}>
                  <button type="button" className={styles.approveButton}>
                    Одобрить
                  </button>
                  <button type="button" className={styles.rejectButton}>
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

