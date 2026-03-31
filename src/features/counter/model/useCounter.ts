import { useState } from 'react'

export function useCounter() {
  const [count, setCount] = useState(0)

  return {
    count,
    increment: () => setCount((value) => value + 1),
    decrement: () => setCount((value) => value - 1),
    reset: () => setCount(0),
  }
}
