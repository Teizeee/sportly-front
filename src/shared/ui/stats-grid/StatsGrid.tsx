import type { ReactNode } from 'react'
import styles from './StatsGrid.module.css'

type StatsGridItem = {
  label: string
  value: ReactNode
  hint?: ReactNode
  details?: ReactNode[]
}

type StatsGridProps = {
  items: StatsGridItem[]
}

export function StatsGrid({ items }: StatsGridProps) {
  return (
    <section className={styles.statsGrid}>
      {items.map((item) => (
        <article className={styles.statCard} key={item.label}>
          <p className={styles.statLabel}>{item.label}</p>
          <p className={styles.statValue}>{item.value}</p>
          {item.details?.length ? (
            <div className={styles.statDetails}>
              {item.details.map((detail, index) => (
                <p className={styles.statDetail} key={`${item.label}-detail-${index}`}>
                  {detail}
                </p>
              ))}
            </div>
          ) : null}
          {item.hint ? <p className={styles.statHint}>{item.hint}</p> : null}
        </article>
      ))}
    </section>
  )
}
