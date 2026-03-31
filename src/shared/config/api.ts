const defaultApiBaseUrl = 'http://localhost:8000/api/v1/'

const envApiBaseUrl = import.meta.env.VITE_API_BASE_URL

export const API_BASE_URL =
  typeof envApiBaseUrl === 'string' && envApiBaseUrl.length > 0
    ? envApiBaseUrl.endsWith('/')
      ? envApiBaseUrl
      : `${envApiBaseUrl}/`
    : defaultApiBaseUrl
