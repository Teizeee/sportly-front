import type { ReactNode } from 'react'
import styles from './SectionCard.module.css'

type SectionCardProps = {
  children: ReactNode
}

export function SectionCard({ children }: SectionCardProps) {
  return <section className={styles.card}>{children}</section>
}

