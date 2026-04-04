import { useEscapeKey } from '@shared/lib/dom/useEscapeKey'
import styles from './EditingPanel.module.css'

type ConfirmActionModalProps = {
  isOpen: boolean
  title: string
  showReason: boolean
  reason: string
  reasonPlaceholder: string
  isPending: boolean
  isConfirmDisabled: boolean
  error: string | null
  yesLabel: string
  noLabel: string
  onReasonChange: (value: string) => void
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmActionModal({
  isOpen,
  title,
  showReason,
  reason,
  reasonPlaceholder,
  isPending,
  isConfirmDisabled,
  error,
  yesLabel,
  noLabel,
  onReasonChange,
  onConfirm,
  onClose,
}: ConfirmActionModalProps) {
  useEscapeKey(onClose, isOpen)

  if (!isOpen) {
    return null
  }

  return (
    <div className={styles.modalOverlay} role="presentation" onClick={onClose}>
      <div className={styles.modalCard} role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <h3 className={styles.modalTitle}>{title}</h3>

        {showReason ? (
          <textarea
            className={styles.modalTextarea}
            placeholder={reasonPlaceholder}
            value={reason}
            onChange={(event) => onReasonChange(event.target.value)}
            disabled={isPending}
          />
        ) : null}

        {error ? <p className={styles.error}>{error}</p> : null}

        <div className={styles.modalActions}>
          <button type="button" className={styles.modalButton} onClick={onConfirm} disabled={isConfirmDisabled}>
            {yesLabel}
          </button>
          <button type="button" className={styles.modalButton} onClick={onClose} disabled={isPending}>
            {noLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
