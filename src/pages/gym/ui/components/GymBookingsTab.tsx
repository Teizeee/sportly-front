import type { RefObject } from 'react'
import { ConfirmActionModal } from '@pages/admin/ui/components/ConfirmActionModal'
import type { GymTrainerOption, TrainerSlotAvailability } from '../../model/types'
import { formatBookedUserName, formatBookingDateLabel, formatSlotTimeLabel, noop, resolveBookingStatusText, shiftDateByDays } from './gymTabPanel.utils'
import styles from './GymTabPanel.module.css'

type GymBookingsTabProps = {
  bookingDate: string
  onBookingDateChange: (value: string | ((prev: string) => string)) => void
  isSlotsLoading: boolean
  bookingTrainerDropdownRef: RefObject<HTMLDivElement | null>
  isBookingTrainerOptionsLoading: boolean
  bookingTrainerOptions: GymTrainerOption[]
  selectedBookingTrainerLabel: string
  isBookingTrainerDropdownOpen: boolean
  onToggleBookingTrainerDropdown: () => void
  onSelectBookingTrainer: (trainerId: string) => void
  bookingTrainerOptionsError: string | null
  slotsError: string | null
  slots: TrainerSlotAvailability[]
  bookingActionError: string | null
  attendanceMenuSlotId: string | null
  attendanceMenuRef: RefObject<HTMLDivElement | null>
  bookingActionPendingId: string | null
  onToggleAttendanceMenu: (slotKey: string) => void
  onSubmitBookingAttendance: (bookingId: string, status: 'VISITED' | 'NOT_VISITED') => Promise<void>
  onRequestCancelBooking: (bookingId: string) => void
  cancelBookingId: string | null
  onConfirmCancelBooking: () => Promise<void>
  onCloseCancelBookingModal: () => void
}

export function GymBookingsTab({
  bookingDate,
  onBookingDateChange,
  isSlotsLoading,
  bookingTrainerDropdownRef,
  isBookingTrainerOptionsLoading,
  bookingTrainerOptions,
  selectedBookingTrainerLabel,
  isBookingTrainerDropdownOpen,
  onToggleBookingTrainerDropdown,
  onSelectBookingTrainer,
  bookingTrainerOptionsError,
  slotsError,
  slots,
  bookingActionError,
  attendanceMenuSlotId,
  attendanceMenuRef,
  bookingActionPendingId,
  onToggleAttendanceMenu,
  onSubmitBookingAttendance,
  onRequestCancelBooking,
  cancelBookingId,
  onConfirmCancelBooking,
  onCloseCancelBookingModal,
}: GymBookingsTabProps) {
  return (
    <section className={styles.bookingsSection}>
      <div className={styles.bookingsToolbar}>
        <div className={styles.bookingsDateControls}>
          <button
            type="button"
            className={styles.bookingsDateNavButton}
            aria-label="Предыдущий день"
            onClick={() => onBookingDateChange((prev) => shiftDateByDays(prev, -1))}
            disabled={isSlotsLoading}
          >
            ←
          </button>

          <span className={styles.bookingsDateLabel}>{formatBookingDateLabel(bookingDate)}</span>

          <button
            type="button"
            className={styles.bookingsDateNavButton}
            aria-label="Следующий день"
            onClick={() => onBookingDateChange((prev) => shiftDateByDays(prev, 1))}
            disabled={isSlotsLoading}
          >
            →
          </button>
        </div>

        <div className={styles.bookingsTrainerDropdown} ref={bookingTrainerDropdownRef}>
          <button
            type="button"
            className={styles.bookingsTrainerTrigger}
            onClick={onToggleBookingTrainerDropdown}
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
                  onClick={() => onSelectBookingTrainer(trainer.trainer_id)}
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
                          onClick={() => onToggleAttendanceMenu(slotKey)}
                          disabled={isSlotActionPending}
                        >
                          Отметить
                        </button>

                        {isAttendanceMenuOpen ? (
                          <div className={styles.bookingAttendanceMenu}>
                            <button
                              type="button"
                              className={styles.bookingAttendanceMenuButton}
                              onClick={() => void onSubmitBookingAttendance(bookingId, 'VISITED')}
                              disabled={isSlotActionPending}
                            >
                              Посетил
                            </button>
                            <button
                              type="button"
                              className={styles.bookingAttendanceMenuButton}
                              onClick={() => void onSubmitBookingAttendance(bookingId, 'NOT_VISITED')}
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
                          onClick={() => onRequestCancelBooking(bookingId)}
                          disabled={isSlotActionPending}
                        >
                          ×
                        </button>
                      </div>
                    ) : null}

                    {!isCreated && statusText ? (
                      <span className={`${styles.bookingStatusLabel} ${isVisited ? styles.bookingStatusVisited : styles.bookingStatusNegative}`}>
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
        onConfirm={() => void onConfirmCancelBooking()}
        onClose={onCloseCancelBookingModal}
      />
    </section>
  )
}
