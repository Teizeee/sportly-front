import type { GymTabKey, MembershipType, TrainerPackage } from '../../model/types'
import { gymTabs } from '../../model/gymTabs'
import styles from './GymTabPanel.module.css'

type GymTabPanelProps = {
  activeTab: GymTabKey
  membershipTypes: MembershipType[]
  trainerPackages: TrainerPackage[]
  isServicesLoading: boolean
  servicesError: string | null
}

function formatPrice(value: string): string {
  const amount = Number(value)

  if (!Number.isFinite(amount)) {
    return value
  }

  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(amount)
}

function buildPlaceholderLabel(tab: GymTabKey): string {
  return gymTabs.find((item) => item.key === tab)?.label ?? tab
}

function buildTrainerPackageTitle(packageItem: TrainerPackage): string {
  const firstName = packageItem.trainer?.user?.first_name?.trim()
  const lastName = packageItem.trainer?.user?.last_name?.trim()

  if (!firstName || !lastName) {
    return packageItem.name
  }

  return `${firstName} ${lastName[0]}. - ${packageItem.name}`
}

export function GymTabPanel({
  activeTab,
  membershipTypes,
  trainerPackages,
  isServicesLoading,
  servicesError,
}: GymTabPanelProps) {
  if (activeTab !== 'services') {
    return <p className={styles.placeholder}>Раздел «{buildPlaceholderLabel(activeTab)}» в разработке</p>
  }

  if (isServicesLoading) {
    return <p className={styles.placeholder}>Загрузка услуг...</p>
  }

  if (servicesError) {
    return <p className={styles.placeholder}>{servicesError}</p>
  }

  return (
    <div className={styles.columns}>
      <section>
        <div className={styles.sectionHeaderRow}>
          <h3 className={styles.sectionTitle}>Членства (абонементы)</h3>
          <button className={styles.addButton} type="button" disabled>
            + добавить
          </button>
        </div>

        <div className={styles.tableHeader}>
          <span>Название</span>
          <span>Цена</span>
          <span />
        </div>

        {membershipTypes.length === 0 ? <p className={styles.placeholder}>Пока нет абонементов</p> : null}

        {membershipTypes.map((membership) => (
          <div className={styles.row} key={membership.id}>
            <span className={styles.nameCell}>{membership.name}</span>
            <span className={styles.priceCell}>{formatPrice(membership.price)}</span>
            <button className={styles.editButton} type="button" disabled aria-label="Редактировать абонемент">
              ✎
            </button>
          </div>
        ))}
      </section>

      <section>
        <div className={styles.sectionHeaderRow}>
          <h3 className={styles.sectionTitle}>Пакеты с тренерами</h3>
          <button className={styles.addButton} type="button" disabled>
            + добавить
          </button>
        </div>

        <div className={styles.tableHeader}>
          <span>Название</span>
          <span>Цена</span>
          <span />
        </div>

        {trainerPackages.length === 0 ? <p className={styles.placeholder}>Пока нет пакетов</p> : null}

        {trainerPackages.map((packageItem) => (
          <div className={styles.row} key={packageItem.id}>
            <span className={styles.nameCell}>{buildTrainerPackageTitle(packageItem)}</span>
            <span className={styles.priceCell}>{formatPrice(packageItem.price)}</span>
            <button className={styles.editButton} type="button" disabled aria-label="Редактировать пакет">
              ✎
            </button>
          </div>
        ))}
      </section>
    </div>
  )
}
