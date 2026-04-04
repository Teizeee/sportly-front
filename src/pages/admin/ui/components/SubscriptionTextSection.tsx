import styles from '../AdminPage.module.css'

type SubscriptionTextSectionProps = {
  text: string
  isLoading: boolean
  isSaving: boolean
  error: string | null
  success: string | null
  canSave: boolean
  onTextChange: (value: string) => void
  onOpenSaveConfirm: () => void
}

export function SubscriptionTextSection({
  text,
  isLoading,
  isSaving,
  error,
  success,
  canSave,
  onTextChange,
  onOpenSaveConfirm,
}: SubscriptionTextSectionProps) {
  return (
    <div className={styles.subscriptionContent}>
      <textarea
        className={styles.subscriptionTextarea}
        value={text}
        onChange={(event) => onTextChange(event.target.value)}
        disabled={isLoading || isSaving}
        placeholder="Введите текст подписки"
      />

      {isLoading ? <p className={styles.modalInfo}>Загружаем текст подписки...</p> : null}
      {error ? <p className={styles.modalError}>{error}</p> : null}
      {success ? <p className={styles.subscriptionSuccess}>{success}</p> : null}

      <div className={styles.subscriptionActions}>
        <button
          type="button"
          className={styles.subscriptionSaveButton}
          onClick={onOpenSaveConfirm}
          disabled={!canSave}
        >
          {isSaving ? 'Сохраняем...' : 'Сохранить'}
        </button>
      </div>
    </div>
  )
}
