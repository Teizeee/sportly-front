import type { ReactElement } from 'react'
import { Navigate, createBrowserRouter } from 'react-router-dom'
import { LoginPage } from '@pages/login/ui/LoginPage'
import { RegisterPage } from '@pages/register/ui/RegisterPage'
import { UserPage } from '@pages/user/ui/UserPage'
import { getAccessToken } from '@shared/lib/auth/tokenStorage'

function ProtectedRoute({ children }: { children: ReactElement }) {
  if (!getAccessToken()) {
    return <Navigate to="/login" replace />
  }

  return children
}

function PublicOnlyRoute({ children }: { children: ReactElement }) {
  if (getAccessToken()) {
    return <Navigate to="/" replace />
  }

  return children
}

function FallbackRedirect() {
  return <Navigate to={getAccessToken() ? '/' : '/login'} replace />
}

export const appRouter = createBrowserRouter([
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <UserPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/login',
    element: (
      <PublicOnlyRoute>
        <LoginPage />
      </PublicOnlyRoute>
    ),
  },
  {
    path: '/register',
    element: (
      <PublicOnlyRoute>
        <RegisterPage />
      </PublicOnlyRoute>
    ),
  },
  {
    path: '/profile',
    element: <Navigate to="/" replace />,
  },
  {
    path: '*',
    element: <FallbackRedirect />,
  },
])
