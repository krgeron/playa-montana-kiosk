// All calls go through the kiosk Express API (Vite proxies /api → kiosk server).
// The kiosk server proxies booking/menu endpoints to external services.

const BASE = '/api'

async function validateGuest(lastName, pin) {
  const res = await fetch(`${BASE}/kiosk/validate-guest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lastName, pin }),
  })
  const data = await res.json()
  if (!res.ok) {
    const msg = Array.isArray(data.message) ? data.message[0] : data.message
    throw new Error(msg || 'Validation failed')
  }
  return data
}

async function validateToken(token) {
  const res = await fetch(`${BASE}/kiosk/validate-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Token validation failed')
  return data
}

async function fetchMenu() {
  const res = await fetch(`${BASE}/menu/categories`)
  if (!res.ok) throw new Error('Failed to load menu')
  return res.json()
}

async function placeOrder({ bookingId, guestName, guestEmail, deliveryRoom, items, notes }) {
  const res = await fetch(`${BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bookingId, guestName, guestEmail, deliveryRoom, items, notes }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || data.error || 'Failed to place order')
  return data
}

async function fetchOrder(orderId) {
  const res = await fetch(`${BASE}/orders/${orderId}`)
  if (!res.ok) throw new Error('Order not found')
  return res.json()
}

export { validateGuest, validateToken, fetchMenu, placeOrder, fetchOrder }
