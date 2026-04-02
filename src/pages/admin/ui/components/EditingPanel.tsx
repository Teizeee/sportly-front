import { useCallback, useEffect, useMemo, useState } from 'react'
import type { EditableGym, EditableUser, UserRole } from '@entities/admin'
import { API_BASE_URL } from '@shared/config/api'
import { TabNav } from '@shared/ui/tab-nav/TabNav'
import { blockGym, blockUser, fetchGyms, fetchUsersByRole, unblockGym, unblockUser, updateUserById } from '../../api/adminApi'
import styles from './EditingPanel.module.css'

type EditingTabKey = 'users' | 'trainers' | 'gymAdmins' | 'gyms'

const text = {
  users: '\u041f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u0438',
  trainers: '\u0422\u0440\u0435\u043d\u0435\u0440\u044b',
  gymAdmins: '\u0410\u0434\u043c\u0438\u043d\u044b \u0437\u0430\u043b\u043e\u0432',
  gyms: '\u0417\u0430\u043b\u044b',
  editing: '\u0420\u0435\u0434\u0430\u043a\u0442\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u0435',
  tabsAria: '\u0412\u043a\u043b\u0430\u0434\u043a\u0438 \u0440\u0435\u0434\u0430\u043a\u0442\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u044f',
  search: '\u041f\u043e\u0438\u0441\u043a',
  loadError: '\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c \u0434\u0430\u043d\u043d\u044b\u0435 \u0434\u043b\u044f \u0432\u043a\u043b\u0430\u0434\u043a\u0438',
  loading: '\u0417\u0430\u0433\u0440\u0443\u0436\u0430\u0435\u043c \u0434\u0430\u043d\u043d\u044b\u0435...',
  edit: '\u0420\u0435\u0434\u0430\u043a\u0442\u0438\u0440\u043e\u0432\u0430\u0442\u044c',
  block: '\u0417\u0430\u0431\u043b\u043e\u043a\u0438\u0440\u043e\u0432\u0430\u0442\u044c',
  unblock: '\u0420\u0430\u0437\u0431\u043b\u043e\u043a\u0438\u0440\u043e\u0432\u0430\u0442\u044c',
  empty: '\u041d\u0438\u0447\u0435\u0433\u043e \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u043e',
  userBlockTitle: '\u0412\u044b \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0442\u0435\u043b\u044c\u043d\u043e \u0445\u043e\u0442\u0438\u0442\u0435 \u0437\u0430\u0431\u043b\u043e\u043a\u0438\u0440\u043e\u0432\u0430\u0442\u044c \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044f?',
  userUnblockTitle: '\u0412\u044b \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0442\u0435\u043b\u044c\u043d\u043e \u0445\u043e\u0442\u0438\u0442\u0435 \u0440\u0430\u0437\u0431\u043b\u043e\u043a\u0438\u0440\u043e\u0432\u0430\u0442\u044c \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044f?',
  gymBlockTitle: '\u0412\u044b \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0442\u0435\u043b\u044c\u043d\u043e \u0445\u043e\u0442\u0438\u0442\u0435 \u0437\u0430\u0431\u043b\u043e\u043a\u0438\u0440\u043e\u0432\u0430\u0442\u044c \u0437\u0430\u043b?',
  gymUnblockTitle: '\u0412\u044b \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0442\u0435\u043b\u044c\u043d\u043e \u0445\u043e\u0442\u0438\u0442\u0435 \u0440\u0430\u0437\u0431\u043b\u043e\u043a\u0438\u0440\u043e\u0432\u0430\u0442\u044c \u0437\u0430\u043b?',
  blockReason: '\u041f\u0440\u0438\u0447\u0438\u043d\u0430 \u0431\u043b\u043e\u043a\u0438\u0440\u043e\u0432\u043a\u0438',
  yes: '\u0414\u0430',
  no: '\u041d\u0435\u0442',
  userBlockError: '\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0438\u0437\u043c\u0435\u043d\u0438\u0442\u044c \u0441\u0442\u0430\u0442\u0443\u0441 \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044f',
  gymBlockError: '\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0438\u0437\u043c\u0435\u043d\u0438\u0442\u044c \u0441\u0442\u0430\u0442\u0443\u0441 \u0437\u0430\u043b\u0430',
  requiredFields: '\u0417\u0430\u043f\u043e\u043b\u043d\u0438\u0442\u0435 \u043e\u0431\u044f\u0437\u0430\u0442\u0435\u043b\u044c\u043d\u044b\u0435 \u043f\u043e\u043b\u044f',
  saveError: '\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0441\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c \u0438\u0437\u043c\u0435\u043d\u0435\u043d\u0438\u044f',
  lastName: '\u0424\u0430\u043c\u0438\u043b\u0438\u044f',
  firstName: '\u0418\u043c\u044f',
  patronymic: '\u041e\u0442\u0447\u0435\u0441\u0442\u0432\u043e',
  phone: '\u041d\u043e\u043c\u0435\u0440',
  email: 'Email',
  description: '\u041e\u043f\u0438\u0441\u0430\u043d\u0438\u0435',
  password: '\u041f\u0430\u0440\u043e\u043b\u044c',
  passwordPlaceholder: '\u041e\u0441\u0442\u0430\u0432\u044c\u0442\u0435 \u043f\u0443\u0441\u0442\u044b\u043c, \u0435\u0441\u043b\u0438 \u043d\u0435 \u043d\u0443\u0436\u043d\u043e \u043c\u0435\u043d\u044f\u0442\u044c',
  save: '\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c \u0438\u0437\u043c\u0435\u043d\u0435\u043d\u0438\u044f',
}

const editingTabs: Array<{ key: EditingTabKey; label: string }> = [
  { key: 'users', label: text.users },
  { key: 'trainers', label: text.trainers },
  { key: 'gymAdmins', label: text.gymAdmins },
  { key: 'gyms', label: text.gyms },
]

const roleByTab: Record<Exclude<EditingTabKey, 'gyms'>, Exclude<UserRole, 'SUPER_ADMIN'>> = {
  users: 'CLIENT',
  trainers: 'TRAINER',
  gymAdmins: 'GYM_ADMIN',
}

function formatUserName(user: EditableUser): string {
  return [user.last_name, user.first_name, user.patronymic ?? ''].join(' ').trim()
}

function isUserBlocked(user: EditableUser): boolean {
  return user.blocked_at !== null && user.blocked_at !== undefined
}

function isGymBlocked(gym: EditableGym): boolean {
  return gym.status === 'BLOCKED'
}

function resolveAvatarBaseUrl(): string {
  return API_BASE_URL.replace(/\/api\/v1\/?$/, '/')
}

function readTrainerPassword(user: EditableUser): string {
  return typeof user.trainer_profile?.password === 'string' ? user.trainer_profile.password : ''
}

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

  const isTrainerEditing = editTarget?.role === 'TRAINER'
  const avatarUrl = editTarget ? `${resolveAvatarBaseUrl()}avatars/${editTarget.id}.jpg` : ''

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>{text.editing}</h2>

      <TabNav tabs={editingTabs} activeTab={activeTab} onChange={handleTabChange} ariaLabel={text.tabsAria} />

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

      <div className={styles.listArea}>
        {isLoading ? <p className={styles.info}>{text.loading}</p> : null}

        {!isLoading && activeTab !== 'gyms'
          ? filteredUsers.map((user) => {
              const blocked = isUserBlocked(user)
              const isPending = pendingActionId === user.id

              return (
                <div key={user.id} className={styles.item}>
                  <p className={styles.itemText}>{formatUserName(user)}</p>

                  <div className={styles.actions}>
                    <button type="button" className={styles.editButton} onClick={() => openEditModal(user)}>
                      {text.edit}
                    </button>
                    <button
                      type="button"
                      className={`${styles.blockButton} ${blocked ? styles.unblockButton : ''}`}
                      onClick={() => {
                        handleToggleUserBlock(user)
                      }}
                      disabled={isPending}
                    >
                      {blocked ? text.unblock : text.block}
                    </button>
                  </div>
                </div>
              )
            })
          : null}

        {!isLoading && activeTab === 'gyms'
          ? filteredGyms.map((gym) => {
              const blocked = isGymBlocked(gym)
              const isPending = pendingActionId === gym.id

              return (
                <div key={gym.id} className={styles.item}>
                  <p className={styles.itemText}>
                    {gym.title} - {gym.phone}
                  </p>

                  <div className={styles.actions}>
                    <button type="button" className={styles.editButton}>
                      {text.edit}
                    </button>
                    <button
                      type="button"
                      className={`${styles.blockButton} ${blocked ? styles.unblockButton : ''}`}
                      onClick={() => {
                        handleToggleGymBlock(gym)
                      }}
                      disabled={isPending}
                    >
                      {blocked ? text.unblock : text.block}
                    </button>
                  </div>
                </div>
              )
            })
          : null}

        {!isLoading && activeTab !== 'gyms' && filteredUsers.length === 0 ? <p className={styles.info}>{text.empty}</p> : null}
        {!isLoading && activeTab === 'gyms' && filteredGyms.length === 0 ? <p className={styles.info}>{text.empty}</p> : null}
      </div>

      {userActionTarget && userActionMode ? (
        <div className={styles.modalOverlay} role="presentation" onClick={closeUserActionModal}>
          <div className={styles.modalCard} role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <h3 className={styles.modalTitle}>{userActionMode === 'block' ? text.userBlockTitle : text.userUnblockTitle}</h3>

            {userActionMode === 'block' ? (
              <textarea
                className={styles.modalTextarea}
                placeholder={text.blockReason}
                value={blockComment}
                onChange={(event) => setBlockComment(event.target.value)}
                disabled={pendingActionId === userActionTarget.id}
              />
            ) : null}

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.modalButton}
                onClick={() => {
                  void submitUserAction()
                }}
                disabled={pendingActionId === userActionTarget.id || (userActionMode === 'block' && blockComment.trim().length === 0)}
              >
                {text.yes}
              </button>
              <button
                type="button"
                className={styles.modalButton}
                onClick={closeUserActionModal}
                disabled={pendingActionId === userActionTarget.id}
              >
                {text.no}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {gymActionTarget && gymActionMode ? (
        <div className={styles.modalOverlay} role="presentation" onClick={closeGymActionModal}>
          <div className={styles.modalCard} role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <h3 className={styles.modalTitle}>{gymActionMode === 'block' ? text.gymBlockTitle : text.gymUnblockTitle}</h3>

            {gymActionMode === 'block' ? (
              <textarea
                className={styles.modalTextarea}
                placeholder={text.blockReason}
                value={gymBlockComment}
                onChange={(event) => setGymBlockComment(event.target.value)}
                disabled={pendingActionId === gymActionTarget.id}
              />
            ) : null}

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.modalButton}
                onClick={() => {
                  void submitGymAction()
                }}
                disabled={pendingActionId === gymActionTarget.id || (gymActionMode === 'block' && gymBlockComment.trim().length === 0)}
              >
                {text.yes}
              </button>
              <button
                type="button"
                className={styles.modalButton}
                onClick={closeGymActionModal}
                disabled={pendingActionId === gymActionTarget.id}
              >
                {text.no}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {editTarget ? (
        <div className={styles.modalOverlay} role="presentation" onClick={closeEditModal}>
          <div className={styles.editModalCard} role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            {isTrainerEditing && isAvatarVisible ? (
              <div className={styles.avatarBox}>
                <img src={avatarUrl} alt="" className={styles.avatarImage} onError={() => setIsAvatarVisible(false)} />
              </div>
            ) : null}

            <label className={styles.editLabel}>
              {text.lastName}
              <input type="text" className={styles.editInput} value={editLastName} onChange={(event) => setEditLastName(event.target.value)} disabled={isEditSaving} />
            </label>

            <label className={styles.editLabel}>
              {text.firstName}
              <input type="text" className={styles.editInput} value={editFirstName} onChange={(event) => setEditFirstName(event.target.value)} disabled={isEditSaving} />
            </label>

            <label className={styles.editLabel}>
              {text.patronymic}
              <input type="text" className={styles.editInput} value={editPatronymic} onChange={(event) => setEditPatronymic(event.target.value)} disabled={isEditSaving} />
            </label>

            {isTrainerEditing ? (
              <label className={styles.editLabel}>
                {text.phone}
                <input type="text" className={styles.editInput} value={editPhone} onChange={(event) => setEditPhone(event.target.value)} disabled={isEditSaving} />
              </label>
            ) : null}

            <label className={styles.editLabel}>
              {text.email}
              <input type="email" className={styles.editInput} value={editEmail} onChange={(event) => setEditEmail(event.target.value)} disabled={isEditSaving} />
            </label>

            {isTrainerEditing ? (
              <label className={styles.editLabel}>
                {text.description}
                <textarea className={styles.editTextarea} value={editDescription} onChange={(event) => setEditDescription(event.target.value)} disabled={isEditSaving} />
              </label>
            ) : null}

            {isTrainerEditing ? (
              <label className={styles.editLabel}>
                {text.password}
                <input
                  type="text"
                  className={styles.editInput}
                  value={editPassword}
                  onChange={(event) => setEditPassword(event.target.value)}
                  disabled={isEditSaving}
                  placeholder={text.passwordPlaceholder}
                />
              </label>
            ) : null}

            {editError ? <p className={styles.error}>{editError}</p> : null}

            <button type="button" className={styles.saveEditButton} onClick={() => { void submitEdit() }} disabled={isEditSaving}>
              {text.save}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
