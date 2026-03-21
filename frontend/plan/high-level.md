# High-Level Implementation Plan

> Reference: `architecture.md` for full design, `CLAUDE.md` for current state.

---

## Phase Overview

| Phase | Name | Purpose | Depends On |
|---|---|---|---|
| 1 | Frontend Auth Alignment | Update existing UI to match booking-based identity | — |
| 2 | Backend Foundation | Build the server, database, and order API | — |
| 3 | Full-Stack Order Flow | Wire frontend to backend, end-to-end ordering | 1, 2 |
| 4 | Kitchen Display | Real-time order board for kitchen staff | 3 |
| 5 | PWA & Offline | Make the app installable on tablets and phones | 3 |
| 6 | QR Token Authentication | Second auth method via signed URL | 3 |
| 7 | Fraud Prevention & Email | Spending limits and email confirmations | 3 |
| 8 | External Integrations | Connect to real Menu App and Booking App | 3 |
| 9 | Deployment & Operations | Kiosk lockdown, networking, QR printing | 4, 5, 6 |

```
Phase 1 ──┐
           ├── Phase 3 ──┬── Phase 4 ──┐
Phase 2 ──┘              ├── Phase 5 ──┼── Phase 9
                         ├── Phase 6 ──┘
                         ├── Phase 7
                         └── Phase 8
```

Phases 4–8 can be worked on in parallel once Phase 3 is complete.

---

## Phase 1: Frontend Auth Alignment

**Purpose:** Update the existing kiosk UI from room-number-based identity to
booking-based identity (surname + PIN), matching the architecture decisions.

**Why first:** The frontend already works end-to-end on mock data. Aligning the
auth model now means Phase 3 integration is clean — no rework.

### Tasks

1.1. **Update `GuestContext.jsx`**
- Change guest shape from `{ roomNumber, lastName, displayName, mobile }` to
  `{ bookingId, lastName, displayName, guestEmail, rooms, deliveryRoom }`
- Update `login()` to accept booking-based data from the validate-guest response
- Add `setDeliveryRoom()` for optional room selection

1.2. **Update `Welcome.jsx`**
- Replace "Room Number" field with "Last Name" (already exists) and "4-Digit PIN"
- Remove the "Mobile Number" field (mobile comes from booking data, not guest input)
- Update form submission to call `validateGuest(lastName, pin)` instead of
  `validateGuest(roomNumber, lastName)`
- PIN field: `inputMode="numeric"`, `maxLength={4}`, `pattern="[0-9]{4}"`

1.3. **Update `api.js` mock layer**
- Update `mockValidateGuest(lastName, pin)` to return booking-based response:
  `{ valid, bookingId, guestName, guestEmail, rooms, checkOut }`
- Update `mockPlaceOrder()` to accept `bookingId` instead of `roomNumber`
- Add `mockValidateToken(token)` for QR auth (placeholder for Phase 6)

1.4. **Update `Menu.jsx` header**
- Show guest surname instead of room number as primary identifier
- Show delivery room if selected (e.g., "Santos · Rm 204")
- Remove mobile number display

1.5. **Update `Cart.jsx`**
- Change "Charged to Room 204" to "Charged to booking (Santos)"
- Update `handlePlaceOrder()` to pass `bookingId` instead of `roomNumber`

1.6. **Update `Confirmation.jsx`**
- Replace room number references with guest name / booking reference
- Fix the timer cleanup (currently missing `return () => clearTimeout(timer)`)

1.7. **Optional: Room selection step**
- If booking has multiple rooms, show a room picker after login (for delivery)
- If booking has one room, auto-select it
- Store selected room in GuestContext as `deliveryRoom`

### Deliverable
The kiosk flow works end-to-end on mock data with the new surname+PIN
identity model. No backend needed yet.

---

## Phase 2: Backend Foundation

**Purpose:** Build the Node.js + Express server with SQLite database and core
order management API.

**Why now:** The backend can be built in parallel with Phase 1. Neither depends
on the other.

### Tasks

2.1. **Project setup**
- Create `backend/` directory with `package.json`
- Install dependencies: `express`, `better-sqlite3`, `cors`, `socket.io`
- Set up entry point (`backend/src/index.js`)
- Configure CORS to allow frontend origin

2.2. **Database schema**
- Create SQLite database initialization (`backend/src/db/schema.js`)
- `orders` table: id, booking_id, guest_name, guest_email, delivery_room,
  status, total_amount, notes, charged, created_at, updated_at
- `order_items` table: id, order_id, menu_item_id, item_name, unit_price,
  quantity, item_notes

2.3. **Seed data**
- Create seed script with sample orders for development/testing

2.4. **Mock integration routes**
- `POST /api/mock/validate-guest` — accepts `{ lastName, pin }`, returns
  booking data (mirrors what Booking App will provide)
- `POST /api/mock/validate-token` — accepts `{ token }`, returns booking data
- `POST /api/mock/charge-booking` — accepts `{ bookingId, amount }`, returns
  success
- `GET /api/menu/categories` — returns mock menu data (mirrors Menu App response)

2.5. **Order routes**
- `POST /api/orders` — create order, save to SQLite, return order ID + total
- `GET /api/orders` — list active orders (status != "served"), for kitchen
- `GET /api/orders/new?since=<timestamp>` — orders created after timestamp
  (polling fallback)
- `PATCH /api/orders/:id/status` — update status (pending → preparing → ready
  → served), update `updated_at`

2.6. **Socket.io setup**
- Initialize Socket.io server alongside Express
- Emit `new_order` when an order is created
- Emit `order_updated` when status changes
- Emit `connection_ack` on client connect

### Deliverable
Backend runs on port 3001, serves mock menu/auth data, accepts and stores
orders in SQLite, broadcasts real-time events via Socket.io. Testable via
curl/Postman.

---

## Phase 3: Full-Stack Order Flow

**Purpose:** Connect the frontend to the backend. The complete ordering flow
works through the real API instead of in-memory mocks.

### Tasks

3.1. **Switch API layer**
- Set `USE_MOCK = false` in `api.js`
- Verify `realValidateGuest()`, `realFetchMenu()`, `realPlaceOrder()` work
  against the backend endpoints
- Update request/response shapes to match the booking-based contracts

3.2. **Update Vite proxy**
- Confirm `vite.config.js` proxies `/api` to `http://localhost:3001` (already
  configured)

3.3. **Error handling**
- Handle backend-down scenario gracefully (show "Service unavailable" message)
- Handle network timeout
- Handle validation errors from backend (invalid PIN, expired session)

3.4. **End-to-end testing**
- Manually test: Welcome → validate guest → Menu → add items → Cart → place
  order → Confirmation
- Verify order appears in `GET /api/orders` response
- Verify order is stored in SQLite

3.5. **Route guards**
- Redirect to `/` if guest is not authenticated (accessing `/menu`, `/cart`,
  `/confirmation` directly)
- Redirect to `/menu` if cart is empty and user hits `/cart`

### Deliverable
The complete ordering flow works through the backend. Orders are persisted in
SQLite. Mock data is no longer used (but `USE_MOCK` toggle still works as
fallback for offline development).

---

## Phase 4: Kitchen Display

**Purpose:** Build the kitchen-facing order board with real-time updates and
tappable status progression.

### Tasks

4.1. **Kitchen page (`/kitchen` route)**
- Create `KitchenBoard.jsx` page
- Add `/kitchen` to `router.jsx`
- Full-screen layout, no login required (accessed via direct URL)

4.2. **Order card component**
- `OrderCard.jsx` — shows order number, guest name, delivery room, elapsed
  time, itemized list, notes, and status action button
- `StatusBadge.jsx` — color-coded status indicator (red/yellow/green)

4.3. **3-column Kanban layout**
- Columns: Pending, Preparing, Ready
- Orders grouped by status, sorted by time (oldest first)
- Column headers show count (e.g., "PENDING (2)")
- Served orders fade out and disappear after a short delay

4.4. **Real-time updates (`useOrderStream` hook)**
- Connect to Socket.io server
- Listen for `new_order` and `order_updated` events
- Update local order state in real time
- Auto-reconnect on disconnect

4.5. **Polling fallback**
- If Socket.io connection fails, fall back to polling
  `GET /api/orders/new?since=<timestamp>` every 5 seconds
- Resume Socket.io when connection is restored, stop polling

4.6. **Sound and visual alerts**
- Play a notification sound when a new order arrives
- Flash/highlight new order cards briefly
- Keep screen awake (Wake Lock API)

4.7. **Status update interaction**
- Tappable buttons: "PREPARING" (on pending), "READY" (on preparing),
  "SERVED" (on ready)
- Call `PATCH /api/orders/:id/status` on tap
- Optimistic UI update (move card immediately, revert on error)

4.8. **Kitchen header**
- Show "KITCHEN ORDERS" title
- Live connection indicator (green dot = connected, red = disconnected)
- Current time display

### Deliverable
Kitchen staff can view live orders on a mounted display. New orders trigger
sound alerts. Staff tap to advance order status. Works over WebSocket with
automatic polling fallback.

---

## Phase 5: PWA & Offline

**Purpose:** Make the app installable on Android tablets and guest phones.
Cache assets and menu data for fast loads and basic offline support.

### Tasks

5.1. **Install `vite-plugin-pwa`**
- Add to Vite config
- Configure Workbox for asset caching

5.2. **Web app manifest**
- App name: "Playa Montana — Order"
- Short name: "Order"
- Display mode: `standalone`
- Theme color: `#59A310`
- Background color: `#f5f0e8`
- Icons: 192x192 and 512x512 PNG (resort branding)
- Start URL: `/`

5.3. **Service worker caching strategy**
- **Static assets** (JS, CSS, images): Cache-first (precache on install)
- **Menu data** (`/api/menu/categories`): Network-first with cache fallback
  (show cached menu if network is unavailable)
- **Order submission** (`POST /api/orders`): Network-only (no offline queuing
  in v1 — show clear error message)
- **Kitchen data** (`/api/orders`): Network-only (real-time data, no caching)

5.4. **Offline UI**
- If network is unavailable when placing an order, show a clear message:
  "You're offline. Please check your connection and try again."
- If menu is served from cache, show a subtle indicator: "Showing cached menu"

5.5. **Install prompt**
- On Android Chrome, intercept the `beforeinstallprompt` event
- Show a custom "Add to Home Screen" banner on first visit (dismissible)

5.6. **App icons and splash screen**
- Design/generate PWA icons at required sizes
- Configure splash screen colors to match brand

### Deliverable
The app is installable from Chrome on Android. Static assets load from cache.
Menu data has offline fallback. The app feels native with no browser chrome.

---

## Phase 6: QR Token Authentication

**Purpose:** Enable the second authentication method — guests scan a QR code
and are pre-authenticated via a signed JWT in the URL.

### Tasks

6.1. **Token route on frontend**
- Add route: `/order?token=<jwt>` in `router.jsx`
- Create `TokenAuth.jsx` page (or handle in `Welcome.jsx`)
- Extract token from URL query parameter
- Call `POST /api/validate-token` with the token
- On success: populate GuestContext, redirect to `/menu`
- On failure: show error, offer manual login fallback

6.2. **Token validation on backend**
- `POST /api/validate-token` — decode and verify JWT
- Check signature, expiration, required fields (bookingId, guestName, rooms)
- Return same response shape as `validate-guest`
- For now, use a configurable secret in environment variable

6.3. **Token generation utility**
- Create a CLI or admin script to generate test QR tokens
- Input: bookingId, guestName, rooms, checkIn, checkOut
- Output: signed JWT and full URL for QR code
- This is a development/testing tool — in production, the Booking App generates
  tokens

6.4. **QR code rendering**
- Add a utility to generate QR code images from URLs (e.g., `qrcode` npm
  package)
- Used for: test QR codes during development, and potentially for the Booking
  App to embed in welcome cards

### Deliverable
Guests can scan a QR code and go directly to the menu without entering
credentials. Tokens are validated on the backend. Expired or invalid tokens
show a clear error.

---

## Phase 7: Fraud Prevention & Email

**Purpose:** Add spending limits to cap potential damage and email confirmations
so guests are immediately aware of charges.

### Tasks

7.1. **Spending limit enforcement (backend)**
- On `POST /api/orders`, before saving:
  - Check per-order total against configurable cap (e.g., ₱5,000)
  - Sum today's orders for this booking, check against daily cap (e.g., ₱15,000)
- If exceeded: return 403 with clear message
- Limits stored in config file or environment variables

7.2. **Spending limit UI (frontend)**
- If order is rejected due to spending limit, show a clear message:
  "This order exceeds the daily limit. Please contact the front desk."
- Distinguish from other errors (not a generic "failed to place order")

7.3. **Email order confirmation (backend)**
- Install `nodemailer`
- Configure SMTP settings via environment variables
- After successful order placement, if `guest_email` is not null:
  - Send confirmation email asynchronously (non-blocking)
  - Log success/failure
  - Do not fail the order if email fails

7.4. **Email template**
- Resort branding (name, colors)
- Order number and timestamp
- Itemized list with quantities and prices
- Total amount
- Booking reference / guest name
- "Didn't place this order?" with front desk contact info
- Keep it simple — plain HTML, mobile-friendly

7.5. **Spending limit configuration**
- Add config endpoint or file for managing limits
- Defaults: ₱5,000 per order, ₱15,000 per booking per day
- Overridable per booking (optional, for VIP guests)

### Deliverable
Orders above the spending cap are blocked with a clear message. Guests with
email on file receive a confirmation for every order, enabling them to catch
unauthorized charges immediately.

---

## Phase 8: External Integrations

**Purpose:** Replace mock APIs with real connections to the Menu App and
Booking App.

**Note:** This phase depends on the external teams providing their APIs. It
can be deferred until those APIs are available. The mock layer keeps the system
functional in the meantime.

### Tasks

8.1. **Menu App integration**
- Point `GET /api/menu/categories` to the real Menu App endpoint
- Map response to the expected shape if the Menu App's format differs
- Add error handling: if Menu App is down, serve cached menu data
- Add response caching on the backend (cache menu for N minutes, refresh
  periodically)

8.2. **Booking App integration — guest validation**
- Point `POST /api/validate-guest` to the real Booking App endpoint
- Map `{ lastName, pin }` request and response as needed
- Handle: invalid credentials, expired booking, checked-out guest

8.3. **Booking App integration — token validation**
- Point `POST /api/validate-token` to the real Booking App endpoint
  (or validate JWT locally if using shared secret)
- Handle: expired token, invalid signature, revoked booking

8.4. **Booking App integration — charge booking**
- Point `POST /api/charge-booking` to the real Booking App endpoint
- Handle: charge declined, booking not found, insufficient credit
- If charge fails after order is saved: mark order as `charged: false`,
  alert staff

8.5. **Integration health checks**
- Add health check endpoint (`GET /api/health`) that reports status of:
  - Menu App connectivity
  - Booking App connectivity
  - Database status
  - Socket.io status

8.6. **Fallback behavior**
- Menu App down → serve cached menu (from last successful fetch)
- Booking App down → configurable: block orders or allow with staff override
- Charge fails → save order, mark uncharged, notify staff

### Deliverable
The kiosk operates against real external APIs. Mock mode remains available via
`USE_MOCK` flag for development and as fallback.

---

## Phase 9: Deployment & Operations

**Purpose:** Prepare the system for production use in the resort — tablet
setup, networking, QR code printing, and operational documentation.

### Tasks

9.1. **Android tablet kiosk setup**
- Document Fully Kiosk Browser configuration
- Auto-start URL, disable navigation, disable status bar
- Remote management setup (optional)
- Test on actual tablets

9.2. **Networking**
- Set up `order.playamontana.com` domain (or chosen domain)
- Configure local DNS to resolve to server IP
- Obtain and install SSL certificate (Let's Encrypt)
- Test HTTPS + PWA install on LAN

9.3. **QR code design and printing**
- Generate QR codes for each active booking (or create a batch tool)
- Design table tent template with QR code + instructions
- Design room welcome card insert with QR code
- Design pool/bar signage

9.4. **Kitchen display hardware**
- Select and configure wall-mount tablet or monitor + mini PC
- Configure always-on display, auto-launch kiosk browser
- Test sound alerts at kitchen volume levels

9.5. **Operational documentation**
- How to restart the server
- How to add/update menu items (via Menu App)
- How to handle common issues (tablet frozen, order stuck, etc.)
- How to generate new QR codes when guests check in
- Staff training guide for kitchen display

9.6. **Monitoring and logging**
- Server-side logging (orders, errors, integration failures)
- Log rotation (prevent disk fill on long-running server)
- Basic dashboard or log viewer for troubleshooting

### Deliverable
The system is running in the resort. Tablets are locked to the app. QR codes
are printed and placed. Kitchen displays are mounted. Staff are trained.
Operational docs are available.

---

## Timeline Estimate

| Phase | Estimated Effort | Can Parallelize With |
|---|---|---|
| Phase 1: Frontend Auth Alignment | 1–2 days | Phase 2 |
| Phase 2: Backend Foundation | 2–3 days | Phase 1 |
| Phase 3: Full-Stack Order Flow | 1–2 days | — |
| Phase 4: Kitchen Display | 3–4 days | Phase 5, 6, 7 |
| Phase 5: PWA & Offline | 2–3 days | Phase 4, 6, 7 |
| Phase 6: QR Token Auth | 1–2 days | Phase 4, 5, 7 |
| Phase 7: Fraud Prevention & Email | 2–3 days | Phase 4, 5, 6 |
| Phase 8: External Integrations | 2–4 days | (when APIs are ready) |
| Phase 9: Deployment & Operations | 3–5 days | — |
| **Total** | **~17–28 days** | |

> Estimates assume a single developer. Phases 1+2 and 4+5+6+7 can overlap
> significantly with parallel work.

---

## Definition of Done (per Phase)

Each phase is considered complete when:

1. All listed tasks are implemented
2. The feature works end-to-end in a development environment
3. The mock fallback (`USE_MOCK`) still works for offline development
4. No regressions in existing functionality
5. `CLAUDE.md` is updated to reflect the new current state

---

## Risk Register

| Risk | Affected Phases | Mitigation |
|---|---|---|
| Menu App API not ready | Phase 8 | Mock layer keeps system functional indefinitely |
| Booking App API not ready | Phase 8 | Mock layer keeps system functional indefinitely |
| Tablet hardware not purchased | Phase 9 | Develop and test in Chrome DevTools device emulator |
| SSL certificate issues on LAN | Phase 5, 9 | Use `localhost` for dev; document cert setup for IT |
| Socket.io blocked by network | Phase 4 | HTTP polling fallback is already part of the design |
| Menu App response format differs | Phase 8 | Backend integration layer maps to expected shape |
