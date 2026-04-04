import { useCallback, useEffect, useMemo, useState } from 'react'
import type { EditableGym, EditableUser } from '@entities/admin'
import { TabNav } from '@shared/ui/tab-nav/TabNav'
import { blockGym, blockUser, fetchGyms, fetchUsersByRole, unblockGym, unblockUser, updateGymById, updateUserById } from '../../api/adminApi'
import {
  editingPanelText as text,
  editingTabs,
  gymWorkDays,
  roleByTab,
  type EditingTabKey,
} from '../../model/editingPanel.constants'
import {
  formatUserName,
  isGymBlocked,
  isUserBlocked,
  normalizeInputTime,
  readTrainerPassword,
  resolveAvatarBaseUrl,
  toInputHour,
} from '../../model/editingPanel.utils'
import { ConfirmActionModal } from './ConfirmActionModal'
import { EditingEntitiesList } from './EditingEntitiesList'
import { GymEditModal } from './GymEditModal'
import { UserEditModal } from './UserEditModal'
import styles from './EditingPanel.module.css'

export function EditingPanel() {
  const [activeTab, setActiveTab] = useState<EditingTabKey>('users')
  const [searchTerm, setSearchTerm] = useState('')
  const [users, setUsers] = useState<EditableUser[]>([])
  const [gyms, setGyms] = useState<EditableGym[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [pendingActionId, setPendingActionId] = useState<string | null>(null)

  const [userActionTarget, setUserActionTarget] = useState<EditableUser | null>(null)
  const [userActionMode, setUserActionMode] = useState<'block' | 'unblock' | null>(null)
  const [blockComment, setBlockComment] = useState('')

  const [gymActionTarget, setGymActionTarget] = useState<EditableGym | null>(null)
  const [gymActionMode, setGymActionMode] = useState<'block' | 'unblock' | null>(null)
  const [gymBlockComment, setGymBlockComment] = useState('')

  const [editTarget, setEditTarget] = useState<EditableUser | null>(null)
  const [editLastName, setEditLastName] = useState('')
  const [editFirstName, setEditFirstName] = useState('')
  const [editPatronymic, setEditPatronymic] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [isAvatarVisible, setIsAvatarVisible] = useState(true)
  const [editError, setEditError] = useState<string | null>(null)
  const [isEditSaving, setIsEditSaving] = useState(false)

  const [editGymTarget, setEditGymTarget] = useState<EditableGym | null>(null)
  const [editGymTitle, setEditGymTitle] = useState('')
  const [editGymPhone, setEditGymPhone] = useState('')
  const [editGymAddress, setEditGymAddress] = useState('')
  const [editGymDescription, setEditGymDescription] = useState('')
  const [editGymSubscriptionUntil, setEditGymSubscriptionUntil] = useState('')
  const [editGymSchedule, setEditGymSchedule] = useState<Record<number, { id: string; open: string; close: string }>>({})
  const [isGymAvatarVisible, setIsGymAvatarVisible] = useState(true)
  const [editGymError, setEditGymError] = useState<string | null>(null)
  const [isGymEditSaving, setIsGymEditSaving] = useState(false)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setActionError(null)

    try {
      if (activeTab === 'gyms') {
        const payload = await fetchGyms()
        setGyms(payload)
        setUsers([])
      } else {
        const payload = await fetchUsersByRole(roleByTab[activeTab])
        setUsers(payload)
        setGyms([])
      }
    } catch {
      setError(text.loadError)
    } finally {
      setIsLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return users
    return users.filter((user) => formatUserName(user).toLowerCase().includes(query))
  }, [users, searchTerm])

  const filteredGyms = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return gyms
    return gyms.filter((gym) => `${gym.title} ${gym.phone}`.toLowerCase().includes(query))
  }, [gyms, searchTerm])

  const handleToggleUserBlock = (user: EditableUser) => {
    setActionError(null)
    setBlockComment('')
    setUserActionTarget(user)
    setUserActionMode(isUserBlocked(user) ? 'unblock' : 'block')
  }

  const closeUserActionModal = () => {
    if (pendingActionId) return
    setUserActionTarget(null)
    setUserActionMode(null)
    setBlockComment('')
  }

  const submitUserAction = async () => {
    if (!userActionTarget || !userActionMode) return
    if (userActionMode === 'block' && blockComment.trim().length === 0) return

    setActionError(null)
    setPendingActionId(userActionTarget.id)

    try {
      if (userActionMode === 'unblock') {
        await unblockUser(userActionTarget.id)
      } else {
        await blockUser(userActionTarget.id, blockComment.trim())
      }
      closeUserActionModal()
      await loadData()
    } catch {
      setActionError(text.userBlockError)
    } finally {
      setPendingActionId(null)
    }
  }

  const handleToggleGymBlock = (gym: EditableGym) => {
    setActionError(null)
    setGymBlockComment('')
    setGymActionTarget(gym)
    setGymActionMode(isGymBlocked(gym) ? 'unblock' : 'block')
  }

  const closeGymActionModal = () => {
    if (pendingActionId) return
    setGymActionTarget(null)
    setGymActionMode(null)
    setGymBlockComment('')
  }

  const submitGymAction = async () => {
    if (!gymActionTarget || !gymActionMode) return
    if (gymActionMode === 'block' && gymBlockComment.trim().length === 0) return

    setActionError(null)
    setPendingActionId(gymActionTarget.id)

    try {
      if (gymActionMode === 'unblock') {
        await unblockGym(gymActionTarget.id)
      } else {
        await blockGym(gymActionTarget.id, gymBlockComment.trim())
      }
      closeGymActionModal()
      await loadData()
    } catch {
      setActionError(text.gymBlockError)
    } finally {
      setPendingActionId(null)
    }
  }

  const handleTabChange = (tab: EditingTabKey) => {
    setActiveTab(tab)
    setSearchTerm('')
    setActionError(null)
  }

  const openEditModal = (user: EditableUser) => {
    setEditTarget(user)
    setEditLastName(user.last_name)
    setEditFirstName(user.first_name)
    setEditPatronymic(user.patronymic ?? '')
    setEditPhone(user.trainer_profile?.phone ?? '')
    setEditEmail(user.email)
    setEditDescription(user.trainer_profile?.description ?? '')
    setEditPassword(readTrainerPassword(user))
    setIsAvatarVisible(true)
    setEditError(null)
  }

  const closeEditModal = () => {
    if (isEditSaving) return
    setEditTarget(null)
    setEditLastName('')
    setEditFirstName('')
    setEditPatronymic('')
    setEditPhone('')
    setEditEmail('')
    setEditDescription('')
    setEditPassword('')
    setIsAvatarVisible(true)
    setEditError(null)
  }

  const openGymEditModal = (gym: EditableGym) => {
    const scheduleByDay = gymWorkDays.reduce<Record<number, { id: string; open: string; close: string }>>((accumulator, day) => {
      const scheduleItem = gym.schedule.find((item) => item.day_of_week === day.key)

      accumulator[day.key] = {
        id: scheduleItem?.id ?? `${gym.id}-${day.key}`,
        open: toInputHour(scheduleItem?.open_time ?? null),
        close: toInputHour(scheduleItem?.close_time ?? null),
      }

      return accumulator
    }, {})

    setEditGymTarget(gym)
    setEditGymTitle(gym.title)
    setEditGymPhone(gym.phone)
    setEditGymAddress(gym.address)
    setEditGymDescription(gym.description)
    setEditGymSubscriptionUntil(gym.subscription_end_date ?? '')
    setEditGymSchedule(scheduleByDay)
    setIsGymAvatarVisible(true)
    setEditGymError(null)
  }

  const closeGymEditModal = () => {
    if (isGymEditSaving) return
    setEditGymTarget(null)
    setEditGymTitle('')
    setEditGymPhone('')
    setEditGymAddress('')
    setEditGymDescription('')
    setEditGymSubscriptionUntil('')
    setEditGymSchedule({})
    setIsGymAvatarVisible(true)
    setEditGymError(null)
  }

  const updateGymScheduleField = (dayOfWeek: number, field: 'open' | 'close', value: string) => {
    setEditGymSchedule((previous) => {
      const current = previous[dayOfWeek] ?? { id: `${editGymTarget?.id ?? 'gym'}-${dayOfWeek}`, open: '', close: '' }

      return {
        ...previous,
        [dayOfWeek]: {
          ...current,
          [field]: value,
        },
      }
    })
  }

  const submitEdit = async () => {
    if (!editTarget) return
    if (editLastName.trim().length === 0 || editFirstName.trim().length === 0 || editEmail.trim().length === 0) {
      setEditError(text.requiredFields)
      return
    }

    setEditError(null)
    setIsEditSaving(true)

    try {
      const isTrainer = editTarget.role === 'TRAINER'
      const payload: Parameters<typeof updateUserById>[1] = {
        last_name: editLastName.trim(),
        first_name: editFirstName.trim(),
        patronymic: editPatronymic.trim().length > 0 ? editPatronymic.trim() : null,
        email: editEmail.trim(),
      }

      if (isTrainer) {
        payload.phone = editPhone.trim().length > 0 ? editPhone.trim() : null
        payload.description = editDescription.trim().length > 0 ? editDescription.trim() : null
        payload.password = editPassword.trim().length > 0 ? editPassword.trim() : null
      }

      await updateUserById(editTarget.id, payload)
      closeEditModal()
      await loadData()
    } catch {
      setEditError(text.saveError)
    } finally {
      setIsEditSaving(false)
    }
  }

  const submitGymEdit = async () => {
    if (!editGymTarget) return
    if (
      editGymTitle.trim().length === 0 ||
      editGymPhone.trim().length === 0 ||
      editGymAddress.trim().length === 0 ||
      editGymDescription.trim().length === 0
    ) {
      setEditGymError(text.requiredFields)
      return
    }

    if (editGymSubscriptionUntil.trim().length > 0 && Number.isNaN(Date.parse(editGymSubscriptionUntil))) {
      setEditGymError(text.invalidDate)
      return
    }

    const schedulePayload: Array<{ id: string; day_of_week: number; open_time: string | null; close_time: string | null }> = []

    for (const day of gymWorkDays) {
      const scheduleItem = editGymSchedule[day.key] ?? { id: `${editGymTarget.id}-${day.key}`, open: '', close: '' }
      const openRaw = scheduleItem.open.trim()
      const closeRaw = scheduleItem.close.trim()

      if ((openRaw.length === 0 && closeRaw.length > 0) || (openRaw.length > 0 && closeRaw.length === 0)) {
        setEditGymError(text.invalidSchedulePair)
        return
      }

      const normalizedOpen = normalizeInputTime(openRaw)
      const normalizedClose = normalizeInputTime(closeRaw)

      if ((openRaw.length > 0 && normalizedOpen === null) || (closeRaw.length > 0 && normalizedClose === null)) {
        setEditGymError(text.invalidTime)
        return
      }

      schedulePayload.push({
        id: scheduleItem.id,
        day_of_week: day.key,
        open_time: normalizedOpen,
        close_time: normalizedClose,
      })
    }

    setEditGymError(null)
    setIsGymEditSaving(true)

    try {
      await updateGymById(editGymTarget.id, {
        title: editGymTitle.trim(),
        address: editGymAddress.trim(),
        description: editGymDescription.trim(),
        phone: editGymPhone.trim(),
        schedule: schedulePayload,
        subscription: editGymSubscriptionUntil.trim().length > 0 ? { end_date: editGymSubscriptionUntil.trim() } : null,
      })

      closeGymEditModal()
      await loadData()
    } catch {
      setEditGymError(text.saveError)
    } finally {
      setIsGymEditSaving(false)
    }
  }

  const isTrainerEditing = editTarget?.role === 'TRAINER'
  const avatarUrl = editTarget ? `${resolveAvatarBaseUrl()}avatars/${editTarget.id}.jpg` : ''
  const gymAvatarUrl = editGymTarget ? `${resolveAvatarBaseUrl()}gyms/${editGymTarget.id}.jpg` : ''

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>{text.editing}</h2>

      <TabNav
        tabs={editingTabs}
        activeTab={activeTab}
        onChange={handleTabChange}
        ariaLabel={text.tabsAria}
        preservePageScrollOnChange
      />

      <div className={styles.searchRow}>
        <input
          type="search"
          className={styles.searchInput}
          placeholder={text.search}
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
        <span className={styles.searchIcon} aria-hidden="true" />
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}
      {actionError ? <p className={styles.error}>{actionError}</p> : null}

      <EditingEntitiesList
        activeTab={activeTab}
        isLoading={isLoading}
        filteredUsers={filteredUsers}
        filteredGyms={filteredGyms}
        pendingActionId={pendingActionId}
        text={text}
        onOpenEditUser={openEditModal}
        onToggleUserBlock={handleToggleUserBlock}
        onOpenEditGym={openGymEditModal}
        onToggleGymBlock={handleToggleGymBlock}
      />

      <ConfirmActionModal
        isOpen={Boolean(userActionTarget && userActionMode)}
        title={userActionMode === 'block' ? text.userBlockTitle : text.userUnblockTitle}
        showReason={userActionMode === 'block'}
        reason={blockComment}
        reasonPlaceholder={text.blockReason}
        isPending={Boolean(userActionTarget && pendingActionId === userActionTarget.id)}
        isConfirmDisabled={
          Boolean(userActionTarget && pendingActionId === userActionTarget.id) ||
          (userActionMode === 'block' && blockComment.trim().length === 0)
        }
        error={actionError}
        yesLabel={text.yes}
        noLabel={text.no}
        onReasonChange={setBlockComment}
        onConfirm={() => {
          void submitUserAction()
        }}
        onClose={closeUserActionModal}
      />

      <ConfirmActionModal
        isOpen={Boolean(gymActionTarget && gymActionMode)}
        title={gymActionMode === 'block' ? text.gymBlockTitle : text.gymUnblockTitle}
        showReason={gymActionMode === 'block'}
        reason={gymBlockComment}
        reasonPlaceholder={text.blockReason}
        isPending={Boolean(gymActionTarget && pendingActionId === gymActionTarget.id)}
        isConfirmDisabled={
          Boolean(gymActionTarget && pendingActionId === gymActionTarget.id) ||
          (gymActionMode === 'block' && gymBlockComment.trim().length === 0)
        }
        error={actionError}
        yesLabel={text.yes}
        noLabel={text.no}
        onReasonChange={setGymBlockComment}
        onConfirm={() => {
          void submitGymAction()
        }}
        onClose={closeGymActionModal}
      />

      <GymEditModal
        isOpen={Boolean(editGymTarget)}
        isAvatarVisible={isGymAvatarVisible}
        avatarUrl={gymAvatarUrl}
        title={editGymTitle}
        phone={editGymPhone}
        address={editGymAddress}
        description={editGymDescription}
        subscriptionUntil={editGymSubscriptionUntil}
        schedule={editGymSchedule}
        workDays={gymWorkDays}
        isSaving={isGymEditSaving}
        error={editGymError}
        text={text}
        onTitleChange={setEditGymTitle}
        onPhoneChange={setEditGymPhone}
        onAddressChange={setEditGymAddress}
        onDescriptionChange={setEditGymDescription}
        onSubscriptionUntilChange={setEditGymSubscriptionUntil}
        onScheduleChange={updateGymScheduleField}
        onAvatarError={() => setIsGymAvatarVisible(false)}
        onSubmit={() => {
          void submitGymEdit()
        }}
        onClose={closeGymEditModal}
      />

      <UserEditModal
        isOpen={Boolean(editTarget)}
        isTrainerEditing={isTrainerEditing}
        isAvatarVisible={isAvatarVisible}
        avatarUrl={avatarUrl}
        lastName={editLastName}
        firstName={editFirstName}
        patronymic={editPatronymic}
        phone={editPhone}
        email={editEmail}
        description={editDescription}
        password={editPassword}
        isSaving={isEditSaving}
        error={editError}
        text={text}
        onLastNameChange={setEditLastName}
        onFirstNameChange={setEditFirstName}
        onPatronymicChange={setEditPatronymic}
        onPhoneChange={setEditPhone}
        onEmailChange={setEditEmail}
        onDescriptionChange={setEditDescription}
        onPasswordChange={setEditPassword}
        onAvatarError={() => setIsAvatarVisible(false)}
        onSubmit={() => {
          void submitEdit()
        }}
        onClose={closeEditModal}
      />
    </div>
  )
}


