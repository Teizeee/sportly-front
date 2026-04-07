import type { RefObject } from 'react'
import type { MembershipType, TrainerPackage, GymTrainerOption } from '../../model/types'
import {
  buildTrainerPackageTitle,
  formatDurationLabel,
  formatPrice,
  membershipDurations,
  type MembershipDuration,
  type MembershipFormState,
  type TrainerPackageFormState,
} from './gymTabPanel.utils'
import styles from './GymTabPanel.module.css'

type GymServicesTabProps = {
  membershipTypes: MembershipType[]
  trainerPackages: TrainerPackage[]
  onOpenCreateMembershipModal: () => void
  onOpenEditMembershipModal: (membership: MembershipType) => void
  onOpenCreateTrainerPackageModal: () => Promise<void>
  onOpenEditTrainerPackageModal: (packageItem: TrainerPackage) => Promise<void>
  isMembershipModalOpen: boolean
  onCloseMembershipModal: () => void
  membershipModalMode: 'create' | 'edit'
  membershipForm: MembershipFormState
  onMembershipFieldChange: <Key extends keyof MembershipFormState>(key: Key, value: MembershipFormState[Key]) => void
  isMembershipBusy: boolean
  isDurationDropdownOpen: boolean
  onToggleDurationDropdown: () => void
  onCloseDurationDropdown: () => void
  durationDropdownRef: RefObject<HTMLDivElement | null>
  membershipError: string | null
  onSubmitMembership: () => Promise<void>
  onRemoveMembership: () => Promise<void>
  isTrainerPackageModalOpen: boolean
  onCloseTrainerPackageModal: () => void
  trainerPackageModalMode: 'create' | 'edit'
  trainerPackageForm: TrainerPackageFormState
  onTrainerPackageFieldChange: <Key extends keyof TrainerPackageFormState>(
    key: Key,
    value: TrainerPackageFormState[Key],
  ) => void
  isPackageBusy: boolean
  trainerDropdownRef: RefObject<HTMLDivElement | null>
  isTrainerDropdownOpen: boolean
  onToggleTrainerDropdown: () => void
  onCloseTrainerDropdown: () => void
  isLoadingTrainers: boolean
  trainerOptions: GymTrainerOption[]
  selectedTrainerLabel: string
  trainerPackageError: string | null
  onSubmitTrainerPackage: () => Promise<void>
  onRemoveTrainerPackage: () => Promise<void>
}

export function GymServicesTab({
  membershipTypes,
  trainerPackages,
  onOpenCreateMembershipModal,
  onOpenEditMembershipModal,
  onOpenCreateTrainerPackageModal,
  onOpenEditTrainerPackageModal,
  isMembershipModalOpen,
  onCloseMembershipModal,
  membershipModalMode,
  membershipForm,
  onMembershipFieldChange,
  isMembershipBusy,
  isDurationDropdownOpen,
  onToggleDurationDropdown,
  onCloseDurationDropdown,
  durationDropdownRef,
  membershipError,
  onSubmitMembership,
  onRemoveMembership,
  isTrainerPackageModalOpen,
  onCloseTrainerPackageModal,
  trainerPackageModalMode,
  trainerPackageForm,
  onTrainerPackageFieldChange,
  isPackageBusy,
  trainerDropdownRef,
  isTrainerDropdownOpen,
  onToggleTrainerDropdown,
  onCloseTrainerDropdown,
  isLoadingTrainers,
  trainerOptions,
  selectedTrainerLabel,
  trainerPackageError,
  onSubmitTrainerPackage,
  onRemoveTrainerPackage,
}: GymServicesTabProps) {
  return (
    <div className={styles.columns}>
      <section>
        <div className={styles.sectionHeaderRow}>
          <h3 className={styles.sectionTitle}>Членства (абонементы)</h3>
          <button className={styles.addButton} type="button" onClick={onOpenCreateMembershipModal}>
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
            <button className={styles.editButton} type="button" aria-label="Редактировать абонемент" onClick={() => onOpenEditMembershipModal(membership)}>
              ✎
            </button>
          </div>
        ))}
      </section>

      <section>
        <div className={styles.sectionHeaderRow}>
          <h3 className={styles.sectionTitle}>Пакеты с тренерами</h3>
          <button className={styles.addButton} type="button" onClick={() => void onOpenCreateTrainerPackageModal()}>
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
            <button className={styles.editButton} type="button" aria-label="Редактировать пакет" onClick={() => void onOpenEditTrainerPackageModal(packageItem)}>
              ✎
            </button>
          </div>
        ))}
      </section>

      {isMembershipModalOpen ? (
        <div className={styles.modalOverlay} onClick={onCloseMembershipModal} role="presentation">
          <div className={styles.modalCard} onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
            <h4 className={styles.modalTitle}>
              {membershipModalMode === 'edit' ? 'Редактирование услуги(Абонемент)' : 'Создание новой услуги(Абонемент)'}
            </h4>

            <label className={styles.modalField}>
              <span className={styles.modalLabel}>Название</span>
              <input
                className={styles.modalInput}
                value={membershipForm.name}
                onChange={(event) => onMembershipFieldChange('name', event.target.value)}
                disabled={isMembershipBusy}
              />
            </label>

            <label className={styles.modalField}>
              <span className={styles.modalLabel}>Цена</span>
              <input
                className={styles.modalInput}
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={membershipForm.price}
                onChange={(event) => onMembershipFieldChange('price', event.target.value)}
                disabled={isMembershipBusy}
              />
            </label>

            <label className={styles.modalField}>
              <span className={styles.modalLabel}>Продолжительность</span>
              <div className={styles.modalDropdown} ref={durationDropdownRef}>
                <button type="button" className={styles.modalSelectTrigger} onClick={onToggleDurationDropdown} disabled={isMembershipBusy}>
                  {formatDurationLabel(membershipForm.durationMonths)}
                </button>

                {isDurationDropdownOpen ? (
                  <div className={styles.modalDropdownMenu}>
                    {membershipDurations.map((months) => (
                      <button
                        type="button"
                        key={months}
                        className={styles.modalDropdownOption}
                        onClick={() => {
                          onMembershipFieldChange('durationMonths', months as MembershipDuration)
                          onCloseDurationDropdown()
                        }}
                      >
                        {formatDurationLabel(months)}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </label>

            <label className={styles.modalField}>
              <span className={styles.modalLabel}>Описание</span>
              <textarea
                className={styles.modalTextarea}
                value={membershipForm.description}
                onChange={(event) => onMembershipFieldChange('description', event.target.value)}
                disabled={isMembershipBusy}
              />
            </label>

            {membershipError ? <p className={styles.modalError}>{membershipError}</p> : null}

            <div className={styles.modalActions}>
              <button className={styles.modalSubmitButton} type="button" onClick={() => void onSubmitMembership()} disabled={isMembershipBusy}>
                {membershipModalMode === 'edit' ? 'Сохранить' : 'Добавить'}
              </button>

              {membershipModalMode === 'edit' ? (
                <button className={styles.modalDangerButton} type="button" onClick={() => void onRemoveMembership()} disabled={isMembershipBusy}>
                  Удалить
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {isTrainerPackageModalOpen ? (
        <div className={styles.modalOverlay} onClick={onCloseTrainerPackageModal} role="presentation">
          <div className={styles.modalCard} onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
            <h4 className={styles.modalTitle}>
              {trainerPackageModalMode === 'edit' ? 'Редактирование услуги(Пакет)' : 'Создание новой услуги(Пакет)'}
            </h4>

            <label className={styles.modalField}>
              <span className={styles.modalLabel}>Название</span>
              <input
                className={styles.modalInput}
                value={trainerPackageForm.name}
                onChange={(event) => onTrainerPackageFieldChange('name', event.target.value)}
                disabled={isPackageBusy}
              />
            </label>

            <label className={styles.modalField}>
              <span className={styles.modalLabel}>Цена</span>
              <input
                className={styles.modalInput}
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={trainerPackageForm.price}
                onChange={(event) => onTrainerPackageFieldChange('price', event.target.value)}
                disabled={isPackageBusy}
              />
            </label>

            <label className={styles.modalField}>
              <span className={styles.modalLabel}>Кол-во занятий</span>
              <input
                className={styles.modalInput}
                type="number"
                inputMode="numeric"
                min="1"
                step="1"
                value={trainerPackageForm.sessionCount}
                onChange={(event) => onTrainerPackageFieldChange('sessionCount', event.target.value)}
                disabled={isPackageBusy}
              />
            </label>

            <label className={styles.modalField}>
              <span className={styles.modalLabel}>Тренер</span>
              <div className={styles.modalDropdown} ref={trainerDropdownRef}>
                <button
                  type="button"
                  className={styles.modalSelectTrigger}
                  onClick={onToggleTrainerDropdown}
                  disabled={isPackageBusy || isLoadingTrainers || trainerOptions.length === 0}
                >
                  {selectedTrainerLabel}
                </button>

                {isTrainerDropdownOpen ? (
                  <div className={styles.modalDropdownMenu}>
                    {trainerOptions.map((trainer) => (
                      <button
                        type="button"
                        key={trainer.trainer_id}
                        className={styles.modalDropdownOption}
                        onClick={() => {
                          onTrainerPackageFieldChange('trainerId', trainer.trainer_id)
                          onCloseTrainerDropdown()
                        }}
                      >
                        {trainer.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </label>

            <label className={styles.modalField}>
              <span className={styles.modalLabel}>Описание</span>
              <textarea
                className={styles.modalTextarea}
                value={trainerPackageForm.description}
                onChange={(event) => onTrainerPackageFieldChange('description', event.target.value)}
                disabled={isPackageBusy}
              />
            </label>

            {isLoadingTrainers ? <p className={styles.modalInfo}>Загружаем тренеров...</p> : null}
            {trainerPackageError ? <p className={styles.modalError}>{trainerPackageError}</p> : null}

            <div className={styles.modalActions}>
              <button className={styles.modalSubmitButton} type="button" onClick={() => void onSubmitTrainerPackage()} disabled={isPackageBusy || isLoadingTrainers}>
                {trainerPackageModalMode === 'edit' ? 'Сохранить' : 'Добавить'}
              </button>

              {trainerPackageModalMode === 'edit' ? (
                <button className={styles.modalDangerButton} type="button" onClick={() => void onRemoveTrainerPackage()} disabled={isPackageBusy || isLoadingTrainers}>
                  Удалить
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
