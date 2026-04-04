import type { ReactNode } from 'react'
import { useEscapeKey } from '@shared/lib/dom/useEscapeKey'
import styles from '../AdminPage.module.css'

export type AdminModalLayer = 'base' | 'stacked'

type AdminModalProps = {
  layer: AdminModalLayer
  children: ReactNode
  onClose: () => void
  scrollable?: boolean
  cardClassName?: string
}

export function AdminModal({ layer, children, onClose, scrollable = true, cardClassName }: AdminModalProps) {
  useEscapeKey(onClose)

  return (
    <div
      className={`${styles.modalOverlay} ${layer === 'stacked' ? styles.modalOverlayStacked : ''}`}
      onClick={onClose}
      role="presentation"
    >
      <div
        className={`${styles.modalCard} ${scrollable ? styles.modalCardScrollable : styles.modalCardFloating} ${cardClassName ?? ''}`}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  )
}
