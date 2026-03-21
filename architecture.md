# Playa Montana Kiosk — Architecture & Proposal

> **Purpose:** Present the technical approach for the resort's restaurant ordering
> system to the team for review and sign-off before implementation begins.

---

## Executive Summary

We are proposing a **self-service restaurant ordering system** that lets resort
guests order food from their own phone or a shared tablet, with live updates
pushed to a kitchen display. Orders are charged directly to the guest's booking (which may cover multiple
rooms).

**How guests order:** Guests scan a **QR code** (on table tents, room cards, or
pool area signs) with their phone — no app install required. The QR code
pre-authenticates them, so they go straight to the menu. A few **shared Android
tablets** at the restaurant, bar, and pool serve as a fallback for guests without
phones.

**How we prevent fraud:** Shared tablets require a **Surname + 4-digit PIN**
issued at check-in. QR codes carry a **signed, expiring token** tied to the
guest's booking. A **daily spending cap** per booking limits damage even if
credentials are compromised. As an additional layer, if the guest has an **email
on file**, an **order confirmation is sent to their email** — so the real guest
is immediately aware of any charge to their booking.

**How the kitchen works:** A wall-mounted tablet or monitor displays incoming
orders in real time. Kitchen staff tap to move orders through **Pending →
Preparing → Ready → Served**. Sound alerts fire on new orders.

**How it integrates:** This system does not duplicate existing tools. It
**pulls the menu** from the Menu Management App and **validates guests / charges
rooms** through the Booking Management App. The kiosk only stores order data.

**Technology:** A **Progressive Web App (PWA)** built with React and Node.js,
running on the resort's local network. PWA means one codebase works on guest
phones, shared tablets, and kitchen displays — no app store, instant updates,
and offline-capable for the menu. Android tablets are locked to the app using
kiosk-mode software.

**What we need from the team:** Confirmation of API contracts with the Menu and
Booking App teams, agreement on spending limits, and IT support for a local
domain with HTTPS.

---

## 1. What We're Building

A self-service restaurant ordering system for Playa Montana resort. Guests place
food orders from their phone or a shared tablet, and kitchen staff see live
updates on a display. Orders are charged to the guest's booking, which may
cover one or multiple rooms.

**This system does NOT manage the menu or bookings.** It integrates with the
existing Menu Management App and Booking Management App.

### Scope

| In Scope | Out of Scope |
|---|---|
| Guest authentication (Surname + PIN or QR token) | Menu CRUD (handled by Menu App) |
| Menu browsing and ordering | Booking/reservation management |
| Kitchen order display with live updates | Payment processing (charge-to-room only) |
| Charge-to-booking via Booking App API | Guest-facing booking flows |
| PWA for tablets and guest phones | Native mobile apps |

---

## 2. How Guests Will Order (Hybrid Distribution)

Rather than buying tablets for every table, we use a **hybrid approach**: QR codes
everywhere, with a few dedicated tablets at key locations.

### Channel A: QR Code → Guest's Own Phone (Primary)

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   Guest scans QR code on table tent / room card / sign  │
│                        │                                │
│                        ▼                                │
│   Phone opens: https://order.playamontana.com/          │
│                  ?token=eyJyb29tIjoyMDQsImV4cCI6...     │
│                        │                                │
│                        ▼                                │
│   Token validated → Menu loads → Guest orders           │
│                                                         │
│   No app install required. Works in any mobile browser. │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

- QR codes are printed on **table tents, room key cards, pool area signs, restaurant entrance**
- Each QR encodes a signed token (JWT) tied to the guest's booking and stay dates
- Guest is **pre-authenticated** — no typing required
- Works on iPhone (Safari) and Android (Chrome) with no install

### Channel B: Shared Tablets at Key Locations (Secondary)

- A few Android tablets at the **restaurant entrance, bar counter, pool bar**
- Pre-installed as a PWA in fullscreen kiosk mode
- Guests authenticate with **Surname + 4-digit PIN** (since the tablet isn't tied to a specific guest)
- Useful for guests without phones, dead batteries, or who prefer a larger screen

### Channel C: Kitchen Displays

- Wall-mounted tablets or monitors at the **kitchen**
- Open to `/kitchen` in fullscreen mode
- Always-on, showing live order queue with tappable status updates

### Where Each Channel Is Used

```
┌─────────────────────────────────────────────────────────────┐
│                    PLAYA MONTANA RESORT                       │
│                                                              │
│  🏖️ Pool Area          🍽️ Restaurant          🍸 Bar        │
│  ┌──────────────┐    ┌──────────────────┐   ┌────────────┐  │
│  │ QR on lounge │    │ QR on tables     │   │ Tablet on  │  │
│  │ chair signs  │    │ Tablet at host   │   │ bar counter│  │
│  └──────────────┘    │ station          │   │ QR on bar  │  │
│                      └──────────────────┘   │ mats       │  │
│                                             └────────────┘  │
│                                                              │
│  🏠 Guest Rooms        👨‍🍳 Kitchen                           │
│  ┌──────────────┐    ┌──────────────────┐                   │
│  │ QR on room   │    │ Wall-mounted     │                   │
│  │ welcome card │    │ kitchen display  │                   │
│  └──────────────┘    │ (tablet/monitor) │                   │
│                      └──────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Preventing Fraudulent Orders

**Problem:** If authentication is just a room number, anyone who knows or
guesses it could order food charged to another guest. We need an identity
tied to the booking, not to a specific room.

### Why Surname + PIN Instead of Room Number?

A single booking can cover **multiple rooms** (e.g., a family reunion with
5 rooms under "Santos"). Using room number as the primary identifier would
force each room to authenticate separately and wouldn't reflect the actual
billing relationship. By using the **guest surname**, orders are tied to the
**booking**, which is how charges are tracked in the Booking App.

### Solution: Two Authentication Methods

#### Method 1: Surname + PIN (for shared tablets)

At check-in, the Booking App generates a **unique 4-digit PIN** for each
booking. The guest receives it on their check-in slip or welcome card.

```
Guest at shared tablet:
  Last Name: [Santos  ]
  PIN:       [8374    ]
  [START ORDER]
         │
         ▼
  Kiosk → POST /api/validate-guest { lastName: "Santos", pin: "8374" }
         │
         ▼
  Booking App verifies surname + PIN
    → Returns guest name, booking ID, associated rooms
    → Ordering begins
```

Why Surname + PIN:
- **Supports multi-room bookings** — one credential covers all rooms in the booking
- **PINs are private** — not overheard, not on luggage tags
- **Surname is memorable** — guests don't need to remember a room number
- **Familiar pattern** — guests already use PINs for room safes, WiFi
- **Easy for the Booking App** to generate per booking and validate

#### Method 2: Signed Token in QR Code (for guest phones)

When the guest checks in, the Booking App generates a **signed JWT** embedded in
a QR code URL. Scanning it pre-authenticates the guest — no input needed.

```
Token payload (JWT):
{
  "bookingId": "BK-20260310-042",
  "guestName": "Santos",
  "rooms": ["204", "205", "206"],
  "checkIn": "2026-03-10",
  "checkOut": "2026-03-15",
  "iat": 1741564800,
  "exp": 1741996800
}
```

- Signed with a shared secret between Booking App and Kiosk backend
- Expires at checkout date — can't be reused after the stay
- Can't be forged without the signing secret
- Includes all rooms in the booking — charges are applied to the booking, not a single room

#### Additional Safeguard: Spending Limit

As a safety net regardless of auth method:
- **Per-order cap** (e.g., ₱5,000) — orders above this require staff confirmation
- **Daily cap per booking** (e.g., ₱15,000) — prevents runaway charges across all rooms in a booking
- Thresholds configurable by management

#### Additional Safeguard: Email Order Confirmation

If the guest has an **email address on file** (from the Booking App), the kiosk
backend automatically sends an **order confirmation email** every time an order
is placed against their room.

**How it helps:**
- **Fraud detection** — If someone places a fraudulent order on a guest's room,
  the real guest receives an email immediately and can alert the front desk
- **Transparency** — Guests see exactly what was charged and when, building trust
- **Receipt / record** — Guests have a digital record of all their restaurant orders

**Email contents:**
- Resort branding and greeting
- Order number and timestamp
- Itemized list with quantities and prices
- Total amount charged to booking
- Booking reference and guest surname
- "Didn't place this order?" prompt with front desk contact info

**When no email is on file:**
- Order proceeds normally — email is a bonus, not a gate
- The other safeguards (PIN, token, spending limit) still apply

```
Order placed by Santos (Booking BK-20260310-042)
         │
         ▼
  Booking App has email for this guest?
         │
    YES ──┼── NO
    │      │    │
    ▼      │    ▼
  Send     │  Skip email,
  order    │  order proceeds
  email    │  normally
    │      │
    ▼      │
  Guest receives:                 │
  "Your order #1042"              │
  "2× Garlic Chicken..."          │
  "Total: ₱409.00"                │
  "Charged to booking (Santos)"   │
  "Not you? Call front desk"      │
```

### Authentication & Fraud Prevention Summary

| Layer | Method | What It Prevents |
|---|---|---|
| **Authentication** | Surname + PIN (tablets) or JWT token (QR) | Unauthorized access to ordering |
| **Spending limit** | Per-order and daily cap per booking | Runaway charges if auth is compromised |
| **Email confirmation** | Order receipt sent to guest email | Undetected fraudulent charges — real guest is notified immediately |

---

## 4. System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                         RESORT LOCAL NETWORK                          │
│                                                                       │
│                         ┌─────────────────────┐                       │
│                         │   EXISTING SYSTEMS   │                       │
│                         │                     │                       │
│                         │  ┌───────────────┐  │                       │
│                         │  │  Menu App API  │  │                       │
│                         │  │  (categories,  │  │                       │
│                         │  │   items, prices)│  │                       │
│                         │  └───────┬───────┘  │                       │
│                         │          │          │                       │
│                         │  ┌───────────────┐  │                       │
│                         │  │ Booking App   │  │                       │
│                         │  │ API (guest    │  │                       │
│                         │  │ validation,   │  │                       │
│                         │  │ room charge)  │  │                       │
│                         │  └───────┬───────┘  │                       │
│                         └──────────┼──────────┘                       │
│                                    │                                  │
│            ┌───────────────────────┼───────────────────────┐          │
│            │           KIOSK BACKEND (Node.js)             │          │
│            │                       │                       │          │
│            │  ┌──────────┐  ┌──────┴──────┐  ┌──────────┐ │          │
│            │  │ REST API │  │ Integration │  │Socket.io │ │          │
│            │  │          │  │   Layer     │  │  Server  │ │          │
│            │  │ /orders  │  │             │  │          │ │          │
│            │  │ /auth    │  │ Menu App ←──│  │ emit:    │ │          │
│            │  │ /menu    │  │ Booking  ←──│  │ new_order│ │          │
│            │  │          │  │ App         │  │ order_upd│ │          │
│            │  └────┬─────┘  └─────────────┘  └────┬─────┘ │          │
│            │       └──────────────┬───────────────┘       │          │
│            │                      ▼                       │          │
│            │              ┌──────────────┐                │          │
│            │              │   SQLite DB   │                │          │
│            │              │  (orders only) │                │          │
│            │              └──────────────┘                │          │
│            └──────────────────────────────────────────────┘          │
│                    │              │               │                   │
│            ┌───────┘       ┌─────┘        ┌──────┘                   │
│            ▼               ▼              ▼                          │
│   ┌──────────────┐ ┌─────────────┐ ┌───────────────┐               │
│   │ Guest Phone  │ │   Shared    │ │   Kitchen     │               │
│   │ (QR → PWA)  │ │  Tablets    │ │   Display     │               │
│   │              │ │ (PWA kiosk) │ │ (PWA always-on│               │
│   │ • Browse menu│ │             │ │               │               │
│   │ • Place order│ │ • Name+PIN  │ │ • Live orders │               │
│   │ • Pre-authed │ │ • Browse    │ │ • Tap status  │               │
│   │   via token  │ │ • Order     │ │ • Sound alert │               │
│   └──────────────┘ └─────────────┘ └───────────────┘               │
└──────────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

| # | Decision | Rationale |
|---|---|---|
| 1 | **Menu data comes from Menu App** | Single source of truth; no duplicate CRUD |
| 2 | **Guest validation via Booking App** | Surname + PIN and token verification against real booking data |
| 3 | **Kiosk DB stores only orders** | Menu and guest data belong to their respective apps |
| 4 | **SQLite for orders** | Zero-config, file-based, sufficient for single-resort volume |
| 5 | **Socket.io for kitchen updates** | Real-time push with automatic reconnection and polling fallback |
| 6 | **PWA, not native app** | One codebase for all devices; no app store; instant updates |

---

## 5. Order Flow

```
GUEST (Phone or Tablet)              KIOSK BACKEND              KITCHEN DISPLAY
        │                                  │                           │
        │  1. Authenticate                 │                           │
        │     (QR token OR Surname+PIN)    │                           │
        ├─────────────────────────────────►│                           │
        │                                  │── Validate against ──►    │
        │                                  │   Booking App API         │
        │  ✓ Welcome, Maria!               │                           │
        │◄─────────────────────────────────┤                           │
        │                                  │                           │
        │  2. Load menu                    │                           │
        │     GET /api/menu                │                           │
        ├─────────────────────────────────►│                           │
        │                                  │── Fetch from ──►         │
        │                                  │   Menu App API            │
        │  Menu data (categories + items)  │                           │
        │◄─────────────────────────────────┤                           │
        │                                  │                           │
        │  3. Guest browses, adds to cart  │                           │
        │     (all client-side)            │                           │
        │                                  │                           │
        │  4. Place order                  │                           │
        │     POST /api/orders             │                           │
        ├─────────────────────────────────►│                           │
        │                                  │  a) Save order (SQLite)   │
        │                                  │  b) Charge booking ──►    │
        │                                  │     Booking App API       │
        │                                  │  c) Emit "new_order" ────►│
        │                                  │                           │ 🔔
        │                                  │  d) Send order confirmation│
        │                                  │     email (if guest has   │
        │                                  │     email on file)   📧   │
        │                                  │                           │
        │  5. Order confirmed              │                           │
        │◄─────────────────────────────────┤                           │
        │                                  │                           │
        │                                  │  Kitchen taps status:     │
        │                                  │◄──────────────────────────┤
        │                                  │  PATCH /orders/:id/status │
        │                                  │  { status: "preparing" }  │
        │                                  │── emit "order_updated" ──►│
        │                                  │                           │
```

---

## 6. Kitchen Display

A 3-column Kanban board showing all active orders with tappable status progression.

```
┌───────────────────────────────────────────────────────────────┐
│  KITCHEN ORDERS                          ● LIVE    14:32      │
├───────────────────┬───────────────────┬───────────────────────┤
│  🔴 PENDING (2)   │  🟡 PREPARING (1) │  🟢 READY (1)        │
├───────────────────┼───────────────────┼───────────────────────┤
│  #1042  2m ago    │  #1039  8m ago    │  #1037  15m ago       │
│  Santos (Rm 204)  │  Johnson (Rm 118) │  Martinez (Rm 305)    │
│  ──────────────── │  ──────────────── │  ────────────────     │
│  2× Garlic Chicken│  1× Sizzling Tofu │  1× Bulalo           │
│  1× Skin-on Fries │  2× Pancit Canton │  1× Spanish Latte    │
│  1× Iced Tea      │                   │                       │
│  Note: extra rice │                   │                       │
│  ──────────────── │  ──────────────── │  ────────────────     │
│  [▶ PREPARING]    │  [▶ READY]        │  [✓ SERVED]           │
│                   │                   │                       │
│  #1041  3m ago    │                   │                       │
│  Lee (Rm 101)     │                   │                       │
│  ──────────────── │                   │                       │
│  1× Halo-Halo    │                   │                       │
│  2× Buko Pandan  │                   │                       │
│  [▶ PREPARING]    │                   │                       │
└───────────────────┴───────────────────┴───────────────────────┘
```

**Status flow:** Pending → Preparing → Ready → Served

- New orders trigger a **sound alert** and visual highlight
- Kitchen staff **tap the button** to advance the status
- "Served" orders disappear from the board after a short delay
- WebSocket provides live updates; HTTP polling is the automatic fallback

---

## 7. PWA Configuration

### Why PWA?

| Need | PWA Capability |
|---|---|
| Install on tablets without app store | Add to Home Screen → fullscreen app |
| Fast load times | Service worker caches static assets |
| Works during brief network hiccups | Cached menu and UI shell load instantly |
| Auto-update when we deploy changes | Service worker update on next visit |
| Kitchen alerts when tab not focused | Push notifications (optional) |
| Keep kitchen display screen on | Wake Lock API |

### What's Required

1. **Web App Manifest** (`manifest.json`)
   - App name: "Playa Montana — Order"
   - Display mode: `standalone` (tablets) / `fullscreen` (kitchen)
   - Theme color, background color, icons (192px, 512px)

2. **Service Worker** (via `vite-plugin-pwa`)
   - Cache static assets (JS, CSS, images)
   - Cache menu data with network-first strategy (show cached if offline)
   - Orders require network — show clear offline message if unavailable

3. **HTTPS** — required for PWA install and service workers (see Networking below)

### Android Tablet Kiosk Setup

For shared guest-facing tablets, lock them to the ordering app:

| Option | Cost | Difficulty | Recommendation |
|---|---|---|---|
| **Fully Kiosk Browser** (app) | ~$7/device | Easy | Recommended — purpose-built for this |
| Android Kiosk Mode (COSU via MDM) | Free | Medium | Good if IT team manages devices |
| Screen Pinning (built-in) | Free | Easy | Quick-and-dirty, can be escaped |

**Fully Kiosk Browser** is recommended because it:
- Auto-starts the URL on boot
- Blocks the status bar, navigation buttons, and other apps
- Has remote management (push URL changes to all tablets)
- Prevents screen timeout (kitchen displays)

---

## 8. Networking

### Recommended Setup: Real Domain with Local DNS

```
┌──────────────────────────────────────────────────────┐
│                RESORT NETWORK                         │
│                                                       │
│  Router / DNS Server                                  │
│  ┌─────────────────────────────────────────────┐     │
│  │  order.playamontana.com → 192.168.1.50      │     │
│  │  (local DNS override)                        │     │
│  └─────────────────────────────────────────────┘     │
│                         │                             │
│           ┌─────────────┼─────────────┐               │
│           ▼             ▼             ▼               │
│     ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│     │  Kiosk   │ │  Guest   │ │  Kitchen │          │
│     │  Server  │ │  Phones  │ │  Display │          │
│     │ .1.50    │ │ (WiFi)   │ │          │          │
│     │ HTTPS    │ │          │ │          │          │
│     └──────────┘ └──────────┘ └──────────┘          │
└──────────────────────────────────────────────────────┘
```

**Why a real domain?**
- PWA features (install, service worker) **require HTTPS**
- A real domain lets us get a **real SSL certificate** (Let's Encrypt)
- QR codes print nicely: `order.playamontana.com` vs `192.168.1.50`
- The domain resolves to a **local IP** via the resort's DNS — no internet required for operation

**Fallback:** If setting up local DNS is not feasible initially, we can use
`localhost` during development and testing (browsers exempt `localhost` from
HTTPS requirements for PWA).

---

## 9. Integration Contracts

### Current State of Existing Systems

Both systems have been reviewed. Neither currently provides the endpoints the
kiosk needs — new endpoints must be added to each.

#### Menu Management System (port 3002)

- **Stack:** NestJS 11, TypeScript, MySQL, TypeORM
- **Auth:** 6-digit PIN → JWT (all endpoints require auth)
- **Existing API:** `GET /api/v1/menu-categories` (paginated), `GET /api/v1/menu-items`
  (paginated, filterable by `categoryId`, `isAvailable`)
- **Data:** Items have many-to-many relationship with categories. Fields include
  `name`, `description`, `price`, `image_url`, `sort_order`, `is_available`,
  `is_active`. No `tags` field exists.
- **Gap:** No public endpoint. No nested categories+items response. All endpoints
  require JWT auth.

#### Booking Management App (port 3000)

- **Stack:** NestJS 11, TypeScript, MySQL, TypeORM
- **Auth:** Staff username+password → JWT (all endpoints require auth)
- **Existing entities:** `Guest` (firstName, lastName, mobileNumber — **no email,
  no pin**), `Booking` (guestId, status, checkIn/checkOut), `BookingRoom`
  (bookingId, roomId), `Invoice`/`InvoiceItem` (charges with itemType including
  `food`)
- **Gap:** No guest PIN field. No guest email field. No guest-facing auth
  endpoints. No direct charge-booking endpoint (charges go through invoices).

---

### Required: New Endpoint on Menu App

One new **public** (no auth) endpoint that returns the full menu for the kiosk.

```
GET /api/v1/kiosk/menu

No authentication required.

Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Main",
      "description": "Main course dishes",
      "sortOrder": 1,
      "items": [
        {
          "id": 101,
          "name": "Garlic Chicken",
          "description": "Prepared by quickly frying...",
          "price": 150.00,
          "isAvailable": true,
          "imageUrl": "http://localhost:3002/uploads/garlic-chicken.jpg",
          "sortOrder": 1
        }
      ]
    }
  ]
}
```

**Implementation notes:**
- Filters: only `is_active = true` categories, only `is_active = true` AND
  `is_available = true` items
- Items nested under their categories (using existing many-to-many relationship)
- Sorted by `sort_order`
- Mark as `@Public()` — no JWT required
- The kiosk backend caches this response (5-minute TTL) to reduce load

---

### Required: New Endpoints on Booking App

Three new **public** endpoints under a `/api/v1/kiosk/` prefix, plus schema
changes.

#### Schema Changes Required

```
Guest entity — add fields:
  email          VARCHAR(255)  nullable    ← for order confirmation emails
  kiosk_pin      VARCHAR(4)    nullable    ← 4-digit PIN, generated at check-in

Migration: AddKioskFieldsToGuest
```

#### Endpoint 1: Validate Guest (Surname + PIN)

```
POST /api/v1/kiosk/validate-guest

No authentication required.

Request:
{ "lastName": "Santos", "pin": "8374" }

Response (success):
{
  "valid": true,
  "bookingId": 42,
  "guestName": "Maria Santos",
  "guestEmail": "maria.santos@email.com",     ← null if not on file
  "rooms": [
    { "id": 5, "roomNumber": "204", "name": "Deluxe 204" },
    { "id": 6, "roomNumber": "205", "name": "Deluxe 205" }
  ],
  "checkOut": "2026-03-15T12:00:00.000Z"
}

Response (failure):
{ "valid": false }
```

**Implementation notes:**
- Query: find Guest where `lastName` matches (case-insensitive) AND
  `kiosk_pin` matches
- Then find active Booking (status = `checked_in`) for that guest
- Join BookingRoom → Room to get room list
- Return booking ID (integer, from existing `bookings.id`)

#### Endpoint 2: Validate Token (QR Code JWT)

```
POST /api/v1/kiosk/validate-token

No authentication required.

Request:
{ "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }

Response (success):
{
  "valid": true,
  "bookingId": 42,
  "guestName": "Maria Santos",
  "guestEmail": "maria.santos@email.com",
  "rooms": [
    { "id": 5, "roomNumber": "204", "name": "Deluxe 204" },
    { "id": 6, "roomNumber": "205", "name": "Deluxe 205" }
  ]
}

Response (failure):
{ "valid": false, "reason": "Token expired" }
```

**Implementation notes:**
- Verify JWT signature using a `KIOSK_JWT_SECRET` env variable
- Check token expiration
- Extract `bookingId` from payload, look up booking and rooms
- Reject if booking status is not `checked_in`

#### Endpoint 3: Charge to Booking

```
POST /api/v1/kiosk/charge-booking

No authentication required (or use a shared API key header).

Request:
{
  "bookingId": 42,
  "amount": 598.00,
  "description": "Restaurant order #1042",
  "items": [
    { "name": "Garlic Chicken", "quantity": 2, "unitPrice": 150.00 },
    { "name": "Iced Tea", "quantity": 1, "unitPrice": 69.00 }
  ]
}

Response (success):
{ "success": true, "invoiceItemId": 187 }

Response (failure):
{ "success": false, "reason": "Booking not found" }
```

**Implementation notes:**
- Find or create an Invoice for the booking (use existing invoice generation logic)
- Create an InvoiceItem with `itemType: 'food'` and the total amount
- Optionally store line-item detail in the description or a JSON field
- Return the created invoice item ID as a reference

#### Token Generation (for QR codes)

```
POST /api/v1/kiosk/generate-token

Requires staff authentication (existing JWT auth).

Request:
{ "bookingId": 42 }

Response:
{
  "token": "eyJhbGciOi...",
  "url": "https://order.playamontana.com/order?token=eyJhbGciOi...",
  "expiresAt": "2026-03-15T12:00:00.000Z"
}
```

**Implementation notes:**
- Generate JWT with payload: `{ bookingId, guestName, rooms, checkOut }`
- Sign with `KIOSK_JWT_SECRET`
- Set expiry to checkout date
- Return full URL for QR code printing
- This endpoint is for staff use (called from backoffice UI or at check-in)

---

> **Until these APIs are available**, the kiosk runs on **mock implementations**
> that accept any input. The `USE_MOCK` flag in the codebase toggles between
> mock and real integrations.

---

## 10. Data Model (Kiosk Database — Orders Only)

The kiosk's own SQLite database stores only order data. Menu and guest data
live in their respective apps.

```
┌────────────────────────────┐
│           orders           │
├────────────────────────────┤
│  id            INTEGER PK  │
│  booking_id    TEXT        │  ← from Booking App (e.g. "BK-20260310-042")
│  guest_name    TEXT        │  ← surname used for kitchen display
│  guest_email   TEXT        │  ← nullable; from Booking App at order time
│  delivery_room TEXT        │  ← optional; which room to deliver to
│  status        TEXT        │  ← pending | preparing | ready | served
│  total_amount  DECIMAL     │
│  notes         TEXT        │  ← order-level special instructions
│  charged       BOOLEAN     │  ← room charge succeeded
│  created_at    DATETIME    │
│  updated_at    DATETIME    │
└────────────────────────────┘

┌────────────────────────────┐
│         order_items        │
├────────────────────────────┤
│  id            INTEGER PK  │
│  order_id      INTEGER FK  │
│  menu_item_id  INTEGER     │  ← reference to Menu App item
│  item_name     TEXT        │  ← snapshot at time of order
│  unit_price    DECIMAL     │  ← snapshot at time of order
│  quantity      INTEGER     │
│  item_notes    TEXT        │  ← e.g. "extra rice"
└────────────────────────────┘
```

> `item_name` and `unit_price` are snapshotted so that menu price changes
> never alter historical order records.

---

## 11. Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend (all screens) | React 19 + Vite | Fast, component-based, great for touch UIs |
| Styling | Tailwind CSS v4 | Responsive utilities, easy large-text for kiosk/kitchen |
| PWA | vite-plugin-pwa (Workbox) | Service worker generation, caching strategies |
| Backend | Node.js + Express | Lightweight, first-class Socket.io support |
| Real-time | Socket.io | WebSocket with auto-reconnect + polling fallback |
| Database | SQLite (better-sqlite3) | Zero config, file-based, perfect for local single-server |
| QR Code Auth | JWT (jsonwebtoken) | Signed tokens, no database lookup needed for validation |
| Email | Nodemailer | Send order confirmations; works with SMTP, Gmail, or local relay |
| Tablet Kiosk | Fully Kiosk Browser | Android lockdown, remote management, auto-start |

---

## 12. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Guest WiFi drops | Guests can't order from phones | Shared tablets on local network as fallback |
| Menu App API is down | Menu can't load | Service worker serves cached menu; show "limited menu" notice |
| Booking App API is down | Can't validate guests | Graceful fallback: allow staff override PIN (e.g., "0000") |
| Tablet gets stolen | Hardware loss, ₱15-20K per tablet | Use cheap tablets; lock to kiosk mode; only a few needed |
| Kitchen display disconnects | Missed orders | Sound alert on reconnect; polling fallback; orders persist in DB |
| Fraudulent order via shared tablet | Charges to wrong booking | Surname + PIN auth + daily spending cap per booking |
| Email delivery fails | Guest doesn't get confirmation | Non-blocking — order still succeeds; retry queue; log failures |
| Guest has no email on file | No email safeguard for that room | PIN + spending limit still apply; encourage email at check-in |
| Power outage | System goes down | Orders in SQLite survive restart; UPS for server recommended |

---

## 13. Open Questions for Team Discussion

1. **Menu App API** — Is there an existing API we can consume? What does the
   endpoint structure look like? If not yet available, can we agree on the
   contract above and use mocks until it's ready?

2. **Booking App API** — Same question. Specifically: can the Booking App
   generate a PIN per **booking** (not per room) at check-in and expose a
   validation endpoint that accepts surname + PIN? The response should include
   the booking ID, guest name, and list of associated rooms.

3. **JWT signing secret** — How do we securely share the signing key between the
   Booking App (which generates QR tokens) and the Kiosk backend (which
   validates them)?

4. **Spending limits** — What should the per-order and daily-per-booking caps
   be? Should these be configurable by management in the Booking App or the
   Kiosk admin?

5. **Order status: "Served" step** — After kitchen marks an order "Ready",
   should there be a final "Served/Delivered" step, or does the flow end at
   Ready?

6. **Order history** — Should the kiosk provide an order history/report view for
   management, or does that belong in the Booking App (since charges are there)?

7. **Item photos** — Will the Menu App provide image URLs, or should the kiosk
   UI work gracefully with emoji/placeholder fallback (as it does now)?

8. **Tablet count and placement** — How many tablets, and exactly where? This
   affects hardware budget and QR code printing needs.

9. **Domain and SSL** — Can IT set up `order.playamontana.com` with local DNS
   and a Let's Encrypt certificate? Or should we explore alternative approaches?

10. **Email infrastructure** — Does the resort have an SMTP server or email
    service (e.g., Gmail workspace, SendGrid) we can use to send order
    confirmation emails? What sender address should be used
    (e.g., `orders@playamontana.com`)?

11. **Guest email availability** — How reliably does the Booking App capture
    guest email addresses? Is it a required field at booking, or optional?
    This determines how many guests will benefit from the email confirmation
    safeguard.

---

## 14. Next Steps

Once the team agrees on this architecture:

1. **Confirm integration contracts** with Menu App and Booking App teams
2. **Set up PWA** — manifest, service worker, icons
3. **Build the backend** — Express server, SQLite, Socket.io, integration layer
4. **Implement Surname + PIN authentication** on shared tablet flow
5. **Implement QR token authentication** for guest phone flow
6. **Build kitchen display** — Kanban board with live updates
7. **Set up email sending** — Configure SMTP/email service, order confirmation template
8. **Configure Android tablets** — Fully Kiosk Browser, test kiosk lockdown
9. **Set up networking** — Domain, SSL, local DNS
10. **Print QR codes** — Table tents, room cards, signage
11. **End-to-end testing** on actual tablets and phones on the resort network

---

*Document prepared for team review. Awaiting feedback before implementation.*
