import { useEffect, useMemo, useRef, useState } from 'react'
import { editingPanelText } from '@pages/admin/model/editingPanel.constants'
import { resolveAvatarBaseUrl } from '@pages/admin/model/editingPanel.utils'
import { useClickOutside } from '@shared/lib/dom/useClickOutside'
import { useEscapeKey } from '@shared/lib/dom/useEscapeKey'
import { ApiError } from '@shared/lib/http/ApiError'
import {
  assignClientMembership,
  assignClientTrainerPackage,
  blockGymClientUser,
  cancelBooking,
  createGymTrainerUser,
  createGymMembership,
  createGymTrainerPackage,
  deleteGymMembership,
  deleteGymTrainerPackage,
  deleteGymUserAccount,
  fetchGymClientUsers,
  fetchGymMembershipOptions,
  fetchGymPackageOptions,
  fetchGymReviews,
  fetchTrainerSlots,
  fetchGymTrainers,
  fetchGymTrainerUsers,
  markBookingAttendance,
  unblockGymClientUser,
  updateGymUserById,
  updateGymMembership,
  updateGymTrainerPackage,
} from '../../api/gymDashboardApi'
import type {
  GymClientListItem,
  GymMembershipOption,
  GymPackageOption,
  GymReview,
  GymTabKey,
  GymTrainerListItem,
  GymTrainerOption,
  MembershipType,
  TrainerSlotAvailability,
  TrainerPackage,
} from '../../model/types'
import {
  buildPlaceholderLabel,
  getTodayDateInputValue,
  initialMembershipFormState,
  initialTrainerCreateFormState,
  initialTrainerPackageFormState,
  normalizeDuration,
  normalizePhone,
  parsePrice,
  parseSessionCount,
  resolveTrainerLabelForPackage,
  type MembershipDuration,
  type MembershipFormState,
  type TrainerCreateFormState,
  type TrainerPackageFormState,
} from './gymTabPanel.utils'
import { GymBookingsTab } from './GymBookingsTab'
import { GymClientsTab } from './GymClientsTab'
import { GymReviewsTab } from './GymReviewsTab'
import { GymServicesTab } from './GymServicesTab'
import { GymTrainersTab } from './GymTrainersTab'
import styles from './GymTabPanel.module.css'

type GymTabPanelProps = {
  activeTab: GymTabKey
  membershipTypes: MembershipType[]
  trainerPackages: TrainerPackage[]
  isServicesLoading: boolean
  servicesError: string | null
  gymId: string | null
  canAssignClientServices: boolean
  onMembershipCreated: () => Promise<void>
  onTrainerPackageCreated: () => Promise<void>
  onTrainerDeleted: () => Promise<void>
}

type ModalMode = 'create' | 'edit'
type ClientActionMode = 'block' | 'unblock'
type ClientAssignType = 'package' | 'membership'
type ClientAssignOption = GymPackageOption | GymMembershipOption
type BookingAttendanceStatus = 'VISITED' | 'NOT_VISITED'

export function GymTabPanel({
  activeTab,
  membershipTypes,
  trainerPackages,
  isServicesLoading,
  servicesError,
  gymId,
  canAssignClientServices,
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
  const [reviews, setReviews] = useState<GymReview[]>([])
  const [isReviewsLoading, setIsReviewsLoading] = useState(false)
  const [reviewsError, setReviewsError] = useState<string | null>(null)
  const [clients, setClients] = useState<GymClientListItem[]>([])
  const [isClientsLoading, setIsClientsLoading] = useState(false)
  const [clientsError, setClientsError] = useState<string | null>(null)
  const [activeClientsSearch, setActiveClientsSearch] = useState('')
  const [blockedClientsSearch, setBlockedClientsSearch] = useState('')
  const [clientActionPendingId, setClientActionPendingId] = useState<string | null>(null)
  const [clientActionTarget, setClientActionTarget] = useState<GymClientListItem | null>(null)
  const [clientActionMode, setClientActionMode] = useState<ClientActionMode | null>(null)
  const [clientActionError, setClientActionError] = useState<string | null>(null)
  const [clientMenuTargetId, setClientMenuTargetId] = useState<string | null>(null)
  const clientMenuRef = useRef<HTMLDivElement | null>(null)
  const [isClientAssignModalOpen, setIsClientAssignModalOpen] = useState(false)
  const [clientAssignTarget, setClientAssignTarget] = useState<GymClientListItem | null>(null)
  const [clientAssignType, setClientAssignType] = useState<ClientAssignType | null>(null)
  const [clientAssignOptions, setClientAssignOptions] = useState<ClientAssignOption[]>([])
  const [selectedClientAssignOptionId, setSelectedClientAssignOptionId] = useState('')
  const [isClientAssignOptionsLoading, setIsClientAssignOptionsLoading] = useState(false)
  const [isClientAssignSubmitting, setIsClientAssignSubmitting] = useState(false)
  const [clientAssignError, setClientAssignError] = useState<string | null>(null)
  const [isClientAssignDropdownOpen, setIsClientAssignDropdownOpen] = useState(false)
  const clientAssignDropdownRef = useRef<HTMLDivElement | null>(null)
  const [bookingDate, setBookingDate] = useState(() => getTodayDateInputValue())
  const [bookingTrainerOptions, setBookingTrainerOptions] = useState<GymTrainerOption[]>([])
  const [isBookingTrainerOptionsLoading, setIsBookingTrainerOptionsLoading] = useState(false)
  const [bookingTrainerOptionsError, setBookingTrainerOptionsError] = useState<string | null>(null)
  const [selectedBookingTrainerId, setSelectedBookingTrainerId] = useState('')
  const [isBookingTrainerDropdownOpen, setIsBookingTrainerDropdownOpen] = useState(false)
  const bookingTrainerDropdownRef = useRef<HTMLDivElement | null>(null)
  const [slots, setSlots] = useState<TrainerSlotAvailability[]>([])
  const [isSlotsLoading, setIsSlotsLoading] = useState(false)
  const [slotsError, setSlotsError] = useState<string | null>(null)
  const [attendanceMenuSlotId, setAttendanceMenuSlotId] = useState<string | null>(null)
  const attendanceMenuRef = useRef<HTMLDivElement | null>(null)
  const [bookingActionPendingId, setBookingActionPendingId] = useState<string | null>(null)
  const [bookingActionError, setBookingActionError] = useState<string | null>(null)
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null)

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

  const closeClientActionModal = () => {
    if (clientActionPendingId) {
      return
    }

    setClientActionTarget(null)
    setClientActionMode(null)
    setClientActionError(null)
  }

  const closeCancelBookingModal = () => {
    if (bookingActionPendingId) {
      return
    }

    setCancelBookingId(null)
    setBookingActionError(null)
  }

  const closeClientAssignModal = () => {
    if (isClientAssignSubmitting) {
      return
    }

    setIsClientAssignModalOpen(false)
    setClientAssignTarget(null)
    setClientAssignType(null)
    setClientAssignOptions([])
    setSelectedClientAssignOptionId('')
    setClientAssignError(null)
    setIsClientAssignDropdownOpen(false)
    setIsClientAssignOptionsLoading(false)
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

  const loadReviews = async () => {
    if (!gymId) {
      setReviews([])
      setReviewsError('Не удалось определить зал для загрузки отзывов')
      return
    }

    setIsReviewsLoading(true)
    setReviewsError(null)

    try {
      const payload = await fetchGymReviews(gymId)
      setReviews(payload)
    } catch {
      setReviews([])
      setReviewsError('Не удалось загрузить отзывы')
    } finally {
      setIsReviewsLoading(false)
    }
  }

  const loadClients = async () => {
    if (!gymId) {
      setClients([])
      setClientsError('Не удалось определить зал для загрузки клиентов')
      return
    }

    setIsClientsLoading(true)
    setClientsError(null)

    try {
      const payload = await fetchGymClientUsers(gymId)
      setClients(payload)
    } catch {
      setClients([])
      setClientsError('Не удалось загрузить список клиентов')
    } finally {
      setIsClientsLoading(false)
    }
  }

  const loadBookingTrainerOptions = async () => {
    if (!gymId) {
      setBookingTrainerOptions([])
      setBookingTrainerOptionsError('Не удалось определить зал для загрузки тренеров')
      setSelectedBookingTrainerId('')
      return
    }

    setIsBookingTrainerOptionsLoading(true)
    setBookingTrainerOptionsError(null)

    try {
      const options = await fetchGymTrainers(gymId)
      setBookingTrainerOptions(options)
      setSelectedBookingTrainerId((prev) => {
        if (prev && options.some((item) => item.trainer_id === prev)) {
          return prev
        }

        return options[0]?.trainer_id ?? ''
      })

      if (options.length === 0) {
        setBookingTrainerOptionsError('У этого зала пока нет тренеров')
      }
    } catch {
      setBookingTrainerOptions([])
      setBookingTrainerOptionsError('Не удалось загрузить список тренеров')
      setSelectedBookingTrainerId('')
    } finally {
      setIsBookingTrainerOptionsLoading(false)
    }
  }

  const loadTrainerSlots = async (trainerId: string, date: string) => {
    if (!trainerId) {
      setSlots([])
      setSlotsError('Выберите тренера')
      return
    }

    setIsSlotsLoading(true)
    setSlotsError(null)
    setBookingActionError(null)
    setAttendanceMenuSlotId(null)

    try {
      const payload = await fetchTrainerSlots(trainerId, date)
      const sorted = [...payload].sort((left, right) => left.start_time.localeCompare(right.start_time))
      setSlots(sorted)
    } catch {
      setSlots([])
      setSlotsError('Не удалось загрузить слоты тренера')
    } finally {
      setIsSlotsLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab !== 'trainers') {
      return
    }

    void loadTrainerList()
  }, [activeTab, gymId])

  useEffect(() => {
    if (activeTab !== 'reviews') {
      return
    }

    void loadReviews()
  }, [activeTab, gymId])

  useEffect(() => {
    if (activeTab !== 'clients') {
      return
    }

    void loadClients()
  }, [activeTab, gymId])

  useEffect(() => {
    if (activeTab !== 'bookings') {
      return
    }

    void loadBookingTrainerOptions()
  }, [activeTab, gymId])

  useEffect(() => {
    if (activeTab !== 'bookings' || !selectedBookingTrainerId) {
      return
    }

    void loadTrainerSlots(selectedBookingTrainerId, bookingDate)
  }, [activeTab, selectedBookingTrainerId, bookingDate])

  useEscapeKey(() => {
    if (attendanceMenuSlotId) {
      setAttendanceMenuSlotId(null)
      return
    }

    if (cancelBookingId) {
      closeCancelBookingModal()
      return
    }

    if (isClientAssignModalOpen) {
      closeClientAssignModal()
      return
    }

    if (clientActionTarget) {
      closeClientActionModal()
      return
    }

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
  }, isMembershipModalOpen || isTrainerPackageModalOpen || isCreateTrainerModalOpen || Boolean(editingTrainer) || Boolean(clientActionTarget) || isClientAssignModalOpen || Boolean(cancelBookingId) || Boolean(attendanceMenuSlotId))

  useClickOutside(durationDropdownRef, () => setIsDurationDropdownOpen(false), isDurationDropdownOpen)
  useClickOutside(trainerDropdownRef, () => setIsTrainerDropdownOpen(false), isTrainerDropdownOpen)
  useClickOutside(clientMenuRef, () => setClientMenuTargetId(null), Boolean(clientMenuTargetId))
  useClickOutside(clientAssignDropdownRef, () => setIsClientAssignDropdownOpen(false), isClientAssignDropdownOpen)
  useClickOutside(bookingTrainerDropdownRef, () => setIsBookingTrainerDropdownOpen(false), isBookingTrainerDropdownOpen)
  useClickOutside(attendanceMenuRef, () => setAttendanceMenuSlotId(null), Boolean(attendanceMenuSlotId))

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

  const requestToggleClientBlock = (client: GymClientListItem) => {
    if (clientActionPendingId) {
      return
    }

    setClientActionTarget(client)
    setClientActionMode(client.blocked_at ? 'unblock' : 'block')
    setClientActionError(null)
  }

  const loadClientAssignOptions = async (type: ClientAssignType): Promise<ClientAssignOption[]> => {
    if (!gymId) {
      return []
    }

    if (type === 'package') {
      return fetchGymPackageOptions(gymId)
    }

    return fetchGymMembershipOptions(gymId)
  }

  const openClientAssignModal = async (client: GymClientListItem, type: ClientAssignType) => {
    if (!gymId || !canAssignClientServices) {
      return
    }

    setClientMenuTargetId(null)
    setClientAssignTarget(client)
    setClientAssignType(type)
    setClientAssignError(null)
    setClientAssignOptions([])
    setSelectedClientAssignOptionId('')
    setIsClientAssignDropdownOpen(false)
    setIsClientAssignOptionsLoading(true)
    setIsClientAssignModalOpen(true)

    try {
      const options = await loadClientAssignOptions(type)
      setClientAssignOptions(options)
      setSelectedClientAssignOptionId(options[0]?.id ?? '')
      if (options.length === 0) {
        setClientAssignError(type === 'package' ? 'Доступные пакеты не найдены' : 'Доступные абонементы не найдены')
      }
    } catch {
      setClientAssignError(type === 'package' ? 'Не удалось загрузить пакеты' : 'Не удалось загрузить абонементы')
    } finally {
      setIsClientAssignOptionsLoading(false)
    }
  }

  const confirmToggleClientBlock = async () => {
    if (!clientActionTarget || !clientActionMode || !gymId || clientActionPendingId) {
      return
    }

    setClientActionPendingId(clientActionTarget.user_id)
    setClientActionError(null)
    setClientsError(null)

    try {
      if (clientActionMode === 'unblock') {
        await unblockGymClientUser(gymId, clientActionTarget.user_id)
      } else {
        await blockGymClientUser(gymId, clientActionTarget.user_id)
      }

      await loadClients()
      closeClientActionModal()
    } catch {
      setClientActionError(clientActionMode === 'unblock' ? 'Не удалось разблокировать клиента' : 'Не удалось заблокировать клиента')
    } finally {
      setClientActionPendingId(null)
    }
  }

  const submitClientAssign = async () => {
    if (!clientAssignTarget || !clientAssignType || !selectedClientAssignOptionId || isClientAssignSubmitting) {
      return
    }

    setIsClientAssignSubmitting(true)
    setClientAssignError(null)

    try {
      if (clientAssignType === 'package') {
        await assignClientTrainerPackage(clientAssignTarget.user_id, selectedClientAssignOptionId)
      } else {
        await assignClientMembership(clientAssignTarget.user_id, selectedClientAssignOptionId)
      }

      await loadClients()
      closeClientAssignModal()
    } catch {
      setClientAssignError(clientAssignType === 'package' ? 'Не удалось добавить пакет клиенту' : 'Не удалось добавить абонемент клиенту')
    } finally {
      setIsClientAssignSubmitting(false)
    }
  }

  const submitBookingAttendance = async (bookingId: string, status: BookingAttendanceStatus) => {
    if (bookingActionPendingId) {
      return
    }

    setBookingActionPendingId(bookingId)
    setBookingActionError(null)

    try {
      await markBookingAttendance(bookingId, status)
      await loadTrainerSlots(selectedBookingTrainerId, bookingDate)
    } catch {
      setBookingActionError('Не удалось обновить статус посещения')
    } finally {
      setBookingActionPendingId(null)
    }
  }

  const requestCancelBooking = (bookingId: string) => {
    if (bookingActionPendingId) {
      return
    }

    setCancelBookingId(bookingId)
    setBookingActionError(null)
  }

  const confirmCancelBooking = async () => {
    if (!cancelBookingId || bookingActionPendingId) {
      return
    }

    setBookingActionPendingId(cancelBookingId)
    setBookingActionError(null)

    try {
      await cancelBooking(cancelBookingId)
      setCancelBookingId(null)
      await loadTrainerSlots(selectedBookingTrainerId, bookingDate)
    } catch {
      setBookingActionError('Не удалось отменить бронь')
    } finally {
      setBookingActionPendingId(null)
    }
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
  const activeClients = useMemo(() => clients.filter((client) => !client.blocked_at), [clients])
  const blockedClients = useMemo(() => clients.filter((client) => Boolean(client.blocked_at)), [clients])
  const filteredActiveClients = useMemo(() => {
    const query = activeClientsSearch.trim().toLowerCase()

    if (!query) {
      return activeClients
    }

    return activeClients.filter((client) => {
      const servicesText = [client.active_membership_name, client.active_package_name].filter(Boolean).join(' ').toLowerCase()
      return client.full_name.toLowerCase().includes(query) || servicesText.includes(query)
    })
  }, [activeClients, activeClientsSearch])
  const filteredBlockedClients = useMemo(() => {
    const query = blockedClientsSearch.trim().toLowerCase()

    if (!query) {
      return blockedClients
    }

    return blockedClients.filter((client) => client.full_name.toLowerCase().includes(query))
  }, [blockedClients, blockedClientsSearch])
  const selectedClientAssignLabel =
    clientAssignOptions.find((option) => option.id === selectedClientAssignOptionId)?.label ??
    (isClientAssignOptionsLoading
      ? 'Загрузка...'
      : clientAssignType === 'package'
        ? 'Выберите пакет'
        : clientAssignType === 'membership'
          ? 'Выберите абонемент'
          : 'Выберите услугу')
  const selectedBookingTrainerLabel =
    bookingTrainerOptions.find((trainer) => trainer.trainer_id === selectedBookingTrainerId)?.label ??
    (isBookingTrainerOptionsLoading ? 'Загрузка...' : 'Выберите тренера')
  const trainerAvatarUrl = editingTrainer ? `${resolveAvatarBaseUrl()}avatars/${editingTrainer.user_id}.jpg` : ''
  const averageRating = useMemo(() => {
    if (reviews.length === 0) {
      return null
    }

    const sum = reviews.reduce((accumulator, review) => accumulator + review.rating, 0)
    return sum / reviews.length
  }, [reviews])

  if (activeTab === 'trainers') {
    return (
      <GymTrainersTab
        trainerSearch={trainerSearch}
        onTrainerSearchChange={setTrainerSearch}
        onOpenCreateTrainerModal={openCreateTrainerModal}
        isTrainerListLoading={isTrainerListLoading}
        trainerListError={trainerListError}
        filteredTrainers={filteredTrainers}
        onRequestDeleteTrainer={setDeletingTrainer}
        onOpenEditTrainerModal={openEditTrainerModal}
        deletingTrainer={deletingTrainer}
        isDeletingTrainer={isDeletingTrainer}
        trainerDeleteError={trainerDeleteError}
        onConfirmDeleteTrainer={confirmDeleteTrainer}
        onCloseDeleteTrainerModal={closeDeleteTrainerModal}
        isCreateTrainerModalOpen={isCreateTrainerModalOpen}
        isCreatingTrainer={isCreatingTrainer}
        trainerCreateError={trainerCreateError}
        trainerCreateForm={trainerCreateForm}
        onChangeCreateTrainerField={handleCreateTrainerFieldChange}
        onSubmitCreateTrainer={submitCreateTrainer}
        onCloseCreateTrainerModal={closeCreateTrainerModal}
        editingTrainer={editingTrainer}
        isEditTrainerAvatarVisible={isEditTrainerAvatarVisible}
        trainerAvatarUrl={trainerAvatarUrl}
        editLastName={editLastName}
        editFirstName={editFirstName}
        editPatronymic={editPatronymic}
        editPhone={editPhone}
        editEmail={editEmail}
        editDescription={editDescription}
        editPassword={editPassword}
        isEditTrainerSaving={isEditTrainerSaving}
        editTrainerError={editTrainerError}
        setEditLastName={setEditLastName}
        setEditFirstName={setEditFirstName}
        setEditPatronymic={setEditPatronymic}
        setEditPhone={setEditPhone}
        setEditEmail={setEditEmail}
        setEditDescription={setEditDescription}
        setEditPassword={setEditPassword}
        onHideEditTrainerAvatar={() => setIsEditTrainerAvatarVisible(false)}
        onSubmitEditTrainer={submitEditTrainer}
        onDeleteFromEditModal={requestDeleteFromEditModal}
        onCloseEditTrainerModal={closeEditTrainerModal}
      />
    )
  }
  if (activeTab === 'bookings') {
    return (
      <GymBookingsTab
        bookingDate={bookingDate}
        onBookingDateChange={setBookingDate}
        isSlotsLoading={isSlotsLoading}
        bookingTrainerDropdownRef={bookingTrainerDropdownRef}
        isBookingTrainerOptionsLoading={isBookingTrainerOptionsLoading}
        bookingTrainerOptions={bookingTrainerOptions}
        selectedBookingTrainerLabel={selectedBookingTrainerLabel}
        isBookingTrainerDropdownOpen={isBookingTrainerDropdownOpen}
        onToggleBookingTrainerDropdown={() => setIsBookingTrainerDropdownOpen((prev) => !prev)}
        onSelectBookingTrainer={(trainerId) => {
          setSelectedBookingTrainerId(trainerId)
          setIsBookingTrainerDropdownOpen(false)
        }}
        bookingTrainerOptionsError={bookingTrainerOptionsError}
        slotsError={slotsError}
        slots={slots}
        bookingActionError={bookingActionError}
        attendanceMenuSlotId={attendanceMenuSlotId}
        attendanceMenuRef={attendanceMenuRef}
        bookingActionPendingId={bookingActionPendingId}
        onToggleAttendanceMenu={(slotKey) => setAttendanceMenuSlotId((prev) => (prev === slotKey ? null : slotKey))}
        onSubmitBookingAttendance={submitBookingAttendance}
        onRequestCancelBooking={requestCancelBooking}
        cancelBookingId={cancelBookingId}
        onConfirmCancelBooking={confirmCancelBooking}
        onCloseCancelBookingModal={closeCancelBookingModal}
      />
    )
  }

  if (activeTab === 'reviews') {
    return <GymReviewsTab averageRating={averageRating} isReviewsLoading={isReviewsLoading} reviewsError={reviewsError} reviews={reviews} />
  }

  if (activeTab === 'clients') {
    return (
      <GymClientsTab
        activeClientsSearch={activeClientsSearch}
        onActiveClientsSearchChange={setActiveClientsSearch}
        blockedClientsSearch={blockedClientsSearch}
        onBlockedClientsSearchChange={setBlockedClientsSearch}
        isClientsLoading={isClientsLoading}
        clientsError={clientsError}
        filteredActiveClients={filteredActiveClients}
        filteredBlockedClients={filteredBlockedClients}
        clientActionPendingId={clientActionPendingId}
        onRequestToggleClientBlock={requestToggleClientBlock}
        clientMenuTargetId={clientMenuTargetId}
        clientMenuRef={clientMenuRef}
        onToggleClientMenu={(userId) => setClientMenuTargetId((prev) => (prev === userId ? null : userId))}
        canAssignClientServices={canAssignClientServices}
        onOpenClientAssignModal={openClientAssignModal}
        clientActionTarget={clientActionTarget}
        clientActionMode={clientActionMode}
        clientActionError={clientActionError}
        onConfirmToggleClientBlock={confirmToggleClientBlock}
        onCloseClientActionModal={closeClientActionModal}
        isClientAssignModalOpen={isClientAssignModalOpen}
        onCloseClientAssignModal={closeClientAssignModal}
        clientAssignType={clientAssignType}
        clientAssignDropdownRef={clientAssignDropdownRef}
        isClientAssignDropdownOpen={isClientAssignDropdownOpen}
        onToggleClientAssignDropdown={() => setIsClientAssignDropdownOpen((prev) => !prev)}
        isClientAssignOptionsLoading={isClientAssignOptionsLoading}
        isClientAssignSubmitting={isClientAssignSubmitting}
        clientAssignOptions={clientAssignOptions}
        selectedClientAssignLabel={selectedClientAssignLabel}
        onSelectClientAssignOption={(id) => {
          setSelectedClientAssignOptionId(id)
          setIsClientAssignDropdownOpen(false)
        }}
        selectedClientAssignOptionId={selectedClientAssignOptionId}
        clientAssignError={clientAssignError}
        onSubmitClientAssign={submitClientAssign}
      />
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
    <GymServicesTab
      membershipTypes={membershipTypes}
      trainerPackages={trainerPackages}
      onOpenCreateMembershipModal={openCreateMembershipModal}
      onOpenEditMembershipModal={openEditMembershipModal}
      onOpenCreateTrainerPackageModal={openCreateTrainerPackageModal}
      onOpenEditTrainerPackageModal={openEditTrainerPackageModal}
      isMembershipModalOpen={isMembershipModalOpen}
      onCloseMembershipModal={closeMembershipModal}
      membershipModalMode={membershipModalMode}
      membershipForm={membershipForm}
      onMembershipFieldChange={handleMembershipFieldChange}
      isMembershipBusy={isMembershipBusy}
      isDurationDropdownOpen={isDurationDropdownOpen}
      onToggleDurationDropdown={() => setIsDurationDropdownOpen((prev) => !prev)}
      onCloseDurationDropdown={() => setIsDurationDropdownOpen(false)}
      durationDropdownRef={durationDropdownRef}
      membershipError={membershipError}
      onSubmitMembership={submitMembership}
      onRemoveMembership={removeMembership}
      isTrainerPackageModalOpen={isTrainerPackageModalOpen}
      onCloseTrainerPackageModal={closeTrainerPackageModal}
      trainerPackageModalMode={trainerPackageModalMode}
      trainerPackageForm={trainerPackageForm}
      onTrainerPackageFieldChange={handleTrainerPackageFieldChange}
      isPackageBusy={isPackageBusy}
      trainerDropdownRef={trainerDropdownRef}
      isTrainerDropdownOpen={isTrainerDropdownOpen}
      onToggleTrainerDropdown={() => setIsTrainerDropdownOpen((prev) => !prev)}
      onCloseTrainerDropdown={() => setIsTrainerDropdownOpen(false)}
      isLoadingTrainers={isLoadingTrainers}
      trainerOptions={trainerOptions}
      selectedTrainerLabel={selectedTrainerLabel}
      trainerPackageError={trainerPackageError}
      onSubmitTrainerPackage={submitTrainerPackage}
      onRemoveTrainerPackage={removeTrainerPackage}
    />
  )
}
