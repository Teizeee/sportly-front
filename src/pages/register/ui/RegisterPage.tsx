import { RegisterForm } from '@features/auth/ui/RegisterForm'
import styles from '@pages/login/ui/LoginPage.module.css'

export function RegisterPage() {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <RegisterForm />
      </section>
    </main>
  )
}
