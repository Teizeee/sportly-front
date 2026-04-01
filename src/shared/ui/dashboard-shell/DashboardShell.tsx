import type { ReactNode } from 'react'
import styles from './DashboardShell.module.css'

type DashboardShellProps = {
  children: ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <main className={styles.page}>
      <section className={styles.container}>{children}</section>
    </main>
  )
}

