import { toast } from 'react-toastify'
import { ApiError } from '@shared/lib/http/ApiError'

const serverErrorText = 'Внутренняя ошибка сервиса: повторите попытку позже'

type HandleAuthErrorArgs = {
  error: unknown
  clientErrorText: string
  skipStatuses?: number[]
}

function extractErrorDetail(data: unknown): string | null {
  if (typeof data === 'string') {
    const normalized = data.trim()
    return normalized.length > 0 ? normalized : null
  }

  if (typeof data === 'object' && data !== null && 'detail' in data) {
    const detail = (data as { detail?: unknown }).detail

    if (typeof detail === 'string') {
      const normalized = detail.trim()
      return normalized.length > 0 ? normalized : null
    }
  }

  return null
}

export function handleAuthErrorToast({ error, clientErrorText, skipStatuses = [] }: HandleAuthErrorArgs): void {
  if (error instanceof ApiError) {
    const detail = extractErrorDetail(error.data)

    if (detail) {
      toast.warn(detail)
      return
    }

    if (error.status >= 500) {
      toast.error(serverErrorText)
      return
    }

    if (error.status >= 400 && error.status < 500 && !skipStatuses.includes(error.status)) {
      toast.warn(clientErrorText)
      return
    }
  }

  toast.error(serverErrorText)
}
