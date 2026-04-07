import { useEffect, useMemo, useRef, useState } from 'react'
import { editingPanelText } from '@pages/admin/model/editingPanel.constants'
import { resolveAvatarBaseUrl } from '@pages/admin/model/editingPanel.utils'
import { ConfirmActionModal } from '@pages/admin/ui/components/ConfirmActionModal'
import { UserEditModal } from '@pages/admin/ui/components/UserEditModal'
import { useClickOutside } from '@shared/lib/dom/useClickOutside'
import { useEscapeKey } from '@shared/lib/dom/useEscapeKey'
import { ApiError } from '@shared/lib/http/ApiError'
import {
  createGymTrainerUser,
  createGymMembership,
  createGymTrainerPackage,
  deleteGymMembership,
  deleteGymTrainerPackage,
  deleteGymUserAccount,
  fetchGymTrainers,
  fetchGymTrainerUsers,
  updateGymUserById,
  updateGymMembership,
  updateGymTrainerPackage,
} from '../../api/gymDashboardApi'
import { gymTabs } from '../../model/gymTabs'
import type { GymTabKey, GymTrainerListItem, GymTrainerOption, MembershipType, TrainerPackage } from '../../model/types'
import styles from './GymTabPanel.module.css'

type GymTabPanelProps = {
  activeTab: GymTabKey
  membershipTypes: MembershipType[]
  trainerPackages: TrainerPackage[]
  isServicesLoading: boolean
  servicesError: string | null
  gymId: string | null
  onMembershipCreated: () => Promise<void>
  onTrainerPackageCreated: () => Promise<void>
  onTrainerDeleted: () => Promise<void>
}

const membershipDurations = [1, 3, 6, 12] as const
const noop = () => undefined

type MembershipDuration = (typeof membershipDurations)[number]
type ModalMode = 'create' | 'edit'

type MembershipFormState = {
  name: string
  price: string
  durationMonths: MembershipDuration
  description: string
}

type TrainerPackageFormState = {
  name: string
  price: string
  sessionCount: string
  trainerId: string
  description: string
}

type TrainerCreateFormState = {
  last_name: string
  first_name: string
  patronymic: string
  phone: string
  email: string
  description: string
  password: string
}

const initialMembershipFormState: MembershipFormState = {
  name: '',
  price: '',
  durationMonths: 1,
  description: '',
}

const initialTrainerPackageFormState: TrainerPackageFormState = {
  name: '',
  price: '',
  sessionCount: '',
  trainerId: '',
  description: '',
}

const initialTrainerCreateFormState: TrainerCreateFormState = {
  last_name: '',
  first_name: '',
  patronymic: '',
  phone: '',
  email: '',
  description: '',
  password: '',
}

function normalizeDuration(months: number): MembershipDuration {
  return membershipDurations.includes(months as MembershipDuration) ? (months as MembershipDuration) : 1
}

function formatPrice(value: string): string {
  const amount = Number(value)

  if (!Number.isFinite(amount)) {
    return value
  }

  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

function buildPlaceholderLabel(tab: GymTabKey): string {
  return gymTabs.find((item) => item.key === tab)?.label ?? tab
}

function buildTrainerPackageTitle(packageItem: TrainerPackage): string {
  const firstName = packageItem.trainer?.user?.first_name?.trim()
  const lastName = packageItem.trainer?.user?.last_name?.trim()

  if (!firstName || !lastName) {
    return packageItem.name
  }

  return `${firstName} ${lastName[0]}. - ${packageItem.name}`
}

function resolveTrainerLabelForPackage(packageItem: TrainerPackage): string {
  const firstName = packageItem.trainer?.user?.first_name?.trim()
  const lastName = packageItem.trainer?.user?.last_name?.trim()

  if (firstName && lastName) {
    return `${firstName} ${lastName}`
  }

  return `Тренер ${packageItem.trainer_id.slice(0, 8)}`
}

function parsePrice(value: string): number | null {
  const normalized = value.trim().replace(',', '.')

  if (!normalized) {
    return null
  }

  const parsed = Number(normalized)

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null
  }

  return parsed
}

function parseSessionCount(value: string): number | null {
  const normalized = value.trim()

  if (!normalized) {
    return null
  }

  const parsed = Number(normalized)

  if (!Number.isInteger(parsed) || parsed < 1) {
    return null
  }

  return parsed
}

function formatDurationLabel(months: MembershipDuration): string {
  if (months === 1) {
    return '1 месяц'
  }

  if (months === 3 || months === 6) {
    return `${months} месяца`
  }

  return `${months} месяцев`
}

function normalizePhone(phone: string | null): string {
  const trimmed = phone?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : '-'
}

export function GymTabPanel({
  activeTab,
  membershipTypes,
  trainerPackages,
  isServicesLoading,
  servicesError,
  gymId,
  onMembershipCreated,
  onTrainerPackageCreated,
  onTrainerDeleted,
}: GymTabPanelProps) {
  const [membershipModalMode, setMembershipModalMode] = useState<ModalMode>('create')
  const [isMembershipModalOpen, setIsMembershipModalOpen] = useState(false)
  const [editingMembershipId, setEditingMembershipId] = useState<string | null>(null)
  const [isMembershipSubmitting, setIsMembershipSubmitting] = useState(false)
  const [isMembershipDeleting, setIsMembershipDeleting] = useState(false)
  const [membershipError, setMembershipError] = useState<string | null>(null)
  const [membershipForm, setMembershipForm] = useState<MembershipFormState>(initialMembershipFormState)
  const [isDurationDropdownOpen, setIsDurationDropdownOpen] = useState(false)
  const durationDropdownRef = useRef<HTMLDivElement | null>(null)

  const [trainerPackageModalMode, setTrainerPackageModalMode] = useState<ModalMode>('create')
  const [isTrainerPackageModalOpen, setIsTrainerPackageModalOpen] = useState(false)
  const [editingTrainerPackageId, setEditingTrainerPackageId] = useState<string | null>(null)
  const [isPackageSubmitting, setIsPackageSubmitting] = useState(false)
  const [isPackageDeleting, setIsPackageDeleting] = useState(false)
  const [isLoadingTrainers, setIsLoadingTrainers] = useState(false)
  const [trainerOptions, setTrainerOptions] = useState<GymTrainerOption[]>([])
  const [trainerPackageError, setTrainerPackageError] = useState<string | null>(null)
  const [trainerPackageForm, setTrainerPackageForm] = useState<TrainerPackageFormState>(initialTrainerPackageFormState)
  const [isTrainerDropdownOpen, setIsTrainerDropdownOpen] = useState(false)
  const trainerDropdownRef = useRef<HTMLDivElement | null>(null)

  const [trainerList, setTrainerList] = useState<GymTrainerListItem[]>([])
  const [isTrainerListLoading, setIsTrainerListLoading] = useState(false)
  const [trainerListError, setTrainerListError] = useState<string | null>(null)
  const [trainerSearch, setTrainerSearch] = useState('')
  const [deletingTrainer, setDeletingTrainer] = useState<GymTrainerListItem | null>(null)
  const [isDeletingTrainer, setIsDeletingTrainer] = useState(false)
  const [trainerDeleteError, setTrainerDeleteError] = useState<string | null>(null)
  const [editingTrainer, setEditingTrainer] = useState<GymTrainerListItem | null>(null)
  const [editLastName, setEditLastName] = useState('')
  const [editFirstName, setEditFirstName] = useState('')
  const [editPatronymic, setEditPatronymic] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [editTrainerError, setEditTrainerError] = useState<string | null>(null)
  const [isEditTrainerSaving, setIsEditTrainerSaving] = useState(false)
  const [isEditTrainerAvatarVisible, setIsEditTrainerAvatarVisible] = useState(true)
  const [isCreateTrainerModalOpen, setIsCreateTrainerModalOpen] = useState(false)
  const [isCreatingTrainer, setIsCreatingTrainer] = useState(false)
  const [trainerCreateError, setTrainerCreateError] = useState<string | null>(null)
  const [trainerCreateForm, setTrainerCreateForm] = useState<TrainerCreateFormState>(initialTrainerCreateFormState)

  const isMembershipBusy = isMembershipSubmitting || isMembershipDeleting
  const isPackageBusy = isPackageSubmitting || isPackageDeleting

  const closeMembershipModal = () => {
    if (isMembershipBusy) {
      return
    }

    setIsMembershipModalOpen(false)
    setMembershipModalMode('create')
    setEditingMembershipId(null)
    setIsDurationDropdownOpen(false)
    setMembershipError(null)
    setMembershipForm(initialMembershipFormState)
  }

  const closeTrainerPackageModal = () => {
    if (isPackageBusy) {
      return
    }

    setIsTrainerPackageModalOpen(false)
    setTrainerPackageModalMode('create')
    setEditingTrainerPackageId(null)
    setIsTrainerDropdownOpen(false)
    setIsLoadingTrainers(false)
    setTrainerOptions([])
    setTrainerPackageError(null)
    setTrainerPackageForm(initialTrainerPackageFormState)
  }

  const closeDeleteTrainerModal = () => {
    if (isDeletingTrainer) {
      return
    }

    setDeletingTrainer(null)
    setTrainerDeleteError(null)
  }

  const openEditTrainerModal = (trainer: GymTrainerListItem) => {
    setEditingTrainer(trainer)
    setEditLastName(trainer.last_name)
    setEditFirstName(trainer.first_name)
    setEditPatronymic(trainer.patronymic ?? '')
    setEditPhone(trainer.phone ?? '')
    setEditEmail(trainer.email)
    setEditDescription(trainer.description ?? '')
    setEditPassword(trainer.password ?? '')
    setIsEditTrainerAvatarVisible(true)
    setEditTrainerError(null)
  }

  const closeEditTrainerModal = () => {
    if (isEditTrainerSaving) {
      return
    }

    setEditingTrainer(null)
    setEditLastName('')
    setEditFirstName('')
    setEditPatronymic('')
    setEditPhone('')
    setEditEmail('')
    setEditDescription('')
    setEditPassword('')
    setIsEditTrainerAvatarVisible(true)
    setEditTrainerError(null)
  }

  const closeCreateTrainerModal = () => {
    if (isCreatingTrainer) {
      return
    }

    setIsCreateTrainerModalOpen(false)
    setTrainerCreateError(null)
    setTrainerCreateForm(initialTrainerCreateFormState)
  }

  const loadTrainerList = async () => {
    if (!gymId) {
      setTrainerList([])
      setTrainerListError('Не удалось определить зал для загрузки тренеров')
      return
    }

    setIsTrainerListLoading(true)
    setTrainerListError(null)

    try {
      const list = await fetchGymTrainerUsers(gymId)
      setTrainerList(list)
    } catch {
      setTrainerList([])
      setTrainerListError('Не удалось загрузить список тренеров')
    } finally {
      setIsTrainerListLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab !== 'trainers') {
      return
    }

    void loadTrainerList()
  }, [activeTab, gymId])

  useEscapeKey(() => {
    if (editingTrainer) {
      closeEditTrainerModal()
      return
    }

    if (isCreateTrainerModalOpen) {
      closeCreateTrainerModal()
      return
    }

    if (isTrainerPackageModalOpen) {
      closeTrainerPackageModal()
      return
    }

    closeMembershipModal()
  }, isMembershipModalOpen || isTrainerPackageModalOpen || isCreateTrainerModalOpen || Boolean(editingTrainer))

  useClickOutside(durationDropdownRef, () => setIsDurationDropdownOpen(false), isDurationDropdownOpen)
  useClickOutside(trainerDropdownRef, () => setIsTrainerDropdownOpen(false), isTrainerDropdownOpen)

  const handleMembershipFieldChange = (field: keyof MembershipFormState, value: string | MembershipDuration) => {
    setMembershipError(null)
    setMembershipForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleTrainerPackageFieldChange = (field: keyof TrainerPackageFormState, value: string) => {
    setTrainerPackageError(null)
    setTrainerPackageForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleCreateTrainerFieldChange = (field: keyof TrainerCreateFormState, value: string) => {
    setTrainerCreateError(null)
    setTrainerCreateForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const loadTrainerOptions = async (selectedTrainerId = '', selectedTrainerFallbackLabel = '') => {
    if (!gymId) {
      setTrainerOptions([])
      setTrainerPackageError('Не удалось определить зал для загрузки тренеров')
      return
    }

    setIsLoadingTrainers(true)

    try {
      const options = await fetchGymTrainers(gymId)
      const hasSelectedTrainer = selectedTrainerId.length > 0 && options.some((item) => item.trainer_id === selectedTrainerId)
      const mergedOptions =
        selectedTrainerId.length > 0 && !hasSelectedTrainer
          ? [{ trainer_id: selectedTrainerId, label: selectedTrainerFallbackLabel || 'Тренер' }, ...options]
          : options

      setTrainerOptions(mergedOptions)
      setTrainerPackageForm((prev) => ({
        ...prev,
        trainerId: selectedTrainerId || mergedOptions[0]?.trainer_id || '',
      }))

      if (mergedOptions.length === 0) {
        setTrainerPackageError('У этого зала нет доступных тренеров')
      }
    } catch {
      setTrainerOptions([])
      setTrainerPackageError('Не удалось загрузить список тренеров')
    } finally {
      setIsLoadingTrainers(false)
    }
  }

  const openCreateTrainerModal = () => {
    setTrainerCreateError(null)
    setTrainerCreateForm(initialTrainerCreateFormState)
    setIsCreateTrainerModalOpen(true)
  }

  const openCreateMembershipModal = () => {
    setMembershipModalMode('create')
    setEditingMembershipId(null)
    setMembershipError(null)
    setMembershipForm(initialMembershipFormState)
    setIsDurationDropdownOpen(false)
    setIsMembershipModalOpen(true)
  }

  const openEditMembershipModal = (membership: MembershipType) => {
    setMembershipModalMode('edit')
    setEditingMembershipId(membership.id)
    setMembershipError(null)
    setMembershipForm({
      name: membership.name,
      price: membership.price,
      durationMonths: normalizeDuration(membership.duration_months),
      description: membership.description,
    })
    setIsDurationDropdownOpen(false)
    setIsMembershipModalOpen(true)
  }

  const openCreateTrainerPackageModal = async () => {
    setTrainerPackageModalMode('create')
    setEditingTrainerPackageId(null)
    setTrainerPackageError(null)
    setTrainerPackageForm(initialTrainerPackageFormState)
    setIsTrainerDropdownOpen(false)
    setIsTrainerPackageModalOpen(true)
    await loadTrainerOptions()
  }

  const openEditTrainerPackageModal = async (trainerPackage: TrainerPackage) => {
    setTrainerPackageModalMode('edit')
    setEditingTrainerPackageId(trainerPackage.id)
    setTrainerPackageError(null)
    setTrainerPackageForm({
      name: trainerPackage.name,
      price: trainerPackage.price,
      sessionCount: String(trainerPackage.session_count),
      trainerId: trainerPackage.trainer_id,
      description: trainerPackage.description,
    })
    setIsTrainerDropdownOpen(false)
    setIsTrainerPackageModalOpen(true)
    await loadTrainerOptions(trainerPackage.trainer_id, resolveTrainerLabelForPackage(trainerPackage))
  }

  const submitMembership = async () => {
    const trimmedName = membershipForm.name.trim()
    const trimmedDescription = membershipForm.description.trim()
    const parsedPrice = parsePrice(membershipForm.price)

    if (!trimmedName || !trimmedDescription || parsedPrice === null || isMembershipBusy) {
      setMembershipError('Заполните все поля корректно')
      return
    }

    setMembershipError(null)
    setIsMembershipSubmitting(true)

    try {
      const payload = {
        name: trimmedName,
        description: trimmedDescription,
        price: parsedPrice,
        duration_months: membershipForm.durationMonths,
      }

      if (membershipModalMode === 'edit' && editingMembershipId) {
        await updateGymMembership(editingMembershipId, payload)
      } else {
        await createGymMembership(payload)
      }

      await onMembershipCreated()
      closeMembershipModal()
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) {
        setMembershipError('Ошибка валидации. Проверьте значения полей')
      } else {
        setMembershipError(membershipModalMode === 'edit' ? 'Не удалось сохранить абонемент' : 'Не удалось добавить абонемент')
      }
    } finally {
      setIsMembershipSubmitting(false)
    }
  }

  const removeMembership = async () => {
    if (membershipModalMode !== 'edit' || !editingMembershipId || isMembershipBusy) {
      return
    }

    setMembershipError(null)
    setIsMembershipDeleting(true)

    try {
      await deleteGymMembership(editingMembershipId)
      await onMembershipCreated()
      closeMembershipModal()
    } catch {
      setMembershipError('Не удалось удалить абонемент')
    } finally {
      setIsMembershipDeleting(false)
    }
  }

  const submitTrainerPackage = async () => {
    const trimmedName = trainerPackageForm.name.trim()
    const trimmedDescription = trainerPackageForm.description.trim()
    const parsedPrice = parsePrice(trainerPackageForm.price)
    const parsedSessionCount = parseSessionCount(trainerPackageForm.sessionCount)

    if (!trimmedName || !trimmedDescription || parsedPrice === null || parsedSessionCount === null || !trainerPackageForm.trainerId) {
      setTrainerPackageError('Заполните все поля корректно')
      return
    }

    if (isPackageBusy) {
      return
    }

    setTrainerPackageError(null)
    setIsPackageSubmitting(true)

    try {
      const payload = {
        trainer_id: trainerPackageForm.trainerId,
        name: trimmedName,
        session_count: parsedSessionCount,
        price: parsedPrice,
        description: trimmedDescription,
      }

      if (trainerPackageModalMode === 'edit' && editingTrainerPackageId) {
        await updateGymTrainerPackage(editingTrainerPackageId, payload)
      } else {
        await createGymTrainerPackage(payload)
      }

      await onTrainerPackageCreated()
      closeTrainerPackageModal()
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) {
        setTrainerPackageError('Ошибка валидации. Проверьте значения полей')
      } else {
        setTrainerPackageError(
          trainerPackageModalMode === 'edit' ? 'Не удалось сохранить пакет с тренером' : 'Не удалось добавить пакет с тренером',
        )
      }
    } finally {
      setIsPackageSubmitting(false)
    }
  }

  const removeTrainerPackage = async () => {
    if (trainerPackageModalMode !== 'edit' || !editingTrainerPackageId || isPackageBusy) {
      return
    }

    setTrainerPackageError(null)
    setIsPackageDeleting(true)

    try {
      await deleteGymTrainerPackage(editingTrainerPackageId)
      await onTrainerPackageCreated()
      closeTrainerPackageModal()
    } catch {
      setTrainerPackageError('Не удалось удалить пакет с тренером')
    } finally {
      setIsPackageDeleting(false)
    }
  }

  const confirmDeleteTrainer = async () => {
    if (!deletingTrainer || isDeletingTrainer) {
      return
    }

    setTrainerDeleteError(null)
    setIsDeletingTrainer(true)

    try {
      await deleteGymUserAccount(deletingTrainer.user_id)
      await onTrainerDeleted()
      await loadTrainerList()
      setDeletingTrainer(null)
    } catch {
      setTrainerDeleteError('Не удалось удалить учетную запись тренера')
    } finally {
      setIsDeletingTrainer(false)
    }
  }

  const submitCreateTrainer = async () => {
    if (!gymId || isCreatingTrainer) {
      return
    }

    const payload = {
      last_name: trainerCreateForm.last_name.trim(),
      first_name: trainerCreateForm.first_name.trim(),
      patronymic: trainerCreateForm.patronymic.trim(),
      phone: trainerCreateForm.phone.trim(),
      email: trainerCreateForm.email.trim(),
      description: trainerCreateForm.description.trim(),
      password: trainerCreateForm.password.trim(),
      role: 'TRAINER' as const,
      gym_id: gymId,
    }

    if (!payload.last_name || !payload.first_name || !payload.phone || !payload.email || !payload.password) {
      setTrainerCreateError('Заполните обязательные поля: фамилия, имя, номер, email, пароль')
      return
    }

    setTrainerCreateError(null)
    setIsCreatingTrainer(true)

    try {
      await createGymTrainerUser(payload)
      await onTrainerDeleted()
      await loadTrainerList()
      closeCreateTrainerModal()
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) {
        setTrainerCreateError('Ошибка валидации. Проверьте значения полей')
      } else {
        setTrainerCreateError('Не удалось создать учетную запись тренера')
      }
    } finally {
      setIsCreatingTrainer(false)
    }
  }

  const submitEditTrainer = async () => {
    if (!editingTrainer || isEditTrainerSaving) {
      return
    }

    if (editLastName.trim().length === 0 || editFirstName.trim().length === 0 || editEmail.trim().length === 0) {
      setEditTrainerError(editingPanelText.requiredFields)
      return
    }

    setEditTrainerError(null)
    setIsEditTrainerSaving(true)

    try {
      await updateGymUserById(editingTrainer.user_id, {
        last_name: editLastName.trim(),
        first_name: editFirstName.trim(),
        patronymic: editPatronymic.trim().length > 0 ? editPatronymic.trim() : null,
        email: editEmail.trim(),
        phone: editPhone.trim().length > 0 ? editPhone.trim() : null,
        description: editDescription.trim().length > 0 ? editDescription.trim() : null,
        password: editPassword.trim().length > 0 ? editPassword.trim() : null,
      })

      await onTrainerDeleted()
      await loadTrainerList()
      closeEditTrainerModal()
    } catch {
      setEditTrainerError(editingPanelText.saveError)
    } finally {
      setIsEditTrainerSaving(false)
    }
  }

  const requestDeleteFromEditModal = () => {
    if (!editingTrainer) {
      return
    }

    setDeletingTrainer(editingTrainer)
    closeEditTrainerModal()
  }

  const filteredTrainers = useMemo(() => {
    const query = trainerSearch.trim().toLowerCase()

    if (!query) {
      return trainerList
    }

    return trainerList.filter((trainer) => {
      const fullName = trainer.full_name.toLowerCase()
      const phone = normalizePhone(trainer.phone).toLowerCase()

      return fullName.includes(query) || phone.includes(query)
    })
  }, [trainerList, trainerSearch])
  const trainerAvatarUrl = editingTrainer ? `${resolveAvatarBaseUrl()}avatars/${editingTrainer.user_id}.jpg` : ''

  if (activeTab === 'trainers') {
    return (
      <section className={styles.trainersSection}>
        <div className={styles.trainersToolbar}>
          <label className={styles.searchBox}>
            <input
              className={styles.searchInput}
              type="search"
              placeholder="Поиск"
              value={trainerSearch}
              onChange={(event) => setTrainerSearch(event.target.value)}
            />
          </label>

          <button className={styles.addButton} type="button" onClick={openCreateTrainerModal}>
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
        {!isTrainerListLoading && !trainerListError && filteredTrainers.length === 0 ? (
          <p className={styles.placeholder}>Тренеры не найдены</p>
        ) : null}

        {!isTrainerListLoading && !trainerListError
          ? filteredTrainers.map((trainer) => (
              <div key={trainer.user_id} className={styles.trainerRow}>
                <span className={styles.trainerName}>{trainer.full_name}</span>
                <span className={styles.trainerPhone}>{normalizePhone(trainer.phone)}</span>

                <div className={styles.trainerActions}>
                  <button className={styles.deleteButton} type="button" onClick={() => setDeletingTrainer(trainer)}>
                    Удалить
                  </button>
                  <button className={styles.editButton} type="button" onClick={() => openEditTrainerModal(trainer)} aria-label="Редактировать тренера">
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
          onConfirm={() => void confirmDeleteTrainer()}
          onClose={closeDeleteTrainerModal}
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
          onLastNameChange={(value) => handleCreateTrainerFieldChange('last_name', value)}
          onFirstNameChange={(value) => handleCreateTrainerFieldChange('first_name', value)}
          onPatronymicChange={(value) => handleCreateTrainerFieldChange('patronymic', value)}
          onPhoneChange={(value) => handleCreateTrainerFieldChange('phone', value)}
          onEmailChange={(value) => handleCreateTrainerFieldChange('email', value)}
          onDescriptionChange={(value) => handleCreateTrainerFieldChange('description', value)}
          onPasswordChange={(value) => handleCreateTrainerFieldChange('password', value)}
          onAvatarError={noop}
          onSubmit={() => void submitCreateTrainer()}
          onClose={closeCreateTrainerModal}
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
          onAvatarError={() => setIsEditTrainerAvatarVisible(false)}
          onSubmit={() => void submitEditTrainer()}
          onDelete={requestDeleteFromEditModal}
          onClose={closeEditTrainerModal}
        />
      </section>
    )
  }

  if (activeTab !== 'services') {
    return <p className={styles.placeholder}>Раздел «{buildPlaceholderLabel(activeTab)}» в разработке</p>
  }

  if (isServicesLoading) {
    return <p className={styles.placeholder}>Загрузка услуг...</p>
  }

  if (servicesError) {
    return <p className={styles.placeholder}>{servicesError}</p>
  }

  const selectedTrainerLabel =
    trainerOptions.find((trainer) => trainer.trainer_id === trainerPackageForm.trainerId)?.label ?? 'Выберите тренера'

  return (
    <div className={styles.columns}>
      <section>
        <div className={styles.sectionHeaderRow}>
          <h3 className={styles.sectionTitle}>Членства (абонементы)</h3>
          <button className={styles.addButton} type="button" onClick={openCreateMembershipModal}>
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
            <button className={styles.editButton} type="button" aria-label="Редактировать абонемент" onClick={() => openEditMembershipModal(membership)}>
              ✎
            </button>
          </div>
        ))}
      </section>

      <section>
        <div className={styles.sectionHeaderRow}>
          <h3 className={styles.sectionTitle}>Пакеты с тренерами</h3>
          <button className={styles.addButton} type="button" onClick={() => void openCreateTrainerPackageModal()}>
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
            <button className={styles.editButton} type="button" aria-label="Редактировать пакет" onClick={() => void openEditTrainerPackageModal(packageItem)}>
              ✎
            </button>
          </div>
        ))}
      </section>

      {isMembershipModalOpen ? (
        <div className={styles.modalOverlay} onClick={closeMembershipModal} role="presentation">
          <div className={styles.modalCard} onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
            <h4 className={styles.modalTitle}>
              {membershipModalMode === 'edit' ? 'Редактирование услуги(Абонемент)' : 'Создание новой услуги(Абонемент)'}
            </h4>

            <label className={styles.modalField}>
              <span className={styles.modalLabel}>Название</span>
              <input
                className={styles.modalInput}
                value={membershipForm.name}
                onChange={(event) => handleMembershipFieldChange('name', event.target.value)}
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
                onChange={(event) => handleMembershipFieldChange('price', event.target.value)}
                disabled={isMembershipBusy}
              />
            </label>

            <label className={styles.modalField}>
              <span className={styles.modalLabel}>Продолжительность</span>
              <div className={styles.modalDropdown} ref={durationDropdownRef}>
                <button
                  type="button"
                  className={styles.modalSelectTrigger}
                  onClick={() => setIsDurationDropdownOpen((prev) => !prev)}
                  disabled={isMembershipBusy}
                >
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
                          handleMembershipFieldChange('durationMonths', months)
                          setIsDurationDropdownOpen(false)
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
                onChange={(event) => handleMembershipFieldChange('description', event.target.value)}
                disabled={isMembershipBusy}
              />
            </label>

            {membershipError ? <p className={styles.modalError}>{membershipError}</p> : null}

            <div className={styles.modalActions}>
              <button className={styles.modalSubmitButton} type="button" onClick={() => void submitMembership()} disabled={isMembershipBusy}>
                {membershipModalMode === 'edit' ? 'Сохранить' : 'Добавить'}
              </button>

              {membershipModalMode === 'edit' ? (
                <button className={styles.modalDangerButton} type="button" onClick={() => void removeMembership()} disabled={isMembershipBusy}>
                  Удалить
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {isTrainerPackageModalOpen ? (
        <div className={styles.modalOverlay} onClick={closeTrainerPackageModal} role="presentation">
          <div className={styles.modalCard} onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
            <h4 className={styles.modalTitle}>
              {trainerPackageModalMode === 'edit' ? 'Редактирование услуги(Пакет)' : 'Создание новой услуги(Пакет)'}
            </h4>

            <label className={styles.modalField}>
              <span className={styles.modalLabel}>Название</span>
              <input
                className={styles.modalInput}
                value={trainerPackageForm.name}
                onChange={(event) => handleTrainerPackageFieldChange('name', event.target.value)}
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
                onChange={(event) => handleTrainerPackageFieldChange('price', event.target.value)}
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
                onChange={(event) => handleTrainerPackageFieldChange('sessionCount', event.target.value)}
                disabled={isPackageBusy}
              />
            </label>

            <label className={styles.modalField}>
              <span className={styles.modalLabel}>Тренер</span>
              <div className={styles.modalDropdown} ref={trainerDropdownRef}>
                <button
                  type="button"
                  className={styles.modalSelectTrigger}
                  onClick={() => setIsTrainerDropdownOpen((prev) => !prev)}
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
                          handleTrainerPackageFieldChange('trainerId', trainer.trainer_id)
                          setIsTrainerDropdownOpen(false)
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
                onChange={(event) => handleTrainerPackageFieldChange('description', event.target.value)}
                disabled={isPackageBusy}
              />
            </label>

            {isLoadingTrainers ? <p className={styles.modalInfo}>Загружаем тренеров...</p> : null}
            {trainerPackageError ? <p className={styles.modalError}>{trainerPackageError}</p> : null}

            <div className={styles.modalActions}>
              <button
                className={styles.modalSubmitButton}
                type="button"
                onClick={() => void submitTrainerPackage()}
                disabled={isPackageBusy || isLoadingTrainers}
              >
                {trainerPackageModalMode === 'edit' ? 'Сохранить' : 'Добавить'}
              </button>

              {trainerPackageModalMode === 'edit' ? (
                <button
                  className={styles.modalDangerButton}
                  type="button"
                  onClick={() => void removeTrainerPackage()}
                  disabled={isPackageBusy || isLoadingTrainers}
                >
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
