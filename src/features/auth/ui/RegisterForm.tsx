import { useState } from 'react'
import type { ComponentProps } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { register } from '@features/auth/api/register'
import { handleAuthErrorToast } from '@features/auth/lib/authErrorToast'
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

      toast.success('Успешно зарегистрирован')
      navigate('/login', { replace: true })
    } catch (error) {
      handleAuthErrorToast({
        error,
        clientErrorText: 'Ошибка регистрации: проверьте введенные данные',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.topRow}>
        <label className={styles.field}>
          <span className={styles.label}>Фамилия</span>
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
          <span className={styles.label}>Имя</span>
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
        <span className={styles.label}>Отчество</span>
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
        <span className={styles.label}>Пароль</span>
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
          Авторизация
        </button>

        <button className={`${styles.submitButton} ${styles.submitButtonWide}`} type="submit" disabled={!canSubmit}>
          {isSubmitting ? 'Регистрация...' : 'Зарегистрироваться'}
        </button>
      </div>
    </form>
  )
}
