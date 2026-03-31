import { useCounter } from '@features/counter/model/useCounter'
import styles from './Counter.module.css'

export function Counter() {
  const { count, increment, decrement, reset } = useCounter()

  return (
    <article className={styles.card}>
      <h2>Counter feature</h2>
      <p className={styles.value}>{count}</p>
      <div className={styles.actions}>
        <button type="button" onClick={decrement}>
          -1
        </button>
        <button type="button" onClick={increment}>
          +1
        </button>
        <button type="button" onClick={reset}>
          Reset
        </button>
      </div>
    </article>
  )
}
