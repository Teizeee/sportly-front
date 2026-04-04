import { useCallback, useEffect, useMemo, useState } from 'react'
import type { GymReviewAdmin, ReviewUserInfo, TrainerReviewAdmin } from '@entities/admin'
import { useEscapeKey } from '@shared/lib/dom/useEscapeKey'
import { TabNav } from '@shared/ui/tab-nav/TabNav'
import { deleteGymReview, deleteTrainerReview, fetchGymReviews, fetchTrainerReviews } from '../../api/adminApi'
import styles from './ReviewsPanel.module.css'

type ReviewsTabKey = 'gyms' | 'trainers'

type DeleteTarget = {
  id: string
  type: ReviewsTabKey
}

const reviewTabs: Array<{ key: ReviewsTabKey; label: string }> = [
  { key: 'gyms', label: 'Залы' },
  { key: 'trainers', label: 'Тренеры' },
]

function formatPersonName(person: ReviewUserInfo): string {
  return [person.last_name, person.first_name, person.patronymic ?? ''].join(' ').trim()
}

function clampRating(value: number): number {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.max(0, Math.min(5, Math.round(value)))
}

function Stars({ rating }: { rating: number }) {
  const normalized = clampRating(rating)

  return (
    <span className={styles.stars} aria-label={`Рейтинг ${normalized} из 5`}>
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} className={index < normalized ? styles.starFilled : styles.starEmpty} aria-hidden="true">
          ★
        </span>
      ))}
    </span>
  )
}

export function ReviewsPanel() {
  const [activeTab, setActiveTab] = useState<ReviewsTabKey>('gyms')
  const [gymReviews, setGymReviews] = useState<GymReviewAdmin[]>([])
  const [trainerReviews, setTrainerReviews] = useState<TrainerReviewAdmin[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
  const [deletePending, setDeletePending] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const loadReviews = useCallback(async (tab: ReviewsTabKey) => {
    setIsLoading(true)
    setError(null)

    try {
      if (tab === 'gyms') {
        const payload = await fetchGymReviews()
        setGymReviews(payload)
      } else {
        const payload = await fetchTrainerReviews()
        setTrainerReviews(payload)
      }
    } catch {
      setError('Не удалось загрузить отзывы')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadReviews(activeTab)
  }, [activeTab, loadReviews])

  const closeDeleteModal = () => {
    if (deletePending) {
      return
    }

    setDeleteTarget(null)
    setDeleteError(null)
  }

  useEscapeKey(closeDeleteModal, Boolean(deleteTarget))

  const handleDelete = async () => {
    if (!deleteTarget) {
      return
    }

    setDeletePending(true)
    setDeleteError(null)

    try {
      if (deleteTarget.type === 'gyms') {
        await deleteGymReview(deleteTarget.id)
        setGymReviews((previous) => previous.filter((review) => review.id !== deleteTarget.id))
      } else {
        await deleteTrainerReview(deleteTarget.id)
        setTrainerReviews((previous) => previous.filter((review) => review.id !== deleteTarget.id))
      }

      setDeleteTarget(null)
    } catch {
      setDeleteError('Не удалось удалить отзыв')
    } finally {
      setDeletePending(false)
    }
  }

  const rows = useMemo(() => {
    if (activeTab === 'gyms') {
      return gymReviews.map((review) => ({
        id: review.id,
        subject: review.gym.title,
        author: formatPersonName(review.author),
        comment: review.comment,
        rating: review.rating,
      }))
    }

    return trainerReviews.map((review) => ({
      id: review.id,
      subject: formatPersonName(review.trainer),
      author: formatPersonName(review.author),
      comment: review.comment,
      rating: review.rating,
    }))
  }, [activeTab, gymReviews, trainerReviews])

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>Все отзывы</h2>

      <TabNav tabs={reviewTabs} activeTab={activeTab} onChange={setActiveTab} ariaLabel="Отзывы: вкладки залы и тренеры" preservePageScrollOnChange />

      {error ? <p className={styles.error}>{error}</p> : null}
      {isLoading ? <p className={styles.info}>Загружаем отзывы...</p> : null}

      {!isLoading ? (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{activeTab === 'gyms' ? 'Зал' : 'ФИО тренера'}</th>
                <th>Пользователь</th>
                <th>Отзыв</th>
                <th>Рейтинг</th>
                <th aria-label="Действия" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.subject}</td>
                  <td>{row.author}</td>
                  <td>{row.comment?.trim().length ? row.comment : '-'}</td>
                  <td>
                    <Stars rating={row.rating} />
                  </td>
                  <td className={styles.actionsCell}>
                    <button
                      type="button"
                      className={styles.deleteButton}
                      onClick={() => {
                        setDeleteError(null)
                        setDeleteTarget({ id: row.id, type: activeTab })
                      }}
                      disabled={deletePending}
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {rows.length === 0 ? <p className={styles.info}>Отзывов пока нет</p> : null}
        </div>
      ) : null}

      {deleteTarget ? (
        <div className={styles.modalOverlay} role="presentation" onClick={closeDeleteModal}>
          <div className={styles.modalCard} role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <h3 className={styles.modalTitle}>Вы действительно хотите удалить этот отзыв?</h3>

            {deleteError ? <p className={styles.error}>{deleteError}</p> : null}

            <div className={styles.modalActions}>
              <button type="button" className={styles.modalButton} onClick={() => { void handleDelete() }} disabled={deletePending}>
                Да
              </button>
              <button type="button" className={styles.modalButton} onClick={closeDeleteModal} disabled={deletePending}>
                Нет
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
