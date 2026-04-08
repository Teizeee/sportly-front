import type { RefObject } from 'react'
import { ConfirmActionModal } from '@pages/admin/ui/components/ConfirmActionModal'
import type { GymClientListItem, GymMembershipOption, GymPackageOption } from '../../model/types'
import { formatSessionsLeft, noop } from './gymTabPanel.utils'
import styles from './GymTabPanel.module.css'

type ClientAssignType = 'package' | 'membership'

type GymClientsTabProps = {
  activeClientsSearch: string
  onActiveClientsSearchChange: (value: string) => void
  blockedClientsSearch: string
  onBlockedClientsSearchChange: (value: string) => void
  isClientsLoading: boolean
  clientsError: string | null
  filteredActiveClients: GymClientListItem[]
  filteredBlockedClients: GymClientListItem[]
  clientActionPendingId: string | null
  onRequestToggleClientBlock: (client: GymClientListItem) => void
  clientMenuTargetId: string | null
  clientMenuRef: RefObject<HTMLDivElement | null>
  onToggleClientMenu: (userId: string) => void
  canAssignClientServices: boolean
  onOpenClientAssignModal: (client: GymClientListItem, type: ClientAssignType) => Promise<void>
  clientActionTarget: GymClientListItem | null
  clientActionMode: 'block' | 'unblock' | null
  clientActionError: string | null
  onConfirmToggleClientBlock: () => Promise<void>
  onCloseClientActionModal: () => void
  isClientAssignModalOpen: boolean
  onCloseClientAssignModal: () => void
  clientAssignType: ClientAssignType | null
  clientAssignDropdownRef: RefObject<HTMLDivElement | null>
  isClientAssignDropdownOpen: boolean
  onToggleClientAssignDropdown: () => void
  isClientAssignOptionsLoading: boolean
  isClientAssignSubmitting: boolean
  clientAssignOptions: Array<GymPackageOption | GymMembershipOption>
  selectedClientAssignLabel: string
  onSelectClientAssignOption: (id: string) => void
  selectedClientAssignOptionId: string
  clientAssignError: string | null
  onSubmitClientAssign: () => Promise<void>
}

export function GymClientsTab({
  activeClientsSearch,
  onActiveClientsSearchChange,
  blockedClientsSearch,
  onBlockedClientsSearchChange,
  isClientsLoading,
  clientsError,
  filteredActiveClients,
  filteredBlockedClients,
  clientActionPendingId,
  onRequestToggleClientBlock,
  clientMenuTargetId,
  clientMenuRef,
  onToggleClientMenu,
  canAssignClientServices,
  onOpenClientAssignModal,
  clientActionTarget,
  clientActionMode,
  clientActionError,
  onConfirmToggleClientBlock,
  onCloseClientActionModal,
  isClientAssignModalOpen,
  onCloseClientAssignModal,
  clientAssignType,
  clientAssignDropdownRef,
  isClientAssignDropdownOpen,
  onToggleClientAssignDropdown,
  isClientAssignOptionsLoading,
  isClientAssignSubmitting,
  clientAssignOptions,
  selectedClientAssignLabel,
  onSelectClientAssignOption,
  selectedClientAssignOptionId,
  clientAssignError,
  onSubmitClientAssign,
}: GymClientsTabProps) {
  return (
    <section className={styles.clientsSection}>
      <div className={styles.clientsSearchRow}>
        <label className={styles.searchBox}>
          <input
            className={styles.searchInput}
            type="search"
            placeholder="Поиск"
            value={activeClientsSearch}
            onChange={(event) => onActiveClientsSearchChange(event.target.value)}
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
                  onClick={() => onRequestToggleClientBlock(client)}
                  disabled={clientActionPendingId === client.user_id}
                >
                  Заблокировать
                </button>
                {canAssignClientServices ? <div className={styles.clientPlusWrap} ref={clientMenuTargetId === client.user_id ? clientMenuRef : undefined}>
                  <button
                    className={styles.clientPlusButton}
                    type="button"
                    aria-label="Дополнительные действия"
                    onClick={() => onToggleClientMenu(client.user_id)}
                  >
                    +
                  </button>
                  {clientMenuTargetId === client.user_id ? (
                    <div className={styles.clientPlusMenu}>
                      <button type="button" className={styles.clientPlusMenuButton} onClick={() => void onOpenClientAssignModal(client, 'package')}>
                        Пакет
                      </button>
                      <button type="button" className={styles.clientPlusMenuButton} onClick={() => void onOpenClientAssignModal(client, 'membership')}>
                        Абонемент
                      </button>
                    </div>
                  ) : null}
                </div> : null}
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
            onChange={(event) => onBlockedClientsSearchChange(event.target.value)}
          />
        </label>
      </div>

      <div className={styles.blockedClientsHeader}>
        <span>Клиент</span>
        <span />
      </div>

      {!isClientsLoading && !clientsError && filteredBlockedClients.length === 0 ? <p className={styles.placeholder}>Заблокированных клиентов нет</p> : null}

      {!isClientsLoading && !clientsError
        ? filteredBlockedClients.map((client) => (
            <div key={client.user_id} className={styles.blockedClientRow}>
              <span className={styles.clientName}>{client.full_name}</span>
              <div className={styles.clientActions}>
                <button
                  className={`${styles.blockButton} ${styles.clientUnblockButton}`}
                  type="button"
                  onClick={() => onRequestToggleClientBlock(client)}
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
        onConfirm={() => void onConfirmToggleClientBlock()}
        onClose={onCloseClientActionModal}
      />

      {isClientAssignModalOpen ? (
        <div className={styles.modalOverlay} onClick={onCloseClientAssignModal} role="presentation">
          <div className={styles.clientAssignModalCard} onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
            <h4 className={styles.clientAssignModalTitle}>{clientAssignType === 'package' ? 'Пакет' : 'Абонемент'}</h4>

            <div className={styles.clientAssignDropdown} ref={clientAssignDropdownRef}>
              <button
                type="button"
                className={styles.clientAssignSelectTrigger}
                onClick={onToggleClientAssignDropdown}
                disabled={isClientAssignOptionsLoading || isClientAssignSubmitting || clientAssignOptions.length === 0}
              >
                {selectedClientAssignLabel}
              </button>

              {isClientAssignDropdownOpen ? (
                <div className={styles.clientAssignDropdownMenu}>
                  {clientAssignOptions.map((option) => (
                    <button type="button" key={option.id} className={styles.clientAssignDropdownOption} onClick={() => onSelectClientAssignOption(option.id)}>
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
                onClick={() => void onSubmitClientAssign()}
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
