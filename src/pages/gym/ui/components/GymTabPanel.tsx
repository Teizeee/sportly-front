import { useEffect, useMemo, useRef, useState } from 'react'
import { editingPanelText } from '@pages/admin/model/editingPanel.constants'
import { resolveAvatarBaseUrl } from '@pages/admin/model/editingPanel.utils'
import { ConfirmActionModal } from '@pages/admin/ui/components/ConfirmActionModal'
import { UserEditModal } from '@pages/admin/ui/components/UserEditModal'
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
import { gymTabs } from '../../model/gymTabs'
import type {
  BookingStatus,
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
type ClientActionMode = 'block' | 'unblock'
type ClientAssignType = 'package' | 'membership'
type ClientAssignOption = GymPackageOption | GymMembershipOption
type BookingAttendanceStatus = 'VISITED' | 'NOT_VISITED'

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

function formatSessionsLeft(sessionsLeft: number | null): string {
  if (sessionsLeft === null || !Number.isFinite(sessionsLeft)) {
    return '-'
  }

  return `${sessionsLeft} занятий`
}

function formatReviewAuthor(review: GymReview): string {
  const fullName = [review.author.first_name, review.author.last_name, review.author.patronymic ?? '']
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .join(' ')

  return fullName || 'Пользователь'
}

function formatReviewDate(isoDate: string): string {
  const date = new Date(isoDate)

  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  }).format(date)
}

function clampRating(value: number): number {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.max(0, Math.min(5, Math.round(value)))
}

function getTodayDateInputValue(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function shiftDateByDays(dateValue: string, days: number): string {
  const date = new Date(`${dateValue}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return getTodayDateInputValue()
  }

  date.setDate(date.getDate() + days)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatBookingDateLabel(dateValue: string): string {
  const date = new Date(`${dateValue}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function formatSlotTimeLabel(dateTime: string): string {
  const date = new Date(dateTime)

  if (Number.isNaN(date.getTime())) {
    return '--:--'
  }

  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

function formatBookedUserName(slot: TrainerSlotAvailability): string {
  const bookedUser = slot.booked_user

  if (!bookedUser) {
    return 'Нет бронирований'
  }

  const firstName = bookedUser.first_name.trim()
  const lastInitial = bookedUser.last_name.trim().charAt(0)

  if (!firstName) {
    return 'Нет бронирований'
  }

  if (!lastInitial) {
    return firstName
  }

  return `${firstName} ${lastInitial}.`
}

function resolveBookingStatusText(status: BookingStatus): string {
  if (status === 'VISITED') {
    return 'Посетил'
  }

  if (status === 'NOT_VISITED') {
    return 'Отсутствовал'
  }

  if (status === 'CANCELLED') {
    return 'Отменено'
  }

  return ''
}

function ReviewStars({ rating }: { rating: number }) {
  const normalized = clampRating(rating)

  return (
    <span className={styles.reviewStars} aria-label={`Рейтинг ${normalized} из 5`}>
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} className={index < normalized ? styles.reviewStarFilled : styles.reviewStarEmpty} aria-hidden="true">
          ★
        </span>
      ))}
    </span>
  )
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
    if (!gymId) {
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

  if (activeTab === 'bookings') {
    return (
      <section className={styles.bookingsSection}>
        <div className={styles.bookingsToolbar}>
          <div className={styles.bookingsDateControls}>
            <button
              type="button"
              className={styles.bookingsDateNavButton}
              aria-label="Предыдущий день"
              onClick={() => setBookingDate((prev) => shiftDateByDays(prev, -1))}
              disabled={isSlotsLoading}
            >
              ←
            </button>

            <span className={styles.bookingsDateLabel}>{formatBookingDateLabel(bookingDate)}</span>

            <button
              type="button"
              className={styles.bookingsDateNavButton}
              aria-label="Следующий день"
              onClick={() => setBookingDate((prev) => shiftDateByDays(prev, 1))}
              disabled={isSlotsLoading}
            >
              →
            </button>
          </div>

          <div className={styles.bookingsTrainerDropdown} ref={bookingTrainerDropdownRef}>
            <button
              type="button"
              className={styles.bookingsTrainerTrigger}
              onClick={() => setIsBookingTrainerDropdownOpen((prev) => !prev)}
              disabled={isBookingTrainerOptionsLoading || bookingTrainerOptions.length === 0}
            >
              {selectedBookingTrainerLabel}
            </button>

            {isBookingTrainerDropdownOpen ? (
              <div className={styles.bookingsTrainerDropdownMenu}>
                {bookingTrainerOptions.map((trainer) => (
                  <button
                    type="button"
                    key={trainer.trainer_id}
                    className={styles.bookingsTrainerDropdownOption}
                    onClick={() => {
                      setSelectedBookingTrainerId(trainer.trainer_id)
                      setIsBookingTrainerDropdownOpen(false)
                    }}
                  >
                    {trainer.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {bookingTrainerOptionsError ? <p className={styles.placeholder}>{bookingTrainerOptionsError}</p> : null}
        {isSlotsLoading ? <p className={styles.placeholder}>Загрузка слотов...</p> : null}
        {slotsError ? <p className={styles.placeholder}>{slotsError}</p> : null}
        {!isSlotsLoading && !slotsError && slots.length === 0 ? <p className={styles.placeholder}>Слоты не найдены</p> : null}
        {bookingActionError ? <p className={styles.placeholder}>{bookingActionError}</p> : null}

        {!isSlotsLoading && !slotsError && slots.length > 0 ? (
          <div className={styles.bookingsList}>
            {slots.map((slot) => {
              const slotKey = slot.id ?? `${slot.trainer_id}-${slot.start_time}`
              const isCreated = slot.booking_status === 'CREATED' && Boolean(slot.booking_id)
              const isVisited = slot.booking_status === 'VISITED'
              const statusText = slot.booking_status ? resolveBookingStatusText(slot.booking_status) : ''
              const isAttendanceMenuOpen = attendanceMenuSlotId === slotKey
              const isSlotActionPending = Boolean(slot.booking_id && bookingActionPendingId === slot.booking_id)
              const bookingId = slot.booking_id

              return (
                <div key={slotKey} className={styles.bookingSlotRow}>
                  <span className={styles.bookingSlotTime}>{formatSlotTimeLabel(slot.start_time)}</span>

                  <div className={styles.bookingSlotCard}>
                    <span className={styles.bookingSlotClient}>{formatBookedUserName(slot)}</span>

                    <div className={styles.bookingSlotRight}>
                      {isCreated && bookingId ? (
                        <div className={styles.bookingSlotActions} ref={isAttendanceMenuOpen ? attendanceMenuRef : undefined}>
                          <button
                            type="button"
                            className={styles.bookingMarkButton}
                            onClick={() => setAttendanceMenuSlotId((prev) => (prev === slotKey ? null : slotKey))}
                            disabled={isSlotActionPending}
                          >
                            Отметить
                          </button>

                          {isAttendanceMenuOpen ? (
                            <div className={styles.bookingAttendanceMenu}>
                              <button
                                type="button"
                                className={styles.bookingAttendanceMenuButton}
                                onClick={() => void submitBookingAttendance(bookingId, 'VISITED')}
                                disabled={isSlotActionPending}
                              >
                                Посетил
                              </button>
                              <button
                                type="button"
                                className={styles.bookingAttendanceMenuButton}
                                onClick={() => void submitBookingAttendance(bookingId, 'NOT_VISITED')}
                                disabled={isSlotActionPending}
                              >
                                Отсутствовал
                              </button>
                            </div>
                          ) : null}

                          <button
                            type="button"
                            className={styles.bookingCancelIconButton}
                            aria-label="Отменить бронь"
                            onClick={() => requestCancelBooking(bookingId)}
                            disabled={isSlotActionPending}
                          >
                            ×
                          </button>
                        </div>
                      ) : null}

                      {!isCreated && statusText ? (
                        <span
                          className={`${styles.bookingStatusLabel} ${
                            isVisited ? styles.bookingStatusVisited : styles.bookingStatusNegative
                          }`}
                        >
                          {statusText}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : null}

        <ConfirmActionModal
          isOpen={Boolean(cancelBookingId)}
          title="Вы действительно хотите отменить бронь?"
          showReason={false}
          reason=""
          reasonPlaceholder=""
          isPending={Boolean(bookingActionPendingId)}
          isConfirmDisabled={Boolean(bookingActionPendingId)}
          error={bookingActionError}
          yesLabel="Да"
          noLabel="Нет"
          onReasonChange={noop}
          onConfirm={() => void confirmCancelBooking()}
          onClose={closeCancelBookingModal}
        />
      </section>
    )
  }

  if (activeTab === 'reviews') {
    const averageRatingLabel = averageRating === null ? '-' : averageRating.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

    return (
      <section className={styles.reviewsSection}>
        <p className={styles.reviewsRating}>Рейтинг: {averageRatingLabel}</p>

        {isReviewsLoading ? <p className={styles.placeholder}>Загрузка отзывов...</p> : null}
        {reviewsError ? <p className={styles.placeholder}>{reviewsError}</p> : null}
        {!isReviewsLoading && !reviewsError && reviews.length === 0 ? (
          <p className={styles.placeholder}>У вашего зала пока нет отзывов</p>
        ) : null}

        {!isReviewsLoading && !reviewsError
          ? reviews.map((review) => (
              <article key={review.id} className={styles.reviewCard}>
                <div className={styles.reviewTopRow}>
                  <p className={styles.reviewMeta}>
                    <strong>{formatReviewAuthor(review)}</strong> {formatReviewDate(review.created_at)}
                  </p>
                  <ReviewStars rating={review.rating} />
                </div>
                <p className={styles.reviewText}>{review.comment?.trim().length ? review.comment : 'Без комментария'}</p>
              </article>
            ))
          : null}
      </section>
    )
  }

  if (activeTab === 'clients') {
    return (
      <section className={styles.clientsSection}>
        <div className={styles.clientsSearchRow}>
          <label className={styles.searchBox}>
            <input
              className={styles.searchInput}
              type="search"
              placeholder="Поиск"
              value={activeClientsSearch}
              onChange={(event) => setActiveClientsSearch(event.target.value)}
            />
          </label>
        </div>

        <div className={styles.activeClientsHeader}>
          <span>Клиент</span>
          <span>Абонемент / Пакет</span>
          <span>Осталось занятий</span>
          <span />
        </div>

        {isClientsLoading ? <p className={styles.placeholder}>Загрузка клиентов...</p> : null}
        {clientsError ? <p className={styles.placeholder}>{clientsError}</p> : null}
        {!isClientsLoading && !clientsError && filteredActiveClients.length === 0 ? (
          <p className={styles.placeholder}>Незаблокированных клиентов не найдено</p>
        ) : null}

        {!isClientsLoading && !clientsError
          ? filteredActiveClients.map((client) => (
              <div key={client.user_id} className={styles.activeClientRow}>
                <span className={styles.clientName}>{client.full_name}</span>
                <span className={styles.clientServices}>
                  {client.active_membership_name ? <span>{client.active_membership_name}</span> : null}
                  {client.active_package_name ? <span>{client.active_package_name}</span> : null}
                  {!client.active_membership_name && !client.active_package_name ? <span>-</span> : null}
                </span>
                <span className={styles.clientSessions}>{formatSessionsLeft(client.active_package_sessions_left)}</span>
                <div className={styles.clientActions}>
                  <button
                    className={`${styles.blockButton} ${styles.clientBlockButton}`}
                    type="button"
                    onClick={() => requestToggleClientBlock(client)}
                    disabled={clientActionPendingId === client.user_id}
                  >
                    Заблокировать
                  </button>
                  <div className={styles.clientPlusWrap} ref={clientMenuTargetId === client.user_id ? clientMenuRef : undefined}>
                    <button
                      className={styles.clientPlusButton}
                      type="button"
                      aria-label="Дополнительные действия"
                      onClick={() => setClientMenuTargetId((prev) => (prev === client.user_id ? null : client.user_id))}
                    >
                      +
                    </button>
                    {clientMenuTargetId === client.user_id ? (
                      <div className={styles.clientPlusMenu}>
                        <button
                          type="button"
                          className={styles.clientPlusMenuButton}
                          onClick={() => void openClientAssignModal(client, 'package')}
                        >
                          Пакет
                        </button>
                        <button
                          type="button"
                          className={styles.clientPlusMenuButton}
                          onClick={() => void openClientAssignModal(client, 'membership')}
                        >
                          Абонемент
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ))
          : null}

        <h4 className={styles.blockedClientsTitle}>Заблокированные пользователи:</h4>

        <div className={styles.clientsSearchRow}>
          <label className={styles.searchBox}>
            <input
              className={styles.searchInput}
              type="search"
              placeholder="Поиск"
              value={blockedClientsSearch}
              onChange={(event) => setBlockedClientsSearch(event.target.value)}
            />
          </label>
        </div>

        <div className={styles.blockedClientsHeader}>
          <span>Клиент</span>
          <span />
        </div>

        {!isClientsLoading && !clientsError && filteredBlockedClients.length === 0 ? (
          <p className={styles.placeholder}>Заблокированных клиентов нет</p>
        ) : null}

        {!isClientsLoading && !clientsError
          ? filteredBlockedClients.map((client) => (
              <div key={client.user_id} className={styles.blockedClientRow}>
                <span className={styles.clientName}>{client.full_name}</span>
                <div className={styles.clientActions}>
                  <button
                    className={`${styles.blockButton} ${styles.clientUnblockButton}`}
                    type="button"
                    onClick={() => requestToggleClientBlock(client)}
                    disabled={clientActionPendingId === client.user_id}
                  >
                    Разблокировать
                  </button>
                </div>
              </div>
            ))
          : null}

        <ConfirmActionModal
          isOpen={Boolean(clientActionTarget && clientActionMode)}
          title={
            clientActionMode === 'unblock'
              ? 'Вы уверены что хотите разблокировать клиента?'
              : 'Вы уверены что хотите заблокировать клиента?'
          }
          showReason={false}
          reason=""
          reasonPlaceholder=""
          isPending={Boolean(clientActionPendingId)}
          isConfirmDisabled={Boolean(clientActionPendingId)}
          error={clientActionError}
          yesLabel="Да"
          noLabel="Нет"
          onReasonChange={noop}
          onConfirm={() => void confirmToggleClientBlock()}
          onClose={closeClientActionModal}
        />

        {isClientAssignModalOpen ? (
          <div className={styles.modalOverlay} onClick={closeClientAssignModal} role="presentation">
            <div className={styles.clientAssignModalCard} onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
              <h4 className={styles.clientAssignModalTitle}>{clientAssignType === 'package' ? 'Пакет' : 'Абонемент'}</h4>

              <div className={styles.clientAssignDropdown} ref={clientAssignDropdownRef}>
                <button
                  type="button"
                  className={styles.clientAssignSelectTrigger}
                  onClick={() => setIsClientAssignDropdownOpen((prev) => !prev)}
                  disabled={isClientAssignOptionsLoading || isClientAssignSubmitting || clientAssignOptions.length === 0}
                >
                  {selectedClientAssignLabel}
                </button>

                {isClientAssignDropdownOpen ? (
                  <div className={styles.clientAssignDropdownMenu}>
                    {clientAssignOptions.map((option) => (
                      <button
                        type="button"
                        key={option.id}
                        className={styles.clientAssignDropdownOption}
                        onClick={() => {
                          setSelectedClientAssignOptionId(option.id)
                          setIsClientAssignDropdownOpen(false)
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              {isClientAssignOptionsLoading ? (
                <p className={styles.modalInfo}>{clientAssignType === 'package' ? 'Загружаем пакеты...' : 'Загружаем абонементы...'}</p>
              ) : null}
              {clientAssignError ? <p className={styles.modalError}>{clientAssignError}</p> : null}

              <div className={styles.clientAssignActions}>
                <button
                  className={styles.clientAssignSubmitButton}
                  type="button"
                  onClick={() => void submitClientAssign()}
                  disabled={isClientAssignSubmitting || isClientAssignOptionsLoading || !selectedClientAssignOptionId}
                >
                  Добавить
                </button>
              </div>
            </div>
          </div>
        ) : null}
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
