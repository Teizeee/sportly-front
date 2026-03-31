import type { PropsWithChildren } from 'react'
import styles from './PageContainer.module.css'

export function PageContainer({ children }: PropsWithChildren) {
  return <div className={styles.container}>{children}</div>
}
