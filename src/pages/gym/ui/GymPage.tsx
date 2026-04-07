import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearAccessToken } from '@shared/lib/auth/tokenStorage'
import { ApiError } from '@shared/lib/http/ApiError'
import { DashboardShell } from '@shared/ui/dashboard-shell/DashboardShell'
import { SectionCard } from '@shared/ui/section-card/SectionCard'
import { TabNav } from '@shared/ui/tab-nav/TabNav'
import { submitGymApplication } from '../api/gymDashboardApi'
import { gymTabs } from '../model/gymTabs'
import { getGymSubscriptionWarning } from '../model/subscription'
import type { GymApplicationPayload, GymTabKey } from '../model/types'
import { useGymDashboard } from '../model/useGymDashboard'
import { GymTabPanel } from './components/GymTabPanel'
import styles from './GymPage.module.css'

type ApplicationFormState = {
  title: string
  phone: string
  address: string
  description: string
}

const DESCRIPTION_LIMIT = 255

function normalizeApplicationForm(source: GymApplicationPayload | null): ApplicationFormState {
  return {
    title: source?.title ?? '',
    phone: source?.phone ?? '',
    address: source?.address ?? '',
    description: source?.description ?? '',
  }
}

function mapApplicationStatus(status: string | null | undefined): string {
  if (status === 'ON_MODERATION' || status === 'PENDING') {
    return 'На модерации'
  }

  if (status === 'REJECTED') {
    return 'Отклонена'
  }

  if (status === 'APPROVED') {
    return 'Одобрена'
  }

  if (status && status.length > 0) {
    return status
  }

  return 'Новая'
}

export function GymPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<GymTabKey>('services')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const { me, applicationDraft, membershipTypes, trainerPackages, subscriptionText, isLoading, servicesLoading, error, servicesError, refresh } =
    useGymDashboard()

  const [formState, setFormState] = useState<ApplicationFormState>(() => normalizeApplicationForm(null))
  const initialFormState = useMemo(() => normalizeApplicationForm(applicationDraft), [applicationDraft])

  useEffect(() => {
    setFormState(initialFormState)
  }, [initialFormState])

  const handleLogout = () => {
    clearAccessToken()
    navigate('/login', { replace: true })
  }

  const handleFormChange = (field: keyof ApplicationFormState, value: string) => {
    setSubmitError(null)
    setFormState((prev) => ({
      ...prev,
      [field]: field === 'description' ? value.slice(0, DESCRIPTION_LIMIT) : value,
    }))
  }

  const isFormValid =
    formState.title.trim().length > 0 &&
    formState.phone.trim().length > 0 &&
    formState.address.trim().length > 0 &&
    formState.description.trim().length > 0

  const handleSubmitApplication = async () => {
    if (!isFormValid || isSubmitting) {
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      await submitGymApplication({
        title: formState.title.trim(),
        phone: formState.phone.trim(),
        address: formState.address.trim(),
        description: formState.description.trim(),
      })
      await refresh()
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) {
        setSubmitError('Validation error')
      } else {
        setSubmitError('Failed to submit application')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const hasGym = Boolean(me?.gym)
  const displayName = `${me?.first_name ?? ''} ${me?.last_name ?? ''}`.trim() || 'Администратор зала'
  const applicationStatus = mapApplicationStatus(me?.gym_application?.status ?? me?.gym?.gym_application?.status)

  const gymTitle = me?.gym?.gym_application?.title ?? me?.gym_application?.title ?? 'Без названия'
  const gymAddress = me?.gym?.gym_application?.address ?? me?.gym_application?.address ?? '-'
  const gymPhone = me?.gym?.gym_application?.phone ?? me?.gym_application?.phone ?? '-'
  const subscriptionWarning = getGymSubscriptionWarning(me?.gym?.subscription?.end_date)

  return (
    <DashboardShell>
      {isLoading ? (
        <SectionCard>
          <p className={styles.pageState}>Загрузка...</p>
        </SectionCard>
      ) : null}

      {error ? (
        <SectionCard>
          <p className={styles.pageState}>{error}</p>
        </SectionCard>
      ) : null}

      {!isLoading && !error && hasGym ? (
        <section className={styles.registeredLayout}>
          <header className={styles.registeredHeader}>
            <div>
              <div className={styles.registeredTitleRow}>
                <h1 className={styles.registeredTitle}>{gymTitle}</h1>
                {subscriptionWarning ? <span className={styles.subscriptionWarning}>{subscriptionWarning}</span> : null}
              </div>
              <p className={styles.registeredContacts}>
                {gymAddress} <span aria-hidden="true">•</span> {gymPhone}
              </p>
            </div>

            <button className={styles.settingsIconButton} type="button" aria-label="Настройки" onClick={() => navigate('/settings')}>
              <svg width="57" height="57" viewBox="0 0 57 57" fill="none" xmlns="http://www.w3.org/2000/svg">
                <mask id="settings-icon-mask" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="57" height="57">
                  <rect width="56.4893" height="56.4893" fill="#D9D9D9" />
                </mask>
                <g mask="url(#settings-icon-mask)">
                  <path
                    d="M21.7065 51L20.791 43.64C20.2952 43.4483 19.8279 43.2183 19.3893 42.95C18.9507 42.6817 18.5216 42.3942 18.102 42.0875L11.2935 44.9625L5 34.0375L10.893 29.5525C10.8549 29.2842 10.8358 29.0254 10.8358 28.7763V27.2238C10.8358 26.9746 10.8549 26.7158 10.893 26.4475L5 21.9625L11.2935 11.0375L18.102 13.9125C18.5216 13.6058 18.9602 13.3183 19.4179 13.05C19.8756 12.7817 20.3333 12.5517 20.791 12.36L21.7065 5H34.2935L35.209 12.36C35.7048 12.5517 36.1721 12.7817 36.6107 13.05C37.0493 13.3183 37.4784 13.6058 37.898 13.9125L44.7065 11.0375L51 21.9625L45.107 26.4475C45.1451 26.7158 45.1642 26.9746 45.1642 27.2238V28.7763C45.1642 29.0254 45.126 29.2842 45.0497 29.5525L50.9428 34.0375L44.6493 44.9625L37.898 42.0875C37.4784 42.3942 37.0398 42.6817 36.5821 42.95C36.1244 43.2183 35.6667 43.4483 35.209 43.64L34.2935 51H21.7065ZM25.7114 46.4H30.2313L31.0323 40.305C32.2148 39.9983 33.3114 39.5479 34.3221 38.9538C35.3329 38.3596 36.2579 37.6408 37.097 36.7975L42.7612 39.155L44.9925 35.245L40.0721 31.5075C40.2628 30.9708 40.3964 30.4054 40.4726 29.8113C40.5489 29.2171 40.5871 28.6133 40.5871 28C40.5871 27.3867 40.5489 26.7829 40.4726 26.1888C40.3964 25.5946 40.2628 25.0292 40.0721 24.4925L44.9925 20.755L42.7612 16.845L37.097 19.26C36.2579 18.3783 35.3329 17.6404 34.3221 17.0463C33.3114 16.4521 32.2148 16.0017 31.0323 15.695L30.2886 9.6H25.7687L24.9677 15.695C23.7852 16.0017 22.6886 16.4521 21.6779 17.0463C20.6671 17.6404 19.7421 18.3592 18.903 19.2025L13.2388 16.845L11.0075 20.755L15.9279 24.435C15.7371 25.01 15.6036 25.585 15.5274 26.16C15.4511 26.735 15.4129 27.3483 15.4129 28C15.4129 28.6133 15.4511 29.2075 15.5274 29.7825C15.6036 30.3575 15.7371 30.9325 15.9279 31.5075L11.0075 35.245L13.2388 39.155L18.903 36.74C19.7421 37.6217 20.6671 38.3596 21.6779 38.9538C22.6886 39.5479 23.7852 39.9983 24.9677 40.305L25.7114 46.4ZM28.1144 36.05C30.3267 36.05 32.2148 35.2642 33.7786 33.6925C35.3425 32.1208 36.1244 30.2233 36.1244 28C36.1244 25.7767 35.3425 23.8792 33.7786 22.3075C32.2148 20.7358 30.3267 19.95 28.1144 19.95C25.864 19.95 23.9664 20.7358 22.4216 22.3075C20.8769 23.8792 20.1045 25.7767 20.1045 28C20.1045 30.2233 20.8769 32.1208 22.4216 33.6925C23.9664 35.2642 25.864 36.05 28.1144 36.05Z"
                    fill="#1C1B1F"
                  />
                </g>
              </svg>
            </button>
          </header>

          <TabNav tabs={gymTabs} activeTab={activeTab} onChange={setActiveTab} ariaLabel="Вкладки профиля зала" />

          <SectionCard>
            <GymTabPanel
              activeTab={activeTab}
              membershipTypes={membershipTypes}
              trainerPackages={trainerPackages}
              isServicesLoading={servicesLoading}
              servicesError={servicesError}
              gymId={me?.gym?.id ?? null}
              onMembershipCreated={refresh}
              onTrainerPackageCreated={refresh}
              onTrainerDeleted={refresh}
            />
          </SectionCard>
        </section>
      ) : null}

      {!isLoading && !error && !hasGym ? (
        <>
          <SectionCard>
            <header className={styles.topBar}>
              <div>
                <p className={styles.personName}>{displayName}</p>
                <p className={styles.personEmail}>{me?.email ?? '-'}</p>
              </div>

              <p className={styles.status}>Статус заявки: {applicationStatus}</p>

              <button className={styles.logoutButton} type="button" onClick={handleLogout}>
                Выйти
              </button>
            </header>

            <section className={styles.innerCard}>
              <h2 className={styles.innerTitle}>Заполните информацию о зале</h2>

              <div className={styles.formRow}>
                <label className={styles.field}>
                  <span className={styles.label}>Название зала</span>
                  <input
                    className={styles.input}
                    value={formState.title}
                    onChange={(event) => handleFormChange('title', event.target.value)}
                  />
                </label>

                <label className={styles.field}>
                  <span className={styles.label}>Номер телефона</span>
                  <input
                    className={styles.input}
                    value={formState.phone}
                    onChange={(event) => handleFormChange('phone', event.target.value)}
                  />
                </label>
              </div>

              <label className={styles.field}>
                <span className={styles.label}>Адрес</span>
                <input
                  className={styles.input}
                  value={formState.address}
                  onChange={(event) => handleFormChange('address', event.target.value)}
                />
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Описание зала</span>
                <textarea
                  className={styles.textarea}
                  value={formState.description}
                  onChange={(event) => handleFormChange('description', event.target.value)}
                />
              </label>

              <p className={styles.counter}>
                {formState.description.length}/{DESCRIPTION_LIMIT}
              </p>

              <div className={styles.formActions}>
                <button className={styles.submitButton} type="button" onClick={handleSubmitApplication} disabled={!isFormValid || isSubmitting}>
                  Отправить на подтверждение
                </button>
              </div>
              {submitError ? <p className={styles.pageState}>{submitError}</p> : null}
            </section>
          </SectionCard>

          {subscriptionText ? (
            <SectionCard>
              <pre className={styles.subscriptionText}>{subscriptionText}</pre>
            </SectionCard>
          ) : null}
        </>
      ) : null}
    </DashboardShell>
  )
}
