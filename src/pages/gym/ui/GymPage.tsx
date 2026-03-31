import { useNavigate } from 'react-router-dom'
import { clearAccessToken } from '@shared/lib/auth/tokenStorage'
import styles from './GymPage.module.css'

export function GymPage() {
  const navigate = useNavigate()

  const handleLogout = () => {
    clearAccessToken()
    navigate('/login', { replace: true })
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.text}>Страница администратора зала (в разработке)</p>
        <button className={styles.logoutButton} type="button" onClick={handleLogout}>
          Выйти
        </button>
      </section>
    </main>
  )
}
