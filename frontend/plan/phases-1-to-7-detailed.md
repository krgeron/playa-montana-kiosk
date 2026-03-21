# Phases 1–7: Detailed Implementation Plan (Kiosk System)

> Cross-reference: `high-level.md` for phase summaries, `architecture.md` for
> system design, `phase-8a-menu-app-endpoints.md` and
> `phase-8b-booking-app-endpoints.md` for external system changes.

---

## Phase 1: Frontend Auth Alignment

**Goal:** Update the existing kiosk UI from room-number identity to
surname + PIN booking-based identity. Everything still runs on mock data.

### 1.1 Update `GuestContext.jsx`

**File:** `frontend/src/context/GuestContext.jsx`

Current guest shape:
```javascript
{ roomNumber, lastName, displayName, mobile }
```

New guest shape:
```javascript
{
  bookingId,       // number — from Booking App
  lastName,        // string — entered by guest or from token
  displayName,     // string — full name from Booking App
  guestEmail,      // string | null — for email confirmations
  rooms,           // array — [{ id, roomNumber, name }]
  deliveryRoom,    // string | null — selected room for delivery
}
```

Changes:
- Update `login()` signature to accept booking-based data
- Add `setDeliveryRoom(roomNumber)` function
- Remove `mobile` from shape

### 1.2 Update `Welcome.jsx`

**File:** `frontend/src/pages/Welcome.jsx`

Changes:
- Remove "Room Number" input field
- Remove "Mobile Number" input field
- Keep "Last Name" input field
- Add "4-Digit PIN" input field:
  - `type="password"`, `inputMode="numeric"`, `maxLength={4}`
  - `pattern="[0-9]{4}"`, `autoComplete="off"`
- Update `handleSubmit()`:
  - Call `validateGuest(lastName, pin)` instead of `validateGuest(roomNumber, lastName)`
  - On success, call `login()` with booking-based data
- Update placeholder text and labels
- Update the subtitle: "Enter your last name and PIN to start ordering."

### 1.3 Update `api.js` mock layer

**File:** `frontend/src/api.js`

Changes to `mockValidateGuest`:
```javascript
async function mockValidateGuest(lastName, pin) {
  await delay()
  if (!lastName || !pin || pin.length !== 4) {
    return { valid: false }
  }
  return {
    valid: true,
    bookingId: 42,
    guestName: `${lastName.charAt(0).toUpperCase() + lastName.slice(1)}`,
    guestEmail: 'guest@example.com',
    rooms: [
      { id: 1, roomNumber: '204', name: 'Deluxe 204' },
    ],
    checkOut: '2026-03-15T12:00:00.000Z',
  }
}
```

Changes to `mockPlaceOrder`:
```javascript
async function mockPlaceOrder({ bookingId, items, notes }) {
  await delay(600)
  const orderId = Math.floor(1000 + Math.random() * 9000)
  const total = items.reduce((sum, i) => {
    const found = MOCK_MENU.flatMap(c => c.items).find(m => m.id === i.menuItemId)
    return sum + (found?.price ?? 0) * i.quantity
  }, 0)
  return { orderId, total }
}
```

Add `mockValidateToken`:
```javascript
async function mockValidateToken(token) {
  await delay()
  return {
    valid: true,
    bookingId: 42,
    guestName: 'Santos',
    guestEmail: 'santos@example.com',
    rooms: [{ id: 1, roomNumber: '204', name: 'Deluxe 204' }],
  }
}
```

Update exports:
```javascript
export const validateGuest = USE_MOCK ? mockValidateGuest : realValidateGuest
export const validateToken = USE_MOCK ? mockValidateToken : realValidateToken
export const fetchMenu     = USE_MOCK ? mockFetchMenu     : realFetchMenu
export const placeOrder    = USE_MOCK ? mockPlaceOrder    : realPlaceOrder
```

Update `realValidateGuest`:
```javascript
async function realValidateGuest(lastName, pin) {
  const res = await fetch(`${BASE}/kiosk/validate-guest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lastName, pin }),
  })
  return res.json()
}
```

Add `realValidateToken`:
```javascript
async function realValidateToken(token) {
  const res = await fetch(`${BASE}/kiosk/validate-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  })
  return res.json()
}
```

### 1.4 Update `Menu.jsx` header

**File:** `frontend/src/pages/Menu.jsx`

Changes:
- Replace `guest?.roomNumber` display with `guest?.displayName`
- Replace `guest?.lastName` display with delivery room if selected:
  `guest?.deliveryRoom ? \`Rm ${guest.deliveryRoom}\` : ''`
- Remove mobile number display
- Keep clock, cart indicator, clear cart, and logout button

### 1.5 Update `Cart.jsx`

**File:** `frontend/src/pages/Cart.jsx`

Changes:
- Update summary line from `Room {guest?.roomNumber} · {guest?.displayName}`
  to `{guest?.displayName}`
- Update footer text from `Charged to Room {guest?.roomNumber}` to
  `Charged to your booking`
- Update `handlePlaceOrder()` to pass `bookingId` instead of `roomNumber`:
  ```javascript
  const result = await placeOrder({
    bookingId: guest.bookingId,
    items: orderItems,
    notes: orderNotes,
  })
  ```

### 1.6 Update `Confirmation.jsx`

**File:** `frontend/src/pages/Confirmation.jsx`

Changes:
- Replace room number references with guest name
- Fix missing timer cleanup:
  ```javascript
  useEffect(() => {
    const timer = setTimeout(() => {
      handleDone()
    }, 5000)
    return () => clearTimeout(timer)
  }, [])
  ```

### 1.7 Optional: Room selection after login

If the booking has multiple rooms, show a selection screen.

**New file:** `frontend/src/pages/RoomSelect.jsx`

- Shows after successful login if `rooms.length > 1`
- Displays room cards (room number + name)
- Guest taps a room → stored as `deliveryRoom` in GuestContext
- If only 1 room, auto-select and skip this page
- Add `/room-select` route in `router.jsx`

---

## Phase 2: Backend Foundation

**Goal:** Build the kiosk's own Node.js + Express + SQLite backend.

### 2.1 Project setup

**Create directory:** `backend/`

```bash
mkdir -p backend/src/{db,routes,socket}
cd backend
npm init -y
npm install express better-sqlite3 cors socket.io
npm install -D nodemon
```

**File:** `backend/package.json` — add scripts:
```json
{
  "scripts": {
    "dev": "nodemon src/index.js",
    "start": "node src/index.js"
  }
}
```

### 2.2 Entry point

**File:** `backend/src/index.js`

```javascript
const express = require('express')
const cors = require('cors')
const http = require('http')
const { Server } = require('socket.io')
const { initDatabase } = require('./db')

const app = express()
const server = http.createServer(app)
const io = new Server(server, { cors: { origin: '*' } })

app.use(cors())
app.use(express.json())

// Make io available to routes
app.set('io', io)

// Initialize database
initDatabase()

// Routes
app.use('/api/menu', require('./routes/menu'))
app.use('/api/orders', require('./routes/orders'))
app.use('/api/kiosk', require('./routes/kiosk'))

// Socket.io
require('./socket')(io)

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }))

const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`Kiosk backend running on port ${PORT}`)
})
```

### 2.3 Database schema

**File:** `backend/src/db/schema.js`

```javascript
const CREATE_ORDERS = `
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER NOT NULL,
    guest_name TEXT NOT NULL,
    guest_email TEXT,
    delivery_room TEXT,
    status TEXT NOT NULL DEFAULT 'pending'
      CHECK(status IN ('pending', 'preparing', 'ready', 'served')),
    total_amount DECIMAL(10,2) NOT NULL,
    notes TEXT,
    charged BOOLEAN NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT (datetime('now')),
    updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
  )
`

const CREATE_ORDER_ITEMS = `
  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    menu_item_id INTEGER NOT NULL,
    item_name TEXT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL,
    item_notes TEXT
  )
`

module.exports = { CREATE_ORDERS, CREATE_ORDER_ITEMS }
```

**File:** `backend/src/db/index.js`

```javascript
const Database = require('better-sqlite3')
const path = require('path')
const { CREATE_ORDERS, CREATE_ORDER_ITEMS } = require('./schema')

const DB_PATH = path.join(__dirname, '..', '..', 'database.sqlite')
let db

function initDatabase() {
  db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.exec(CREATE_ORDERS)
  db.exec(CREATE_ORDER_ITEMS)
  return db
}

function getDb() {
  if (!db) throw new Error('Database not initialized')
  return db
}

module.exports = { initDatabase, getDb }
```

### 2.4 Menu proxy route

**File:** `backend/src/routes/menu.js`

Proxies to the Menu App or returns mock data.

```javascript
const router = require('express').Router()

const USE_MOCK = process.env.USE_MOCK !== 'false'
const MENU_APP_URL = process.env.MENU_APP_URL || 'http://localhost:3002'

// Mock data (same as frontend mock, for consistency)
const MOCK_MENU = [ /* ... copy from frontend api.js ... */ ]

router.get('/categories', async (req, res) => {
  if (USE_MOCK) {
    return res.json(MOCK_MENU)
  }

  try {
    const response = await fetch(`${MENU_APP_URL}/api/v1/kiosk/menu`)
    const json = await response.json()
    res.json(json.data)
  } catch (err) {
    res.status(503).json({ error: 'Menu service unavailable' })
  }
})

module.exports = router
```

### 2.5 Orders route

**File:** `backend/src/routes/orders.js`

```javascript
const router = require('express').Router()
const { getDb } = require('../db')

// POST /api/orders — place a new order
router.post('/', (req, res) => {
  const { bookingId, guestName, guestEmail, deliveryRoom, items, notes } = req.body
  const db = getDb()

  const totalAmount = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)

  const insertOrder = db.prepare(`
    INSERT INTO orders (booking_id, guest_name, guest_email, delivery_room,
                        total_amount, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  const insertItem = db.prepare(`
    INSERT INTO order_items (order_id, menu_item_id, item_name, unit_price,
                             quantity, item_notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  const transaction = db.transaction(() => {
    const result = insertOrder.run(
      bookingId, guestName, guestEmail || null,
      deliveryRoom || null, totalAmount, notes || null
    )
    const orderId = result.lastInsertRowid

    for (const item of items) {
      insertItem.run(
        orderId, item.menuItemId, item.itemName,
        item.unitPrice, item.quantity, item.itemNotes || null
      )
    }

    return orderId
  })

  try {
    const orderId = transaction()
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId)

    // Emit to kitchen displays
    const io = req.app.get('io')
    io.emit('new_order', { order })

    res.status(201).json({ orderId, total: totalAmount })
  } catch (err) {
    res.status(500).json({ error: 'Failed to place order' })
  }
})

// GET /api/orders — all active orders (kitchen display)
router.get('/', (req, res) => {
  const db = getDb()
  const orders = db.prepare(`
    SELECT * FROM orders
    WHERE status != 'served'
    ORDER BY created_at ASC
  `).all()

  // Attach items to each order
  const getItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?')
  const result = orders.map(order => ({
    ...order,
    items: getItems.all(order.id),
  }))

  res.json(result)
})

// GET /api/orders/new?since=<timestamp> — polling fallback
router.get('/new', (req, res) => {
  const { since } = req.query
  if (!since) return res.status(400).json({ error: 'Missing since parameter' })

  const db = getDb()
  const orders = db.prepare(`
    SELECT * FROM orders
    WHERE created_at > ? OR updated_at > ?
    ORDER BY created_at ASC
  `).all(since, since)

  const getItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?')
  const result = orders.map(order => ({
    ...order,
    items: getItems.all(order.id),
  }))

  res.json(result)
})

// PATCH /api/orders/:id/status — update order status
router.patch('/:id/status', (req, res) => {
  const { id } = req.params
  const { status } = req.body
  const validStatuses = ['pending', 'preparing', 'ready', 'served']

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' })
  }

  const db = getDb()
  const result = db.prepare(`
    UPDATE orders
    SET status = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(status, id)

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Order not found' })
  }

  // Emit to kitchen displays
  const io = req.app.get('io')
  io.emit('order_updated', { orderId: Number(id), status })

  res.json({ orderId: Number(id), status })
})

module.exports = router
```

### 2.6 Kiosk proxy route (validation + charging)

**File:** `backend/src/routes/kiosk.js`

Proxies guest validation and charge requests to the Booking App, or returns
mock responses.

```javascript
const router = require('express').Router()

const USE_MOCK = process.env.USE_MOCK !== 'false'
const BOOKING_APP_URL = process.env.BOOKING_APP_URL || 'http://localhost:3000'

router.post('/validate-guest', async (req, res) => {
  if (USE_MOCK) {
    const { lastName, pin } = req.body
    if (!lastName || !pin) return res.json({ valid: false })
    return res.json({
      valid: true,
      bookingId: 42,
      guestName: lastName.charAt(0).toUpperCase() + lastName.slice(1),
      guestEmail: 'guest@example.com',
      rooms: [{ id: 1, roomNumber: '204', name: 'Deluxe 204' }],
      checkOut: new Date(Date.now() + 5 * 86400000).toISOString(),
    })
  }

  try {
    const response = await fetch(
      `${BOOKING_APP_URL}/api/v1/kiosk/validate-guest`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
      }
    )
    const data = await response.json()
    res.json(data)
  } catch (err) {
    res.status(503).json({ error: 'Booking service unavailable' })
  }
})

router.post('/validate-token', async (req, res) => {
  if (USE_MOCK) {
    return res.json({
      valid: true,
      bookingId: 42,
      guestName: 'Santos',
      guestEmail: 'santos@example.com',
      rooms: [{ id: 1, roomNumber: '204', name: 'Deluxe 204' }],
    })
  }

  try {
    const response = await fetch(
      `${BOOKING_APP_URL}/api/v1/kiosk/validate-token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
      }
    )
    const data = await response.json()
    res.json(data)
  } catch (err) {
    res.status(503).json({ error: 'Booking service unavailable' })
  }
})

router.post('/charge-booking', async (req, res) => {
  if (USE_MOCK) {
    return res.json({ success: true, chargeId: 'MOCK-' + Date.now() })
  }

  try {
    const response = await fetch(
      `${BOOKING_APP_URL}/api/v1/kiosk/charge-booking`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
      }
    )
    const data = await response.json()
    res.json(data)
  } catch (err) {
    res.status(503).json({ error: 'Booking service unavailable' })
  }
})

module.exports = router
```

### 2.7 Socket.io setup

**File:** `backend/src/socket/index.js`

```javascript
module.exports = function(io) {
  io.on('connection', (socket) => {
    console.log(`Kitchen display connected: ${socket.id}`)
    socket.emit('connection_ack', { timestamp: new Date().toISOString() })

    socket.on('disconnect', () => {
      console.log(`Kitchen display disconnected: ${socket.id}`)
    })
  })
}
```

---

## Phase 3: Full-Stack Order Flow

**Goal:** Wire the frontend to the backend. Complete ordering works through
real API calls.

### 3.1 Update `api.js` — switch to backend

**File:** `frontend/src/api.js`

Change the real API implementations to call the kiosk backend (which in turn
proxies to Menu App and Booking App):

```javascript
const BASE = '/api'

async function realValidateGuest(lastName, pin) {
  const res = await fetch(`${BASE}/kiosk/validate-guest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lastName, pin }),
  })
  return res.json()
}

async function realFetchMenu() {
  const res = await fetch(`${BASE}/menu/categories`)
  if (!res.ok) throw new Error('Failed to load menu')
  return res.json()
}

async function realPlaceOrder({ bookingId, guestName, guestEmail,
                                 deliveryRoom, items, notes }) {
  const res = await fetch(`${BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      bookingId, guestName, guestEmail, deliveryRoom,
      items: items.map(i => ({
        menuItemId: i.menuItemId,
        itemName: i.itemName,
        unitPrice: i.unitPrice,
        quantity: i.quantity,
        itemNotes: i.notes,
      })),
      notes,
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to place order')
  return data
}
```

### 3.2 Update `Cart.jsx` — pass full item data to placeOrder

The backend needs `itemName` and `unitPrice` for snapshotting.

In `handlePlaceOrder()`:
```javascript
const orderItems = items.map(i => ({
  menuItemId: i.id,
  itemName: i.name,
  unitPrice: i.price,
  quantity: i.quantity,
  notes: i.notes,
}))

const result = await placeOrder({
  bookingId: guest.bookingId,
  guestName: guest.displayName,
  guestEmail: guest.guestEmail,
  deliveryRoom: guest.deliveryRoom,
  items: orderItems,
  notes: orderNotes,
})
```

### 3.3 Route guards

**File:** `frontend/src/router.jsx`

Add a wrapper component or use `loader` functions to redirect unauthenticated
users:

```javascript
// Option: create a ProtectedRoute component
function ProtectedRoute({ children }) {
  const { guest } = useGuest()
  if (!guest) return <Navigate to="/" replace />
  return children
}
```

Apply to `/menu`, `/cart`, `/confirmation` routes.

### 3.4 Verify proxy config

**File:** `frontend/vite.config.js`

Already configured: `'/api': 'http://localhost:3001'`. No changes needed.

### 3.5 End-to-end test

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. With `USE_MOCK=true` on backend: full flow should work with mock data
4. Open browser, complete the ordering flow
5. Verify: `curl http://localhost:3001/api/orders` shows the placed order

---

## Phase 4: Kitchen Display

**Goal:** Build the kitchen-facing order board.

### 4.1 Create `useOrderStream` hook

**File:** `frontend/src/hooks/useOrderStream.js`

```javascript
import { useState, useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'

const POLL_INTERVAL = 5000

export default function useOrderStream() {
  const [orders, setOrders] = useState([])
  const [connected, setConnected] = useState(false)
  const [newOrderAlert, setNewOrderAlert] = useState(null)
  const lastFetchTime = useRef(new Date().toISOString())
  const pollTimer = useRef(null)

  // Fetch all active orders
  const fetchOrders = useCallback(async () => {
    const res = await fetch('/api/orders')
    const data = await res.json()
    setOrders(data)
  }, [])

  // Poll for new orders (fallback)
  const startPolling = useCallback(() => {
    if (pollTimer.current) return
    pollTimer.current = setInterval(async () => {
      const res = await fetch(`/api/orders/new?since=${lastFetchTime.current}`)
      const data = await res.json()
      if (data.length > 0) {
        lastFetchTime.current = new Date().toISOString()
        fetchOrders()
      }
    }, POLL_INTERVAL)
  }, [fetchOrders])

  const stopPolling = useCallback(() => {
    if (pollTimer.current) {
      clearInterval(pollTimer.current)
      pollTimer.current = null
    }
  }, [])

  useEffect(() => {
    fetchOrders()

    const socket = io(window.location.origin)

    socket.on('connect', () => {
      setConnected(true)
      stopPolling()
    })

    socket.on('disconnect', () => {
      setConnected(false)
      startPolling()
    })

    socket.on('new_order', ({ order }) => {
      fetchOrders()
      setNewOrderAlert(order.id)
      setTimeout(() => setNewOrderAlert(null), 3000)
    })

    socket.on('order_updated', ({ orderId, status }) => {
      setOrders(prev => prev.map(o =>
        o.id === orderId ? { ...o, status } : o
      ))
    })

    return () => {
      socket.disconnect()
      stopPolling()
    }
  }, [])

  // Update order status
  const updateStatus = useCallback(async (orderId, status) => {
    await fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
  }, [])

  return { orders, connected, newOrderAlert, updateStatus }
}
```

### 4.2 Install socket.io-client

```bash
cd frontend && npm install socket.io-client
```

### 4.3 Create components

**File:** `frontend/src/components/StatusBadge.jsx`
- Props: `status` (pending | preparing | ready | served)
- Renders colored badge with label

**File:** `frontend/src/components/OrderCard.jsx`
- Props: `order`, `onStatusChange`
- Shows: order #, guest name (+ room), elapsed time, item list, notes
- Action button to advance status

### 4.4 Create `KitchenBoard.jsx` page

**File:** `frontend/src/pages/KitchenBoard.jsx`

- Uses `useOrderStream()` hook
- 3-column layout: Pending | Preparing | Ready
- Header: title, connection indicator (green/red dot), clock
- Sound alert on new orders (`new Audio('/alert.mp3').play()`)
- Wake Lock API to keep screen on

### 4.5 Add route

**File:** `frontend/src/router.jsx`

Add: `{ path: '/kitchen', element: <KitchenBoard /> }`

No auth required — accessed by direct URL on kitchen display.

### 4.6 Add alert sound

Place an audio file at `frontend/public/alert.mp3` (a short notification chime).

---

## Phase 5: PWA & Offline

**Goal:** Make the app installable.

### 5.1 Install vite-plugin-pwa

```bash
cd frontend && npm install -D vite-plugin-pwa
```

### 5.2 Update `vite.config.js`

```javascript
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Playa Montana — Order',
        short_name: 'Order',
        description: 'Resort restaurant ordering system',
        theme_color: '#59A310',
        background_color: '#f5f0e8',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /\/api\/menu\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'menu-cache',
              expiration: { maxAgeSeconds: 300 },
            },
          },
        ],
      },
    }),
  ],
})
```

### 5.3 Create app icons

Place at:
- `frontend/public/icon-192.png`
- `frontend/public/icon-512.png`

### 5.4 Offline indicator

Create a small component that shows when the app is offline:

**File:** `frontend/src/components/OfflineIndicator.jsx`

Uses `navigator.onLine` and `online`/`offline` events. Shows a bar at the
top: "You're offline — some features may be unavailable."

---

## Phase 6: QR Token Authentication

**Goal:** Guests scan a QR code and go straight to the menu.

### 6.1 Add token route

**File:** `frontend/src/router.jsx`

Add: `{ path: '/order', element: <TokenAuth /> }`

### 6.2 Create `TokenAuth.jsx` page

**File:** `frontend/src/pages/TokenAuth.jsx`

```javascript
// On mount:
// 1. Extract ?token= from URL
// 2. Call validateToken(token)
// 3. On success: populate GuestContext, redirect to /menu
// 4. On failure: show error with manual login button
```

### 6.3 Update `api.js`

Add `validateToken` to exports (already prepared in Phase 1).

---

## Phase 7: Fraud Prevention & Email

**Goal:** Add spending limits and email order confirmations.

### 7.1 Spending limits (backend)

**File:** `backend/src/routes/orders.js`

Before saving an order in `POST /api/orders`:

```javascript
const ORDER_CAP = Number(process.env.ORDER_CAP || 5000)
const DAILY_CAP = Number(process.env.DAILY_CAP || 15000)

// Check per-order cap
if (totalAmount > ORDER_CAP) {
  return res.status(403).json({
    error: 'spending_limit',
    message: `Order exceeds the ₱${ORDER_CAP} limit. Please contact the front desk.`,
  })
}

// Check daily cap
const today = new Date().toISOString().split('T')[0]
const dailyTotal = db.prepare(`
  SELECT COALESCE(SUM(total_amount), 0) as total
  FROM orders
  WHERE booking_id = ? AND date(created_at) = ?
`).get(bookingId, today)

if (dailyTotal.total + totalAmount > DAILY_CAP) {
  return res.status(403).json({
    error: 'spending_limit',
    message: `Daily limit of ₱${DAILY_CAP} reached. Please contact the front desk.`,
  })
}
```

### 7.2 Spending limit UI (frontend)

**File:** `frontend/src/pages/Cart.jsx`

In the error handler for `placeOrder`, detect spending limit errors:

```javascript
catch (err) {
  if (err.error === 'spending_limit') {
    setError(err.message)
  } else {
    setError('Failed to place order. Please try again.')
  }
}
```

### 7.3 Email confirmations (backend)

Install: `cd backend && npm install nodemailer`

**File:** `backend/src/email.js`

```javascript
const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  } : undefined,
})

async function sendOrderConfirmation(order, items) {
  if (!order.guest_email) return

  const itemLines = items
    .map(i => `${i.quantity}× ${i.item_name} — ₱${(i.unit_price * i.quantity).toFixed(2)}`)
    .join('\n')

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'orders@playamontana.com',
      to: order.guest_email,
      subject: `Order #${order.id} Confirmed — Playa Montana`,
      text: [
        `Hi ${order.guest_name},`,
        '',
        `Your order #${order.id} has been placed.`,
        '',
        itemLines,
        '',
        `Total: ₱${order.total_amount.toFixed(2)}`,
        `Charged to your booking.`,
        '',
        `Didn't place this order? Contact the front desk immediately.`,
      ].join('\n'),
    })
  } catch (err) {
    console.error('Failed to send order email:', err.message)
  }
}

module.exports = { sendOrderConfirmation }
```

In `backend/src/routes/orders.js`, after saving the order:

```javascript
const { sendOrderConfirmation } = require('../email')

// After successful order creation (non-blocking):
sendOrderConfirmation(order, items).catch(() => {})
```

### 7.4 Environment variables

Add to `backend/.env`:

```bash
ORDER_CAP=5000
DAILY_CAP=15000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=orders@playamontana.com
```

---

## File Summary

### New files to create

| Phase | File | Purpose |
|---|---|---|
| 2 | `backend/package.json` | Backend package config |
| 2 | `backend/src/index.js` | Express entry point |
| 2 | `backend/src/db/schema.js` | Table definitions |
| 2 | `backend/src/db/index.js` | SQLite connection |
| 2 | `backend/src/routes/menu.js` | Menu proxy |
| 2 | `backend/src/routes/orders.js` | Order CRUD |
| 2 | `backend/src/routes/kiosk.js` | Auth/charge proxy |
| 2 | `backend/src/socket/index.js` | Socket.io setup |
| 4 | `frontend/src/hooks/useOrderStream.js` | WS + polling hook |
| 4 | `frontend/src/components/OrderCard.jsx` | Order card |
| 4 | `frontend/src/components/StatusBadge.jsx` | Status indicator |
| 4 | `frontend/src/pages/KitchenBoard.jsx` | Kitchen display |
| 5 | `frontend/src/components/OfflineIndicator.jsx` | Offline banner |
| 6 | `frontend/src/pages/TokenAuth.jsx` | QR token handler |
| 7 | `backend/src/email.js` | Email sending |

### Existing files to modify

| Phase | File | Changes |
|---|---|---|
| 1 | `frontend/src/context/GuestContext.jsx` | Booking-based shape |
| 1 | `frontend/src/pages/Welcome.jsx` | Surname + PIN form |
| 1 | `frontend/src/api.js` | New mock/real implementations |
| 1 | `frontend/src/pages/Menu.jsx` | Header updates |
| 1 | `frontend/src/pages/Cart.jsx` | Booking-based ordering |
| 1 | `frontend/src/pages/Confirmation.jsx` | Fix timer, update text |
| 3 | `frontend/src/router.jsx` | Route guards |
| 4 | `frontend/src/router.jsx` | Add /kitchen route |
| 5 | `frontend/vite.config.js` | PWA plugin |
| 6 | `frontend/src/router.jsx` | Add /order route |
