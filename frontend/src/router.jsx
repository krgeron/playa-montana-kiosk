import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { useGuest } from './context/GuestContext'
import Welcome from './pages/Welcome'
import Menu from './pages/Menu'
import Cart from './pages/Cart'
import Confirmation from './pages/Confirmation'

const KitchenBoard = lazy(() => import('./pages/KitchenBoard'))
const TokenAuth = lazy(() => import('./pages/TokenAuth'))

function ProtectedRoute() {
  const { guest } = useGuest()
  if (!guest) return <Navigate to="/" replace />
  return <Outlet />
}

function LazyFallback() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-cream">
      <p className="text-ink-muted text-sm">Loading...</p>
    </div>
  )
}

const router = createBrowserRouter([
  { path: '/', element: <Welcome /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/menu', element: <Menu /> },
      { path: '/cart', element: <Cart /> },
      { path: '/confirmation', element: <Confirmation /> },
    ],
  },
  { path: '/kitchen', element: <Suspense fallback={<LazyFallback />}><KitchenBoard /></Suspense> },
  { path: '/order', element: <Suspense fallback={<LazyFallback />}><TokenAuth /></Suspense> },
  { path: '*', element: <Navigate to="/" replace /> },
])

export default router
