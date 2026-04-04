import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { GymApplication, PlatformSubscription } from '@entities/admin'
import { clearAccessToken } from '@shared/lib/auth/tokenStorage'
import { useClickOutside } from '@shared/lib/dom/useClickOutside'
import { DashboardHeader } from '@shared/ui/dashboard-header/DashboardHeader'
import { DashboardShell } from '@shared/ui/dashboard-shell/DashboardShell'
import { SectionCard } from '@shared/ui/section-card/SectionCard'
import { StatsGrid } from '@shared/ui/stats-grid/StatsGrid'
import { TabNav } from '@shared/ui/tab-nav/TabNav'
import {
  approveApplication,
  fetchApplicationById,
  fetchPlatformSubscriptions,
  fetchSubscriptionText,
  rejectApplication,
  updateSubscriptionText,
} from '../api/adminApi'
import { adminTabs } from '../model/adminTabs'
import { buildAdminStatsItems } from '../model/adminStatsItems'
import type { TabKey } from '../model/types'
import { useAdminDashboard } from '../model/useAdminDashboard'
import { AdminApplicationsSection } from './components/AdminApplicationsSection'
import { AdminModal } from './components/AdminModal'
import { EditingPanel } from './components/EditingPanel'
import { ReviewsPanel } from './components/ReviewsPanel'
import { SubscriptionTextSection } from './components/SubscriptionTextSection'
import styles from './AdminPage.module.css'

export function AdminPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabKey>('applications')
  const { stats, applications, isLoading, error, refresh } = useAdminDashboard()

  const [detailsApplication, setDetailsApplication] = useState<GymApplication | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)

  const [approveTarget, setApproveTarget] = useState<GymApplication | null>(null)
  const [subscriptions, setSubscriptions] = useState<PlatformSubscription[]>([])
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(false)
  const [subscriptionsError, setSubscriptionsError] = useState<string | null>(null)
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState('')
  const [isSubscriptionDropdownOpen, setIsSubscriptionDropdownOpen] = useState(false)
  const subscriptionDropdownRef = useRef<HTMLDivElement | null>(null)

  const [rejectTarget, setRejectTarget] = useState<GymApplication | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const [actionPending, setActionPending] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [subscriptionTextId, setSubscriptionTextId] = useState('')
  const [subscriptionTextDraft, setSubscriptionTextDraft] = useState('')
  const [subscriptionTextLoading, setSubscriptionTextLoading] = useState(false)
  const [subscriptionTextSaving, setSubscriptionTextSaving] = useState(false)
  const [subscriptionTextError, setSubscriptionTextError] = useState<string | null>(null)
  const [subscriptionTextSuccess, setSubscriptionTextSuccess] = useState<string | null>(null)
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false)

  const handleLogout = () => {
    clearAccessToken()
    navigate('/login', { replace: true })
  }

  const closeDetailsModal = () => {
    setDetailsApplication(null)
    setDetailsError(null)
    setActionError(null)
  }

  const closeApproveModal = () => {
    setApproveTarget(null)
    setSelectedSubscriptionId('')
    setIsSubscriptionDropdownOpen(false)
    setSubscriptionsError(null)
    setActionError(null)
  }

  const closeRejectModal = () => {
    setRejectTarget(null)
    setRejectReason('')
    setActionError(null)
  }

  const closeAllModals = () => {
    closeRejectModal()
    closeApproveModal()
    closeDetailsModal()
  }

  const loadSubscriptions = async () => {
    setSubscriptionsLoading(true)
    setSubscriptionsError(null)

    try {
      const payload = await fetchPlatformSubscriptions()
      setSubscriptions(payload)

      if (payload.length > 0) {
        setSelectedSubscriptionId(payload[0].id)
      }
    } catch {
      setSubscriptionsError('Не удалось загрузить подписки')
    } finally {
      setSubscriptionsLoading(false)
    }
  }

  const openDetailsModal = async (application: GymApplication) => {
    setDetailsApplication(application)
    setDetailsLoading(true)
    setDetailsError(null)

    try {
      const freshApplication = await fetchApplicationById(application.id)

      if (freshApplication) {
        setDetailsApplication(freshApplication)
      }
    } catch {
      setDetailsError('Не удалось загрузить подробности заявки')
    } finally {
      setDetailsLoading(false)
    }
  }

  const openApproveModal = async (application: GymApplication) => {
    setApproveTarget(application)
    setSelectedSubscriptionId('')
    setIsSubscriptionDropdownOpen(false)
    setActionError(null)
    await loadSubscriptions()
  }

  const closeSubscriptionDropdown = useCallback(() => {
    setIsSubscriptionDropdownOpen(false)
  }, [])

  useClickOutside(subscriptionDropdownRef, closeSubscriptionDropdown, isSubscriptionDropdownOpen)

  const openRejectModal = (application: GymApplication) => {
    setRejectTarget(application)
    setRejectReason('')
    setActionError(null)
  }

  const loadSubscriptionText = async () => {
    setSubscriptionTextLoading(true)
    setSubscriptionTextError(null)
    setSubscriptionTextSuccess(null)

    try {
      const payload = await fetchSubscriptionText()

      if (!payload) {
        setSubscriptionTextError('Не удалось загрузить текст подписки')
        return
      }

      setSubscriptionTextId(payload.id)
      setSubscriptionTextDraft(payload.description)
    } catch {
      setSubscriptionTextError('Не удалось загрузить текст подписки')
    } finally {
      setSubscriptionTextLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab !== 'subscriptions' || subscriptionTextId || subscriptionTextLoading) {
      return
    }

    void loadSubscriptionText()
  }, [activeTab, subscriptionTextId, subscriptionTextLoading])

  const handleApprove = async () => {
    if (!approveTarget || !selectedSubscriptionId) {
      return
    }

    setActionPending(true)
    setActionError(null)

    try {
      await approveApplication(approveTarget.id, selectedSubscriptionId)
      closeAllModals()
      await refresh()
    } catch {
      setActionError('Не удалось одобрить заявку')
    } finally {
      setActionPending(false)
    }
  }

  const handleReject = async () => {
    if (!rejectTarget || rejectReason.trim().length === 0) {
      return
    }

    setActionPending(true)
    setActionError(null)

    try {
      await rejectApplication(rejectTarget.id, rejectReason.trim())
      closeAllModals()
      await refresh()
    } catch {
      setActionError('Не удалось отклонить заявку')
    } finally {
      setActionPending(false)
    }
  }

  const handleSaveSubscriptionText = async () => {
    if (!subscriptionTextId) {
      return
    }

    setSubscriptionTextSaving(true)
    setSubscriptionTextError(null)
    setSubscriptionTextSuccess(null)

    try {
      await updateSubscriptionText(subscriptionTextId, subscriptionTextDraft)
      setSubscriptionTextSuccess('Сохранено')
    } catch {
      setSubscriptionTextError('Не удалось сохранить текст подписки')
    } finally {
      setSubscriptionTextSaving(false)
    }
  }

  const openSaveConfirmModal = () => {
    setIsSaveConfirmOpen(true)
  }

  const closeSaveConfirmModal = () => {
    if (subscriptionTextSaving) {
      return
    }

    setIsSaveConfirmOpen(false)
  }

  const selectedSubscription = subscriptions.find((subscription) => subscription.id === selectedSubscriptionId) ?? null

  return (
    <DashboardShell>
      <DashboardHeader title="Spotly" onLogout={handleLogout} />

      <StatsGrid
        items={buildAdminStatsItems(stats)}
      />

      <TabNav tabs={adminTabs} activeTab={activeTab} onChange={setActiveTab} ariaLabel="Вкладки суперадмина" />

      <SectionCard>
        {activeTab === 'applications' ? (
          <AdminApplicationsSection
            isLoading={isLoading}
            error={error}
            applications={applications}
            onApplicationClick={(application) => {
              void openDetailsModal(application)
            }}
            onApproveClick={(application) => {
              void openApproveModal(application)
            }}
            onRejectClick={openRejectModal}
          />
        ) : activeTab === 'editing' ? (
          <EditingPanel />
        ) : activeTab === 'reviews' ? (
          <ReviewsPanel />
        ) : activeTab === 'subscriptions' ? (
          <SubscriptionTextSection
            text={subscriptionTextDraft}
            isLoading={subscriptionTextLoading}
            isSaving={subscriptionTextSaving}
            error={subscriptionTextError}
            success={subscriptionTextSuccess}
            canSave={!subscriptionTextLoading && !subscriptionTextSaving && Boolean(subscriptionTextId)}
            onTextChange={(value) => {
              setSubscriptionTextDraft(value)
              if (subscriptionTextSuccess) {
                setSubscriptionTextSuccess(null)
              }
            }}
            onOpenSaveConfirm={openSaveConfirmModal}
          />
        ) : (
          <p className={styles.sectionState}>
            Раздел «{adminTabs.find((tab) => tab.key === activeTab)?.label}» в разработке
          </p>
        )}
      </SectionCard>

      {detailsApplication ? (
        <AdminModal layer="base" onClose={closeDetailsModal} scrollable>
          <div className={styles.detailsContent}>
            <p className={styles.detailsField}>Название зала: {detailsApplication.title}</p>
            <p className={styles.detailsField}>Номер телефона зала: {detailsApplication.phone}</p>
            <p className={styles.detailsField}>Адрес: {detailsApplication.address}</p>
            <p className={styles.detailsField}>Описание зала: {detailsApplication.description}</p>

            <div className={styles.detailsBlock}>
              <p className={styles.detailsField}>
                ФИО: {detailsApplication.gym_admin.last_name} {detailsApplication.gym_admin.first_name}{' '}
                {detailsApplication.gym_admin.patronymic ?? ''}
              </p>
              <p className={styles.detailsField}>Email: {detailsApplication.gym_admin.email}</p>
            </div>

            {detailsLoading ? <p className={styles.modalInfo}>Обновляем данные заявки...</p> : null}
            {detailsError ? <p className={styles.modalError}>{detailsError}</p> : null}

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.approveButton}
                onClick={() => {
                  void openApproveModal(detailsApplication)
                }}
                disabled={actionPending}
              >
                Одобрить
              </button>
              <button
                type="button"
                className={styles.rejectButton}
                onClick={() => openRejectModal(detailsApplication)}
                disabled={actionPending}
              >
                Отклонить
              </button>
            </div>
          </div>
        </AdminModal>
      ) : null}

      {approveTarget ? (
        <AdminModal layer={detailsApplication ? 'stacked' : 'base'} onClose={closeApproveModal} scrollable={false}>
          <div className={styles.approveContent}>
            <h3 className={styles.modalTitle}>Выберите подписку</h3>
            <div className={styles.dropdown} ref={subscriptionDropdownRef}>
              <button
                type="button"
                className={styles.selectTrigger}
                onClick={() => setIsSubscriptionDropdownOpen((prev) => !prev)}
                disabled={subscriptionsLoading || actionPending || subscriptions.length === 0}
              >
                {selectedSubscription?.description ?? 'Выберите подписку'}
              </button>

              {isSubscriptionDropdownOpen ? (
                <div className={styles.dropdownMenu}>
                  {subscriptions.map((subscription) => (
                    <button
                      type="button"
                      key={subscription.id}
                      className={styles.dropdownOption}
                      onClick={() => {
                        setSelectedSubscriptionId(subscription.id)
                        setIsSubscriptionDropdownOpen(false)
                      }}
                    >
                      {subscription.description}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {subscriptionsLoading ? <p className={styles.modalInfo}>Загружаем подписки...</p> : null}
            {subscriptionsError ? <p className={styles.modalError}>{subscriptionsError}</p> : null}
            {actionError ? <p className={styles.modalError}>{actionError}</p> : null}

            <button
              type="button"
              className={styles.approveButton}
              onClick={() => {
                void handleApprove()
              }}
              disabled={subscriptionsLoading || actionPending || !selectedSubscriptionId}
            >
              {actionPending ? 'Отправляем...' : 'Одобрить'}
            </button>
          </div>
        </AdminModal>
      ) : null}

      {rejectTarget ? (
        <AdminModal layer={detailsApplication ? 'stacked' : 'base'} onClose={closeRejectModal} scrollable={false}>
          <div className={styles.rejectContent}>
            <h3 className={styles.modalTitle}>Вы действительно хотите отклонить заявку?</h3>
            <textarea
              className={styles.textarea}
              placeholder="Причина отказа"
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              disabled={actionPending}
            />

            {actionError ? <p className={styles.modalError}>{actionError}</p> : null}

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => {
                  void handleReject()
                }}
                disabled={actionPending || rejectReason.trim().length === 0}
              >
                {actionPending ? 'Отправляем...' : 'Да'}
              </button>
              <button type="button" className={styles.secondaryButton} onClick={closeRejectModal} disabled={actionPending}>
                Нет
              </button>
            </div>
          </div>
        </AdminModal>
      ) : null}

      {isSaveConfirmOpen ? (
        <AdminModal
          layer="base"
          onClose={closeSaveConfirmModal}
          scrollable={false}
          cardClassName={styles.saveConfirmModalCard}
        >
          <div className={styles.saveConfirmContent}>
            <h3 className={styles.saveConfirmTitle}>Вы действительно хотите сохранить данный текст?</h3>

            <div className={styles.saveConfirmActions}>
              <button
                type="button"
                className={styles.saveConfirmButton}
                onClick={() => {
                  void handleSaveSubscriptionText()
                  closeSaveConfirmModal()
                }}
                disabled={subscriptionTextSaving}
              >
                Да
              </button>
              <button
                type="button"
                className={styles.saveConfirmButton}
                onClick={closeSaveConfirmModal}
                disabled={subscriptionTextSaving}
              >
                Нет
              </button>
            </div>
          </div>
        </AdminModal>
      ) : null}
    </DashboardShell>
  )
}
