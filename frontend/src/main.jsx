import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { GuestProvider } from './context/GuestContext'
import { CartProvider } from './context/CartContext'
import router from './router'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GuestProvider>
      <CartProvider>
        <RouterProvider router={router} />
      </CartProvider>
    </GuestProvider>
  </StrictMode>
)
