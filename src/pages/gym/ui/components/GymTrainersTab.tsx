import { editingPanelText } from '@pages/admin/model/editingPanel.constants'
import { ConfirmActionModal } from '@pages/admin/ui/components/ConfirmActionModal'
import { UserEditModal } from '@pages/admin/ui/components/UserEditModal'
import type { GymTrainerListItem } from '../../model/types'
import { noop, normalizePhone, type TrainerCreateFormState } from './gymTabPanel.utils'
import styles from './GymTabPanel.module.css'

type GymTrainersTabProps = {
  trainerSearch: string
  onTrainerSearchChange: (value: string) => void
  onOpenCreateTrainerModal: () => void
  isTrainerListLoading: boolean
  trainerListError: string | null
  filteredTrainers: GymTrainerListItem[]
  onRequestDeleteTrainer: (trainer: GymTrainerListItem) => void
  onOpenEditTrainerModal: (trainer: GymTrainerListItem) => void
  deletingTrainer: GymTrainerListItem | null
  isDeletingTrainer: boolean
  trainerDeleteError: string | null
  onConfirmDeleteTrainer: () => Promise<void>
  onCloseDeleteTrainerModal: () => void
  isCreateTrainerModalOpen: boolean
  isCreatingTrainer: boolean
  trainerCreateError: string | null
  trainerCreateForm: TrainerCreateFormState
  onChangeCreateTrainerField: (field: keyof TrainerCreateFormState, value: string) => void
  onSubmitCreateTrainer: () => Promise<void>
  onCloseCreateTrainerModal: () => void
  editingTrainer: GymTrainerListItem | null
  isEditTrainerAvatarVisible: boolean
  trainerAvatarUrl: string
  editLastName: string
  editFirstName: string
  editPatronymic: string
  editPhone: string
  editEmail: string
  editDescription: string
  editPassword: string
  isEditTrainerSaving: boolean
  editTrainerError: string | null
  setEditLastName: (value: string) => void
  setEditFirstName: (value: string) => void
  setEditPatronymic: (value: string) => void
  setEditPhone: (value: string) => void
  setEditEmail: (value: string) => void
  setEditDescription: (value: string) => void
  setEditPassword: (value: string) => void
  onHideEditTrainerAvatar: () => void
  onSubmitEditTrainer: () => Promise<void>
  onDeleteFromEditModal: () => void
  onCloseEditTrainerModal: () => void
}

export function GymTrainersTab({
  trainerSearch,
  onTrainerSearchChange,
  onOpenCreateTrainerModal,
  isTrainerListLoading,
  trainerListError,
  filteredTrainers,
  onRequestDeleteTrainer,
  onOpenEditTrainerModal,
  deletingTrainer,
  isDeletingTrainer,
  trainerDeleteError,
  onConfirmDeleteTrainer,
  onCloseDeleteTrainerModal,
  isCreateTrainerModalOpen,
  isCreatingTrainer,
  trainerCreateError,
  trainerCreateForm,
  onChangeCreateTrainerField,
  onSubmitCreateTrainer,
  onCloseCreateTrainerModal,
  editingTrainer,
  isEditTrainerAvatarVisible,
  trainerAvatarUrl,
  editLastName,
  editFirstName,
  editPatronymic,
  editPhone,
  editEmail,
  editDescription,
  editPassword,
  isEditTrainerSaving,
  editTrainerError,
  setEditLastName,
  setEditFirstName,
  setEditPatronymic,
  setEditPhone,
  setEditEmail,
  setEditDescription,
  setEditPassword,
  onHideEditTrainerAvatar,
  onSubmitEditTrainer,
  onDeleteFromEditModal,
  onCloseEditTrainerModal,
}: GymTrainersTabProps) {
  return (
    <section className={styles.trainersSection}>
      <div className={styles.trainersToolbar}>
        <label className={styles.searchBox}>
          <input
            className={styles.searchInput}
            type="search"
            placeholder="Поиск"
            value={trainerSearch}
            onChange={(event) => onTrainerSearchChange(event.target.value)}
          />
        </label>

        <button className={styles.addButton} type="button" onClick={onOpenCreateTrainerModal}>
          + Добавить
        </button>
      </div>

      <div className={styles.trainersHeader}>
        <span>ФИО</span>
        <span>Номер</span>
        <span />
      </div>

      {isTrainerListLoading ? <p className={styles.placeholder}>Загрузка тренеров...</p> : null}
      {trainerListError ? <p className={styles.placeholder}>{trainerListError}</p> : null}
      {!isTrainerListLoading && !trainerListError && filteredTrainers.length === 0 ? <p className={styles.placeholder}>Тренеры не найдены</p> : null}

      {!isTrainerListLoading && !trainerListError
        ? filteredTrainers.map((trainer) => (
            <div key={trainer.user_id} className={styles.trainerRow}>
              <span className={styles.trainerName}>{trainer.full_name}</span>
              <span className={styles.trainerPhone}>{normalizePhone(trainer.phone)}</span>

              <div className={styles.trainerActions}>
                <button className={styles.deleteButton} type="button" onClick={() => onRequestDeleteTrainer(trainer)}>
                  Удалить
                </button>
                <button className={styles.editButton} type="button" onClick={() => onOpenEditTrainerModal(trainer)} aria-label="Редактировать тренера">
                  ✎
                </button>
              </div>
            </div>
          ))
        : null}

      <ConfirmActionModal
        isOpen={Boolean(deletingTrainer)}
        title="Вы действительно хотите удалить учетную запись тренера?"
        showReason={false}
        reason=""
        reasonPlaceholder=""
        isPending={isDeletingTrainer}
        isConfirmDisabled={isDeletingTrainer}
        error={trainerDeleteError}
        yesLabel="Да"
        noLabel="Нет"
        onReasonChange={noop}
        onConfirm={() => void onConfirmDeleteTrainer()}
        onClose={onCloseDeleteTrainerModal}
      />

      <UserEditModal
        isOpen={isCreateTrainerModalOpen}
        title="Создание новой учетной записи"
        isTrainerEditing
        isAvatarVisible={false}
        avatarUrl=""
        lastName={trainerCreateForm.last_name}
        firstName={trainerCreateForm.first_name}
        patronymic={trainerCreateForm.patronymic}
        phone={trainerCreateForm.phone}
        email={trainerCreateForm.email}
        description={trainerCreateForm.description}
        password={trainerCreateForm.password}
        isSaving={isCreatingTrainer}
        error={trainerCreateError}
        text={editingPanelText}
        passwordPlaceholder=""
        onLastNameChange={(value) => onChangeCreateTrainerField('last_name', value)}
        onFirstNameChange={(value) => onChangeCreateTrainerField('first_name', value)}
        onPatronymicChange={(value) => onChangeCreateTrainerField('patronymic', value)}
        onPhoneChange={(value) => onChangeCreateTrainerField('phone', value)}
        onEmailChange={(value) => onChangeCreateTrainerField('email', value)}
        onDescriptionChange={(value) => onChangeCreateTrainerField('description', value)}
        onPasswordChange={(value) => onChangeCreateTrainerField('password', value)}
        onAvatarError={noop}
        onSubmit={() => void onSubmitCreateTrainer()}
        onClose={onCloseCreateTrainerModal}
      />

      <UserEditModal
        isOpen={Boolean(editingTrainer)}
        isTrainerEditing
        isAvatarVisible={isEditTrainerAvatarVisible}
        avatarUrl={trainerAvatarUrl}
        lastName={editLastName}
        firstName={editFirstName}
        patronymic={editPatronymic}
        phone={editPhone}
        email={editEmail}
        description={editDescription}
        password={editPassword}
        isSaving={isEditTrainerSaving}
        error={editTrainerError}
        text={editingPanelText}
        showDeleteButton
        deleteLabel="Удалить"
        isDeleteDisabled={isEditTrainerSaving}
        onLastNameChange={setEditLastName}
        onFirstNameChange={setEditFirstName}
        onPatronymicChange={setEditPatronymic}
        onPhoneChange={setEditPhone}
        onEmailChange={setEditEmail}
        onDescriptionChange={setEditDescription}
        onPasswordChange={setEditPassword}
        onAvatarError={onHideEditTrainerAvatar}
        onSubmit={() => void onSubmitEditTrainer()}
        onDelete={onDeleteFromEditModal}
        onClose={onCloseEditTrainerModal}
      />
    </section>
  )
}
