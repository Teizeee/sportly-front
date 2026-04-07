import { type ChangeEvent, useRef } from 'react'
import { useEscapeKey } from '@shared/lib/dom/useEscapeKey'
import { DEFAULT_AVATAR_URL } from '@shared/lib/ui/defaultAvatar'
import type { EditingPanelText, GymWorkDay } from '../../model/editingPanel.constants'
import styles from './EditingPanel.module.css'

type GymScheduleItem = { id: string; open: string; close: string }

type GymEditModalProps = {
  isOpen: boolean
  isAvatarVisible: boolean
  avatarUrl: string
  title: string
  phone: string
  address: string
  description: string
  subscriptionUntil: string
  schedule: Record<number, GymScheduleItem>
  workDays: GymWorkDay[]
  isSaving: boolean
  isAvatarUploading: boolean
  error: string | null
  text: EditingPanelText
  onTitleChange: (value: string) => void
  onPhoneChange: (value: string) => void
  onAddressChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onSubscriptionUntilChange: (value: string) => void
  onScheduleChange: (dayOfWeek: number, field: 'open' | 'close', value: string) => void
  onAvatarError: () => void
  onAvatarFileChange: (event: ChangeEvent<HTMLInputElement>) => void
  onSubmit: () => void
  onClose: () => void
}

export function GymEditModal({
  isOpen,
  isAvatarVisible,
  avatarUrl,
  title,
  phone,
  address,
  description,
  subscriptionUntil,
  schedule,
  workDays,
  isSaving,
  isAvatarUploading,
  error,
  text,
  onTitleChange,
  onPhoneChange,
  onAddressChange,
  onDescriptionChange,
  onSubscriptionUntilChange,
  onScheduleChange,
  onAvatarError,
  onAvatarFileChange,
  onSubmit,
  onClose,
}: GymEditModalProps) {
  const resolvedAvatarUrl = isAvatarVisible && avatarUrl ? avatarUrl : DEFAULT_AVATAR_URL
  const avatarInputRef = useRef<HTMLInputElement | null>(null)
  useEscapeKey(onClose, isOpen)

  if (!isOpen) {
    return null
  }

  return (
    <div className={styles.modalOverlay} role="presentation" onClick={onClose}>
      <div className={styles.gymEditModalCard} role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className={styles.gymTopRow}>
          <div className={styles.avatarBox}>
            <button
              type="button"
              className={styles.avatarButton}
              onClick={() => avatarInputRef.current?.click()}
              disabled={isSaving || isAvatarUploading}
            >
              <img
                src={resolvedAvatarUrl}
                alt=""
                className={styles.avatarImage}
                onError={(event) => {
                  event.currentTarget.onerror = null
                  event.currentTarget.src = DEFAULT_AVATAR_URL
                  onAvatarError()
                }}
              />
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className={styles.hiddenFileInput}
                onChange={onAvatarFileChange}
                disabled={isSaving || isAvatarUploading}
                tabIndex={-1}
              />
            </button>
          </div>
        </div>

        <div className={styles.gymMetaGrid}>
          <label className={styles.editLabel}>
            {text.gymName}
            <input
              type="text"
              className={styles.editInput}
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
              disabled={isSaving}
            />
          </label>

          <label className={styles.editLabel}>
            {text.gymPhone}
            <input
              type="text"
              className={styles.editInput}
              value={phone}
              onChange={(event) => onPhoneChange(event.target.value)}
              disabled={isSaving}
            />
          </label>
        </div>

        <label className={styles.editLabel}>
          {text.address}
          <input
            type="text"
            className={styles.editInput}
            value={address}
            onChange={(event) => onAddressChange(event.target.value)}
            disabled={isSaving}
          />
        </label>

        <label className={styles.editLabel}>
          {text.gymDescription}
          <textarea
            className={styles.editTextarea}
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            disabled={isSaving}
            maxLength={text.descriptionCounterMax}
          />
          <span className={styles.descriptionCounter}>
            {description.length}/{text.descriptionCounterMax}
          </span>
        </label>

        <div className={styles.gymScheduleBlock}>
          <p className={styles.scheduleTitle}>{text.schedule}</p>
          {workDays.map((day) => (
            <div key={day.key} className={styles.scheduleRow}>
              <span className={styles.scheduleDay}>{day.label}</span>
              <input
                type="text"
                inputMode="numeric"
                className={styles.scheduleInput}
                value={schedule[day.key]?.open ?? ''}
                onChange={(event) => onScheduleChange(day.key, 'open', event.target.value)}
                disabled={isSaving}
              />
              <span className={styles.scheduleDash} aria-hidden="true">
                -
              </span>
              <input
                type="text"
                inputMode="numeric"
                className={styles.scheduleInput}
                value={schedule[day.key]?.close ?? ''}
                onChange={(event) => onScheduleChange(day.key, 'close', event.target.value)}
                disabled={isSaving}
              />
            </div>
          ))}
        </div>

        <label className={`${styles.editLabel} ${styles.subscriptionLabel}`}>
          <strong>{text.subscriptionUntil}:</strong>
          <input
            type="date"
            className={styles.editInput}
            value={subscriptionUntil}
            onChange={(event) => onSubscriptionUntilChange(event.target.value)}
            disabled={isSaving}
          />
        </label>

        {error ? <p className={styles.error}>{error}</p> : null}

        <button type="button" className={styles.saveEditButton} onClick={onSubmit} disabled={isSaving}>
          {text.save}
        </button>
      </div>
    </div>
  )
}
