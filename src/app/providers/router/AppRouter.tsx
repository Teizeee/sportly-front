import type { ReactElement } from 'react'
import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom'
import { LoginPage } from '@pages/login/ui/LoginPage'
import { RegisterPage } from '@pages/register/ui/RegisterPage'
import { AdminPage } from '@pages/admin/ui/AdminPage'
import { GymPage } from '@pages/gym/ui/GymPage'
import { getAccessToken, getUserRole, type UserRole } from '@shared/lib/auth/tokenStorage'

function getDefaultPrivatePath(role: UserRole | null): '/' | '/admin' {
  return role === 'SUPER_ADMIN' ? '/admin' : '/'
}

function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: ReactElement
  allowedRoles?: UserRole[]
}) {
  const accessToken = getAccessToken()

  if (!accessToken) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles) {
    const currentRole = getUserRole()

    if (!currentRole || !allowedRoles.includes(currentRole)) {
      return <Navigate to={getDefaultPrivatePath(currentRole)} replace />
    }
  }

  return children
}

function PublicOnlyRoute({ children }: { children: ReactElement }) {
  if (getAccessToken()) {
    return <Navigate to={getDefaultPrivatePath(getUserRole())} replace />
  }

  return children
}

function FallbackRedirect() {
  if (!getAccessToken()) {
    return <Navigate to="/login" replace />
  }

  return <Navigate to={getDefaultPrivatePath(getUserRole())} replace />
}

const appRouter = createBrowserRouter([
  {
    path: '/',
    element: (
      <ProtectedRoute allowedRoles={['GYM_ADMIN']}>
        <GymPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
        <AdminPage />
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
    path: '*',
    element: <FallbackRedirect />,
  },
])

export function AppRouter() {
  return <RouterProvider router={appRouter} />
}
