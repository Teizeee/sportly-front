import { useState } from 'react'
import type { ComponentProps } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { register } from '@features/auth/api/register'
import { ApiError } from '@shared/lib/http/ApiError'
import styles from '@features/auth/ui/LoginForm.module.css'

export function RegisterForm() {
  const navigate = useNavigate()
  const [lastName, setLastName] = useState('')
  const [firstName, setFirstName] = useState('')
  const [patronymic, setPatronymic] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canSubmit =
    lastName.trim().length > 0 &&
    firstName.trim().length > 0 &&
    patronymic.trim().length > 0 &&
    email.trim().length > 0 &&
    password.trim().length > 0 &&
    !isSubmitting

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (event) => {
    event.preventDefault()

    if (!canSubmit) {
      return
    }

    try {
      setIsSubmitting(true)
      await register({
        email: email.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        patronymic: patronymic.trim(),
        role: 'GYM_ADMIN',
        password,
      })

      toast.success('Ð£ÑÐ¿ÐµÑˆÐ½Ð¾ Ð·Ð°Ñ€ÐµÐ³Ð¸ÑÑ‚Ñ€Ð¸Ñ€Ð¾Ð²Ð°Ð½')
      navigate('/login', { replace: true })
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status >= 500) {
          toast.error('Ð’Ð½ÑƒÑ‚Ñ€ÐµÐ½Ð½ÑÑ Ð¾ÑˆÐ¸Ð±ÐºÐ° ÑÐµÑ€Ð²Ð¸ÑÐ°: Ð¿Ð¾Ð²Ñ‚Ð¾Ñ€Ð¸Ñ‚Ðµ Ð¿Ð¾Ð¿Ñ‹Ñ‚ÐºÑƒ Ð¿Ð¾Ð·Ð¶Ðµ')
          return
        }

        if (error.status >= 400 && error.status < 500) {
          toast.warn('ÐžÑˆÐ¸Ð±ÐºÐ° Ñ€ÐµÐ³Ð¸ÑÑ‚Ñ€Ð°Ñ†Ð¸Ð¸: Ð¿Ñ€Ð¾Ð²ÐµÑ€ÑŒÑ‚Ðµ Ð²Ð²ÐµÐ´ÐµÐ½Ð½Ñ‹Ðµ Ð´Ð°Ð½Ð½Ñ‹Ðµ')
          return
        }
      }

      toast.error('Ð’Ð½ÑƒÑ‚Ñ€ÐµÐ½Ð½ÑÑ Ð¾ÑˆÐ¸Ð±ÐºÐ° ÑÐµÑ€Ð²Ð¸ÑÐ°: Ð¿Ð¾Ð²Ñ‚Ð¾Ñ€Ð¸Ñ‚Ðµ Ð¿Ð¾Ð¿Ñ‹Ñ‚ÐºÑƒ Ð¿Ð¾Ð·Ð¶Ðµ')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.topRow}>
        <label className={styles.field}>
          <span className={styles.label}>Ð¤Ð°Ð¼Ð¸Ð»Ð¸Ñ</span>
          <input
            className={styles.input}
            type="text"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            autoComplete="family-name"
            required
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Ð˜Ð¼Ñ</span>
          <input
            className={styles.input}
            type="text"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            autoComplete="given-name"
            required
          />
        </label>
      </div>

      <label className={styles.field}>
        <span className={styles.label}>ÐžÑ‚Ñ‡ÐµÑÑ‚Ð²Ð¾</span>
        <input
          className={styles.input}
          type="text"
          value={patronymic}
          onChange={(event) => setPatronymic(event.target.value)}
          autoComplete="additional-name"
          required
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Email</span>
        <input
          className={styles.input}
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>ÐŸÐ°Ñ€Ð¾Ð»ÑŒ</span>
        <input
          className={styles.input}
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
          required
        />
      </label>

      <div className={styles.actions}>
        <button className={styles.registerButton} type="button" onClick={() => navigate('/login')}>
          ÐÐ²Ñ‚Ð¾Ñ€Ð¸Ð·Ð°Ñ†Ð¸Ñ
        </button>

        <button
          className={`${styles.submitButton} ${styles.submitButtonWide}`}
          type="submit"
          disabled={!canSubmit}
        >
          {isSubmitting ? 'Ð ÐµÐ³Ð¸ÑÑ‚Ñ€Ð°Ñ†Ð¸Ñ...' : 'Ð—Ð°Ñ€ÐµÐ³Ð¸ÑÑ‚Ñ€Ð¸Ñ€Ð¾Ð²Ð°Ñ‚ÑŒÑÑ'}
        </button>
      </div>
    </form>
  )
}


