import { useEffect } from 'react'
import type { RefObject } from 'react'

export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  onOutsideClick: () => void,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled) {
      return
    }

    const handleOutsideClick = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) {
        onOutsideClick()
      }
    }

    window.addEventListener('mousedown', handleOutsideClick)

    return () => {
      window.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [enabled, onOutsideClick, ref])
}
