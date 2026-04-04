import type { EditableGym, EditableUser } from '@entities/admin'
import type { EditingPanelText, EditingTabKey } from '../../model/editingPanel.constants'
import { formatUserName, isGymBlocked, isUserBlocked } from '../../model/editingPanel.utils'
import styles from './EditingPanel.module.css'

type EditingEntitiesListProps = {
  activeTab: EditingTabKey
  isLoading: boolean
  filteredUsers: EditableUser[]
  filteredGyms: EditableGym[]
  pendingActionId: string | null
  text: EditingPanelText
  onOpenEditUser: (user: EditableUser) => void
  onToggleUserBlock: (user: EditableUser) => void
  onOpenEditGym: (gym: EditableGym) => void
  onToggleGymBlock: (gym: EditableGym) => void
}

export function EditingEntitiesList({
  activeTab,
  isLoading,
  filteredUsers,
  filteredGyms,
  pendingActionId,
  text,
  onOpenEditUser,
  onToggleUserBlock,
  onOpenEditGym,
  onToggleGymBlock,
}: EditingEntitiesListProps) {
  return (
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
                  <button type="button" className={styles.editButton} onClick={() => onOpenEditUser(user)}>
                    {text.edit}
                  </button>
                  <button
                    type="button"
                    className={`${styles.blockButton} ${blocked ? styles.unblockButton : ''}`}
                    onClick={() => onToggleUserBlock(user)}
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
                  <button type="button" className={styles.editButton} onClick={() => onOpenEditGym(gym)}>
                    {text.edit}
                  </button>
                  <button
                    type="button"
                    className={`${styles.blockButton} ${blocked ? styles.unblockButton : ''}`}
                    onClick={() => onToggleGymBlock(gym)}
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
  )
}
