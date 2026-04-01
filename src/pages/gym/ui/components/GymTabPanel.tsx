import type { GymTabKey } from '../../model/types'
import { gymTabs } from '../../model/gymTabs'
import styles from './GymTabPanel.module.css'

type GymTabPanelProps = {
  activeTab: GymTabKey
  adminName: string
  isLoading: boolean
  error: string | null
}

export function GymTabPanel({ activeTab, adminName, isLoading, error }: GymTabPanelProps) {
  const activeLabel = gymTabs.find((tab) => tab.key === activeTab)?.label

  if (isLoading) {
    return <p className={styles.state}>Загрузка...</p>
  }

  if (error) {
    return <p className={styles.state}>{error}</p>
  }

  if (activeTab === 'overview') {
    return (
      <>
        <h2 className={styles.title}>Панель администратора зала</h2>
        <p className={styles.state}>Здравствуйте, {adminName || 'администратор'}.</p>
        <p className={styles.state}>Раздел управления залом будет собран следующим этапом.</p>
      </>
    )
  }

  return <p className={styles.state}>Раздел «{activeLabel}» в разработке</p>
}

