import { toast } from 'react-toastify'
import { ApiError } from '@shared/lib/http/ApiError'

const serverErrorText = 'Внутренняя ошибка сервиса: повторите попытку позже'

type HandleAuthErrorArgs = {
  error: unknown
  clientErrorText: string
  skipStatuses?: number[]
}

export function handleAuthErrorToast({ error, clientErrorText, skipStatuses = [] }: HandleAuthErrorArgs): void {
  if (error instanceof ApiError) {
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
