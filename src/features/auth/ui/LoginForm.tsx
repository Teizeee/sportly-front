import { useState } from 'react'
import type { ComponentProps } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { login } from '@features/auth/api/login'
import { handleAuthErrorToast } from '@features/auth/lib/authErrorToast'
import { setAccessToken, setUserRole } from '@shared/lib/auth/tokenStorage'
import styles from './LoginForm.module.css'

export function LoginForm() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canSubmit = email.trim().length > 0 && password.trim().length > 0 && !isSubmitting

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (event) => {
    event.preventDefault()

    if (!canSubmit) {
      return
    }

    try {
      setIsSubmitting(true)
      const response = await login({ email: email.trim(), password })

      setAccessToken(response.access_token)
      setUserRole(response.role)
      toast.success('Успешно авторизован')

      if (response.role === 'SUPER_ADMIN') {
        navigate('/admin', { replace: true })
        return
      }

      navigate('/', { replace: true })
    } catch (error) {
      handleAuthErrorToast({
        error,
        clientErrorText: 'Ошибка авторизации: проверьте логин или пароль',
        skipStatuses: [401],
      })
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


