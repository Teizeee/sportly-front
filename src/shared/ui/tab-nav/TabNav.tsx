import styles from './TabNav.module.css'

type TabItem<T extends string> = {
  key: T
  label: string
}

type TabNavProps<T extends string> = {
  tabs: Array<TabItem<T>>
  activeTab: T
  onChange: (tab: T) => void
  ariaLabel: string
}

export function TabNav<T extends string>({ tabs, activeTab, onChange, ariaLabel }: TabNavProps<T>) {
  return (
    <nav className={styles.tabs} aria-label={ariaLabel}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          className={`${styles.tabButton} ${activeTab === tab.key ? styles.active : ''}`}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}

