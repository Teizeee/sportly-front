import styles from './DashboardHeader.module.css'

type DashboardHeaderProps = {
  title: string
  onLogout: () => void
  logoutLabel?: string
}

export function DashboardHeader({ title, onLogout, logoutLabel = 'Выйти' }: DashboardHeaderProps) {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>{title}</h1>
      <button className={styles.logoutButton} type="button" onClick={onLogout}>
        {logoutLabel}
      </button>
    </header>
  )
}

