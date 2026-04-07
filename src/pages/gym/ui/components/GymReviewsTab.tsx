import type { GymReview } from '../../model/types'
import { clampRating, formatReviewAuthor, formatReviewDate } from './gymTabPanel.utils'
import styles from './GymTabPanel.module.css'

type GymReviewsTabProps = {
  averageRating: number | null
  isReviewsLoading: boolean
  reviewsError: string | null
  reviews: GymReview[]
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

export function GymReviewsTab({ averageRating, isReviewsLoading, reviewsError, reviews }: GymReviewsTabProps) {
  const averageRatingLabel =
    averageRating === null ? '-' : averageRating.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

  return (
    <section className={styles.reviewsSection}>
      <p className={styles.reviewsRating}>Рейтинг: {averageRatingLabel}</p>

      {isReviewsLoading ? <p className={styles.placeholder}>Загрузка отзывов...</p> : null}
      {reviewsError ? <p className={styles.placeholder}>{reviewsError}</p> : null}
      {!isReviewsLoading && !reviewsError && reviews.length === 0 ? <p className={styles.placeholder}>У вашего зала пока нет отзывов</p> : null}

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
