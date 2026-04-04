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
  preservePageScrollOnChange?: boolean
}

export function TabNav<T extends string>({
  tabs,
  activeTab,
  onChange,
  ariaLabel,
  preservePageScrollOnChange = false,
}: TabNavProps<T>) {
  const handleTabClick = (tab: T) => {
    if (tab === activeTab) {
      return
    }

    const previousScrollY = preservePageScrollOnChange ? window.scrollY : null
    onChange(tab)

    if (previousScrollY !== null) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.scrollTo({ top: previousScrollY, behavior: 'auto' })
        })
      })
    }
  }

  return (
    <nav className={styles.tabs} aria-label={ariaLabel}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          className={`${styles.tabButton} ${activeTab === tab.key ? styles.active : ''}`}
          onClick={() => handleTabClick(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
