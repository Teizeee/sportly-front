import { useEscapeKey } from '@shared/lib/dom/useEscapeKey'
import type { EditingPanelText } from '../../model/editingPanel.constants'
import styles from './EditingPanel.module.css'

type UserEditModalProps = {
  isOpen: boolean
  title?: string
  isTrainerEditing: boolean
  isAvatarVisible: boolean
  avatarUrl: string
  lastName: string
  firstName: string
  patronymic: string
  phone: string
  email: string
  description: string
  password: string
  isSaving: boolean
  error: string | null
  text: EditingPanelText
  showDeleteButton?: boolean
  deleteLabel?: string
  isDeleteDisabled?: boolean
  passwordPlaceholder?: string
  onLastNameChange: (value: string) => void
  onFirstNameChange: (value: string) => void
  onPatronymicChange: (value: string) => void
  onPhoneChange: (value: string) => void
  onEmailChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onAvatarError: () => void
  onSubmit: () => void
  onDelete?: () => void
  onClose: () => void
}

export function UserEditModal({
  isOpen,
  title,
  isTrainerEditing,
  isAvatarVisible,
  avatarUrl,
  lastName,
  firstName,
  patronymic,
  phone,
  email,
  description,
  password,
  isSaving,
  error,
  text,
  showDeleteButton = false,
  deleteLabel = 'Удалить',
  isDeleteDisabled = false,
  passwordPlaceholder,
  onLastNameChange,
  onFirstNameChange,
  onPatronymicChange,
  onPhoneChange,
  onEmailChange,
  onDescriptionChange,
  onPasswordChange,
  onAvatarError,
  onSubmit,
  onDelete,
  onClose,
}: UserEditModalProps) {
  const resolvedPasswordPlaceholder = passwordPlaceholder ?? text.passwordPlaceholder
  useEscapeKey(onClose, isOpen)

  if (!isOpen) {
    return null
  }

  return (
    <div className={styles.modalOverlay} role="presentation" onClick={onClose}>
      <div className={styles.editModalCard} role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        {title ? <h3 className={styles.editModalTitle}>{title}</h3> : null}

        {isTrainerEditing && isAvatarVisible ? (
          <div className={styles.avatarBox}>
            <img src={avatarUrl} alt="" className={styles.avatarImage} onError={onAvatarError} />
          </div>
        ) : null}

        <label className={styles.editLabel}>
          {text.lastName}
          <input
            type="text"
            className={styles.editInput}
            value={lastName}
            onChange={(event) => onLastNameChange(event.target.value)}
            disabled={isSaving}
          />
        </label>

        <label className={styles.editLabel}>
          {text.firstName}
          <input
            type="text"
            className={styles.editInput}
            value={firstName}
            onChange={(event) => onFirstNameChange(event.target.value)}
            disabled={isSaving}
          />
        </label>

        <label className={styles.editLabel}>
          {text.patronymic}
          <input
            type="text"
            className={styles.editInput}
            value={patronymic}
            onChange={(event) => onPatronymicChange(event.target.value)}
            disabled={isSaving}
          />
        </label>

        {isTrainerEditing ? (
          <label className={styles.editLabel}>
            {text.phone}
            <input
              type="text"
              className={styles.editInput}
              value={phone}
              onChange={(event) => onPhoneChange(event.target.value)}
              disabled={isSaving}
            />
          </label>
        ) : null}

        <label className={styles.editLabel}>
          {text.email}
          <input
            type="email"
            className={styles.editInput}
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            disabled={isSaving}
          />
        </label>

        {isTrainerEditing ? (
          <label className={styles.editLabel}>
            {text.description}
            <textarea
              className={styles.editTextarea}
              value={description}
              onChange={(event) => onDescriptionChange(event.target.value)}
              disabled={isSaving}
            />
          </label>
        ) : null}

        {isTrainerEditing ? (
          <label className={styles.editLabel}>
            {text.password}
            <input
              type="text"
              className={styles.editInput}
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
              disabled={isSaving}
              placeholder={resolvedPasswordPlaceholder.length > 0 ? resolvedPasswordPlaceholder : undefined}
            />
          </label>
        ) : null}

        {error ? <p className={styles.error}>{error}</p> : null}

        <div className={styles.editSubmitRow}>
          <button type="button" className={styles.saveEditButton} onClick={onSubmit} disabled={isSaving}>
            {text.save}
          </button>
          {showDeleteButton ? (
            <button type="button" className={styles.deleteEditButton} onClick={onDelete} disabled={isDeleteDisabled || isSaving}>
              {deleteLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
