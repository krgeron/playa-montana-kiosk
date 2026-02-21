import { createBrowserRouter, Navigate } from 'react-router-dom'
import Welcome from './pages/Welcome'
import Menu from './pages/Menu'
import Cart from './pages/Cart'
import Confirmation from './pages/Confirmation'

const router = createBrowserRouter([
  { path: '/', element: <Welcome /> },
  { path: '/menu', element: <Menu /> },
  { path: '/cart', element: <Cart /> },
  { path: '/confirmation', element: <Confirmation /> },
  { path: '*', element: <Navigate to="/" replace /> },
])

export default router
