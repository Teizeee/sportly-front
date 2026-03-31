import { LoginForm } from '@features/auth/ui/LoginForm'
import styles from './LoginPage.module.css'

export function LoginPage() {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <LoginForm />
      </section>
    </main>
  )
}
