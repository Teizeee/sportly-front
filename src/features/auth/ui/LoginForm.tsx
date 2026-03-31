import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { login } from '@features/auth/api/login'
import { setAccessToken } from '@shared/lib/auth/tokenStorage'
import { ApiError } from '@shared/lib/http/ApiError'
import styles from './LoginForm.module.css'

export function LoginForm() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canSubmit = email.trim().length > 0 && password.trim().length > 0 && !isSubmitting

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!canSubmit) {
      return
    }

    try {
      setIsSubmitting(true)
      const response = await login({ email: email.trim(), password })

      setAccessToken(response.access_token)
      toast.success('Успешно авторизован')
      navigate('/', { replace: true })
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status >= 500) {
          toast.error('Внутренняя ошибка сервиса: повторите попытку позже')
          return
        }

        if (error.status >= 400 && error.status < 500 && error.status !== 401) {
          toast.warn('Ошибка авторизации: проверьте логин или пароль')
          return
        }
      }

      toast.error('Внутренняя ошибка сервиса: повторите попытку позже')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
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
          autoComplete="current-password"
          required
        />
      </label>

      <div className={styles.actions}>
        <button className={styles.registerButton} type="button" onClick={() => navigate('/register')}>
          Регистрация
        </button>

        <button className={styles.submitButton} type="submit" disabled={!canSubmit}>
          {isSubmitting ? 'Входим...' : 'Войти'}
        </button>
      </div>
    </form>
  )
}
