import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '@shared/config/api'
import { clearAccessToken } from '@shared/lib/auth/tokenStorage'
import { ApiError } from '@shared/lib/http/ApiError'
import { DEFAULT_AVATAR_URL } from '@shared/lib/ui/defaultAvatar'
import { DashboardShell } from '@shared/ui/dashboard-shell/DashboardShell'
import { SectionCard } from '@shared/ui/section-card/SectionCard'
import { fetchCurrentGymAdmin, fetchGymSubscriptionText, updateGymById, uploadGymPhoto } from '../api/gymDashboardApi'
import { gymWorkDays } from '../../admin/model/editingPanel.constants'
import { normalizeInputTime, toInputHour } from '../../admin/model/editingPanel.utils'
import { formatSubscriptionEndDate, getGymSubscriptionWarning } from '../model/subscription'
import type { CurrentGymAdmin } from '../model/types'
import styles from './GymSettingsPage.module.css'

type GymScheduleFormItem = {
  id: string
  open: string
  close: string
}

type GymSettingsFormState = {
  title: string
  phone: string
  address: string
  description: string
  schedule: Record<number, GymScheduleFormItem>
}

const DESCRIPTION_LIMIT = 255

function resolveAvatarBaseUrl(): string {
  return API_BASE_URL.replace(/\/api\/v1\/?$/, '/')
}

function buildInitialFormState(me: CurrentGymAdmin | null): GymSettingsFormState {
  const gym = me?.gym
  const application = gym?.gym_application

  return {
    title: application?.title ?? '',
    phone: application?.phone ?? '',
    address: application?.address ?? '',
    description: application?.description ?? '',
    schedule: gymWorkDays.reduce<Record<number, GymScheduleFormItem>>((accumulator, day) => {
      const scheduleItem = gym?.schedule.find((item) => item.day_of_week === day.key)

      accumulator[day.key] = {
        id: scheduleItem?.id ?? `${gym?.id ?? 'gym'}-${day.key}`,
        open: toInputHour(scheduleItem?.open_time ?? null),
        close: toInputHour(scheduleItem?.close_time ?? null),
      }

      return accumulator
    }, {}),
  }
}

export function GymSettingsPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [isAvatarUploading, setIsAvatarUploading] = useState(false)
  const [avatarVersion, setAvatarVersion] = useState<number | null>(null)
  const [subscriptionText, setSubscriptionText] = useState('')
  const [me, setMe] = useState<CurrentGymAdmin | null>(null)
  const [formState, setFormState] = useState<GymSettingsFormState>(() => buildInitialFormState(null))
  const [isAvatarVisible, setIsAvatarVisible] = useState(true)
  const avatarInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const [currentGymAdmin, subscriptionTextPayload] = await Promise.all([
          fetchCurrentGymAdmin(),
          fetchGymSubscriptionText().catch(() => null),
        ])

        setMe(currentGymAdmin)
        setFormState(buildInitialFormState(currentGymAdmin))
        setSubscriptionText(subscriptionTextPayload?.description ?? '')
        setIsAvatarVisible(true)
      } catch {
        setError('Не удалось загрузить данные настроек')
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [])

  const handleLogout = () => {
    clearAccessToken()
    navigate('/login', { replace: true })
  }

  const updateScheduleField = (dayOfWeek: number, field: 'open' | 'close', value: string) => {
    setSaveError(null)
    setSaveSuccess(null)

    setFormState((previous) => {
      const current = previous.schedule[dayOfWeek] ?? { id: `${me?.gym?.id ?? 'gym'}-${dayOfWeek}`, open: '', close: '' }

      return {
        ...previous,
        schedule: {
          ...previous.schedule,
          [dayOfWeek]: {
            ...current,
            [field]: value,
          },
        },
      }
    })
  }

  const handleFieldChange = (field: keyof Omit<GymSettingsFormState, 'schedule'>, value: string) => {
    setSaveError(null)
    setSaveSuccess(null)

    setFormState((previous) => ({
      ...previous,
      [field]: field === 'description' ? value.slice(0, DESCRIPTION_LIMIT) : value,
    }))
  }

  const submit = async () => {
    if (!me?.gym || isSaving) {
      return
    }

    if (
      formState.title.trim().length === 0 ||
      formState.phone.trim().length === 0 ||
      formState.address.trim().length === 0 ||
      formState.description.trim().length === 0
    ) {
      setSaveError('Заполните обязательные поля')
      return
    }

    const schedulePayload: Array<{ id: string; day_of_week: number; open_time: string | null; close_time: string | null }> = []

    for (const day of gymWorkDays) {
      const scheduleItem = formState.schedule[day.key] ?? { id: `${me.gym.id}-${day.key}`, open: '', close: '' }
      const openRaw = scheduleItem.open.trim()
      const closeRaw = scheduleItem.close.trim()

      if ((openRaw.length === 0 && closeRaw.length > 0) || (openRaw.length > 0 && closeRaw.length === 0)) {
        setSaveError('Для каждого дня укажите либо оба времени (от и до), либо оставьте оба поля пустыми')
        return
      }

      const normalizedOpen = normalizeInputTime(openRaw)
      const normalizedClose = normalizeInputTime(closeRaw)

      if ((openRaw.length > 0 && normalizedOpen === null) || (closeRaw.length > 0 && normalizedClose === null)) {
        setSaveError('Время работы должно быть только по ровным часам (например, 8, 8:00, 21)')
        return
      }

      schedulePayload.push({
        id: scheduleItem.id,
        day_of_week: day.key,
        open_time: normalizedOpen,
        close_time: normalizedClose,
      })
    }

    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(null)

    try {
      await updateGymById(me.gym.id, {
        title: formState.title.trim(),
        address: formState.address.trim(),
        description: formState.description.trim(),
        phone: formState.phone.trim(),
        schedule: schedulePayload,
        subscription: me.gym.subscription?.end_date ? { end_date: me.gym.subscription.end_date } : null,
      })

      const refreshed = await fetchCurrentGymAdmin()
      setMe(refreshed)
      setFormState(buildInitialFormState(refreshed))
      setSaveSuccess('Изменения сохранены')
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 422) {
        setSaveError('Некорректные данные. Проверьте заполненные поля')
      } else {
        setSaveError('Не удалось сохранить изменения')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarClick = () => {
    if (isAvatarUploading || isSaving) {
      return
    }

    avatarInputRef.current?.click()
  }

  const handleAvatarFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file || !me?.gym || isAvatarUploading || isSaving) {
      return
    }

    setIsAvatarUploading(true)
    setSaveError(null)
    setSaveSuccess(null)

    try {
      await uploadGymPhoto(me.gym.id, file)
      setIsAvatarVisible(true)
      setAvatarVersion(Date.now())
      setSaveSuccess('Аватарка зала обновлена')
    } catch {
      setSaveError('Не удалось загрузить аватарку зала')
    } finally {
      setIsAvatarUploading(false)
    }
  }

  const gymTitle = me?.gym?.gym_application?.title ?? 'Без названия'
  const gymAddress = me?.gym?.gym_application?.address ?? '-'
  const gymPhone = me?.gym?.gym_application?.phone ?? '-'
  const subscriptionEndDate = me?.gym?.subscription?.end_date ?? null
  const subscriptionWarning = getGymSubscriptionWarning(subscriptionEndDate)
  const gymAvatarUrl =
    me?.gym?.id
      ? `${resolveAvatarBaseUrl()}gyms/${me.gym.id}.jpg${avatarVersion ? `?v=${encodeURIComponent(String(avatarVersion))}` : ''}`
      : ''
  const resolvedGymAvatarUrl = isAvatarVisible && gymAvatarUrl ? gymAvatarUrl : DEFAULT_AVATAR_URL
  const hasGym = Boolean(me?.gym)

  const canSave = useMemo(
    () =>
      !isSaving &&
      formState.title.trim().length > 0 &&
      formState.phone.trim().length > 0 &&
      formState.address.trim().length > 0 &&
      formState.description.trim().length > 0,
    [formState, isSaving],
  )

  return (
    <DashboardShell>
      {isLoading ? (
        <SectionCard>
          <p className={styles.pageState}>Загрузка...</p>
        </SectionCard>
      ) : null}

      {!isLoading && error ? (
        <SectionCard>
          <p className={styles.pageState}>{error}</p>
        </SectionCard>
      ) : null}

      {!isLoading && !error && !hasGym ? (
        <SectionCard>
          <p className={styles.pageState}>У вас пока нет зала для редактирования</p>
          <button className={styles.backButton} type="button" onClick={() => navigate('/', { replace: true })}>
            Назад
          </button>
        </SectionCard>
      ) : null}

      {!isLoading && !error && hasGym ? (
        <section className={styles.layout}>
          <header className={styles.header}>
              <div className={styles.headerLeft}>
                <button className={styles.backIconButton} type="button" onClick={() => navigate('/')}>
                  <span aria-hidden="true">‹</span>
                </button>

                <div>
                  <div className={styles.titleRow}>
                    <h1 className={styles.title}>{gymTitle}</h1>
                    {subscriptionWarning ? <span className={styles.subscriptionWarning}>{subscriptionWarning}</span> : null}
                  </div>

                  <p className={styles.contacts}>
                    {gymAddress} <span aria-hidden="true">•</span> {gymPhone}
                  </p>
                </div>
              </div>

              <button className={styles.logoutButton} type="button" onClick={handleLogout}>
                Выйти
              </button>
            </header>

            <SectionCard>
              <section className={styles.innerCard}>
                <div className={styles.avatarBox}>
                  <button
                    type="button"
                    className={styles.avatarButton}
                    onClick={handleAvatarClick}
                    disabled={isAvatarUploading || isSaving}
                  >
                    <img
                      src={resolvedGymAvatarUrl}
                      alt=""
                      className={styles.avatarImage}
                      onError={(event) => {
                        event.currentTarget.onerror = null
                        event.currentTarget.src = DEFAULT_AVATAR_URL
                        setIsAvatarVisible(false)
                      }}
                    />
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className={styles.hiddenFileInput}
                      onChange={(event) => void handleAvatarFileChange(event)}
                      disabled={isAvatarUploading || isSaving}
                      tabIndex={-1}
                    />
                  </button>
                </div>

                <div className={styles.formRow}>
                  <label className={styles.field}>
                    <span className={styles.label}>Название зала</span>
                    <input
                      className={styles.input}
                      value={formState.title}
                      onChange={(event) => handleFieldChange('title', event.target.value)}
                      disabled={isSaving}
                    />
                  </label>

                  <label className={styles.field}>
                    <span className={styles.label}>Номер телефона</span>
                    <input
                      className={styles.input}
                      value={formState.phone}
                      onChange={(event) => handleFieldChange('phone', event.target.value)}
                      disabled={isSaving}
                    />
                  </label>
                </div>

                <label className={styles.field}>
                  <span className={styles.label}>Адрес</span>
                  <input
                    className={styles.input}
                    value={formState.address}
                    onChange={(event) => handleFieldChange('address', event.target.value)}
                    disabled={isSaving}
                  />
                </label>

                <label className={styles.field}>
                  <span className={styles.label}>Описание зала</span>
                  <textarea
                    className={styles.textarea}
                    value={formState.description}
                    onChange={(event) => handleFieldChange('description', event.target.value)}
                    maxLength={DESCRIPTION_LIMIT}
                    disabled={isSaving}
                  />
                </label>

                <p className={styles.counter}>
                  {formState.description.length}/{DESCRIPTION_LIMIT}
                </p>

                <div className={styles.scheduleBlock}>
                  <p className={styles.scheduleTitle}>Время работы</p>
                  {gymWorkDays.map((day) => (
                    <div key={day.key} className={styles.scheduleRow}>
                      <span className={styles.scheduleDay}>{day.label}</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        className={styles.scheduleInput}
                        value={formState.schedule[day.key]?.open ?? ''}
                        onChange={(event) => updateScheduleField(day.key, 'open', event.target.value)}
                        disabled={isSaving}
                      />
                      <span className={styles.scheduleDash} aria-hidden="true">
                        -
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        className={styles.scheduleInput}
                        value={formState.schedule[day.key]?.close ?? ''}
                        onChange={(event) => updateScheduleField(day.key, 'close', event.target.value)}
                        disabled={isSaving}
                      />
                    </div>
                  ))}
                </div>

                {saveError ? <p className={styles.errorText}>{saveError}</p> : null}
                {saveSuccess ? <p className={styles.successText}>{saveSuccess}</p> : null}

                <div className={styles.actions}>
                  <button className={styles.submitButton} type="button" onClick={() => void submit()} disabled={!canSave}>
                    Сохранить изменения
                  </button>
                </div>
              </section>
            </SectionCard>

          {(subscriptionEndDate || subscriptionText) && (
            <SectionCard>
              <section className={styles.subscriptionInfo}>
                {subscriptionEndDate ? (
                  <p className={styles.subscriptionUntil}>Ваша подписка действует до {formatSubscriptionEndDate(subscriptionEndDate)}</p>
                ) : null}
                {subscriptionText ? <pre className={styles.subscriptionText}>{subscriptionText}</pre> : null}
              </section>
            </SectionCard>
          )}
        </section>
      ) : null}
    </DashboardShell>
  )
}
