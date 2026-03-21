# Guidance for AI Agents

## Project Overview

**Playa Montana Kiosk** is a self-service restaurant ordering system for a beach
resort. Guests place food orders from their own phone (via QR code) or shared
Android tablets, and kitchen staff manage orders on a live display. Orders are
charged to the guest's booking.

This is a **consumer application** — it does not manage menus or bookings. It
integrates with two external systems:
- **Menu Management App** — provides categories, items, prices, availability
- **Booking Management App** — validates guests (surname + PIN), charges bookings

See `architecture.md` for the full proposal, diagrams, and integration contracts.

## Current State

**Guest flow** is integrated end-to-end with real services where configured: the
Vite app calls the **kiosk Express BFF** (`playa-montana-kiosk/backend`), which
proxies to the **Menu App** and **Booking App**. Orders and kitchen data still
live in the kiosk SQLite layer.

### What's Built
- Frontend: Welcome → Menu → Cart → Confirmation; kitchen/token routes
- `frontend/src/api.js` — thin client for `/api/*` on the kiosk server
- Express BFF: proxies `validate-guest`, `validate-token`, `charge-booking` to
  `BOOKING_APP_URL` (default `http://localhost:3001`); menu from `MENU_APP_URL`
- Context-based state (GuestContext, CartContext); PWA plugin in Vite

### What's Not Built Yet / Partial
- Some Booking App kiosk routes (e.g. validate-token, charge-booking) may still
  be missing — BFF will return upstream errors until implemented
- QR token flow depends on backend support
- Email confirmations (SMTP) optional via env

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | React 19 + Vite 7 | JSX (not TypeScript) |
| Styling | Tailwind CSS v4 | Via `@tailwindcss/vite` plugin |
| Routing | react-router-dom v7 | `createBrowserRouter` |
| State | React Context API | GuestContext, CartContext |
| BFF + orders DB | Node.js + Express + SQLite (better-sqlite3) | Default port **3004** |
| Real-time | Socket.io | Kitchen display + polling fallback |
| PWA | vite-plugin-pwa | Configured in `vite.config.js` |

## Project Structure

```
playa-montana-kiosk/
├── CLAUDE.md                 ← this file
├── README.md                 ← original spec (partially outdated)
├── architecture.md           ← current architecture proposal
│
├── frontend/
│   ├── index.html
│   ├── package.json          ← npm (not pnpm)
│   ├── vite.config.js
│   ├── eslint.config.js
│   └── src/
│       ├── main.jsx          ← entry point, providers + router
│       ├── router.jsx        ← routes: /, /menu, /cart, /confirmation
│       ├── index.css         ← Tailwind imports
│       ├── api.js            ← HTTP client → kiosk /api (BFF)
│       ├── context/
│       │   ├── GuestContext.jsx  ← guest identity state
│       │   └── CartContext.jsx   ← cart items state
│       ├── pages/
│       │   ├── Welcome.jsx       ← surname + PIN entry
│       │   ├── Menu.jsx          ← category tabs + item grid
│       │   ├── Cart.jsx          ← review order + notes
│       │   └── Confirmation.jsx  ← order placed confirmation
│       └── components/
│           ├── MenuItem.jsx      ← single menu item card
│           └── CartButton.jsx    ← floating cart indicator
│
└── backend/                  ← Express BFF + SQLite orders (see backend/.env.example)
```

## Development

```bash
cd frontend
npm install
npm run dev          # starts on http://localhost:5173
```

The Vite dev server proxies `/api` (and Socket.io) to the **kiosk Express**
server (default `http://localhost:3004`). That server uses `BOOKING_APP_URL`
(default **booking API** `http://localhost:3001`) and `MENU_APP_URL` (menu app,
default `http://localhost:3002`). Copy `backend/.env.example` → `backend/.env`;
the server loads that file on startup via `dotenv`.

### Routes
| Path | Screen | Status |
|---|---|---|
| `/` | Welcome (guest login) | Implemented (mock) |
| `/menu` | Menu browsing | Implemented (mock) |
| `/cart` | Cart review | Implemented (mock) |
| `/confirmation` | Order confirmation | Implemented (mock) |
| `/kitchen` | Kitchen display | Not implemented |
| `/admin` | Admin panel | Removed from scope (handled by Menu App) |

## Architecture Decisions

These are locked in — do not deviate without explicit approval:

1. **Identity is booking-based, not room-based.** Guests authenticate with
   surname + 4-digit PIN. A single booking can span multiple rooms. Orders and
   charges are tied to the booking ID.

2. **Menu data comes from the Menu App.** Do not build menu CRUD into this app.
   The mock data in `api.js` simulates the Menu App's response.

3. **Guest validation comes from the Booking App.** Do not build guest/room
   management. The mock in `api.js` simulates the Booking App's response.

4. **The kiosk database stores only orders.** No menu tables, no guest tables.
   `item_name` and `unit_price` are snapshotted on order items so menu changes
   don't alter historical records.

5. **PWA, not native.** One codebase serves guest phones, shared tablets, and
   kitchen displays. No app store distribution.

6. **Socket.io for real-time kitchen updates** with HTTP polling as automatic
   fallback.

7. **Fraud prevention is layered:** Surname + PIN authentication, JWT tokens in
   QR codes, spending limits per booking, email confirmations to guest.

## Coding Conventions

- **Language:** JavaScript (JSX), not TypeScript. The codebase does not use TS.
- **Components:** Keep small and focused. One component per file.
- **State management:** Use React Context for shared state. No Redux or Zustand.
- **Styling:** Tailwind CSS utility classes. No CSS modules or styled-components.
- **File naming:** PascalCase for components (`MenuItem.jsx`), camelCase for
  utilities (`api.js`).
- **Routing:** All routes defined in `router.jsx` using `createBrowserRouter`.
- **API layer:** All browser calls go through `api.js` to the kiosk BFF. Add new
  routes on the Express server and corresponding `fetch` helpers as needed.

## External Systems (Reviewed)

Both external systems have been scanned. Neither currently provides the kiosk
endpoints — new endpoints must be added to each.

### Menu Management System (`menu-management-system/`)
- **Stack:** NestJS 11 + TypeScript + MySQL + TypeORM, port 3002
- **Auth:** 6-digit PIN → JWT. All endpoints require auth.
- **Existing API:** `/api/v1/menu-categories` (paginated), `/api/v1/menu-items`
  (paginated, filterable). Separate endpoints, not nested.
- **Data:** Items ↔ Categories is many-to-many. Fields: `name`, `description`,
  `price`, `image_url`, `sort_order`, `is_available`, `is_active`. No `tags`.
- **What kiosk needs:** New public endpoint `GET /api/v1/kiosk/menu` returning
  nested categories+items without auth.

### Booking Management App (`backend/`)
- **Stack:** NestJS 11 + TypeScript + MySQL + TypeORM; **API often on port 3001**
  (e.g. Docker `backend-dev`); confirm with your `PORT` / compose mapping
- **Auth:** Staff username+password → JWT. All endpoints require auth.
- **Entities:** Guest (no email, no pin), Booking, BookingRoom, Invoice, InvoiceItem
- **What kiosk needs:**
  - Add `email` and `kiosk_pin` fields to Guest entity
  - `POST /api/v1/kiosk/validate-guest` — public, accepts `{ lastName, pin }`
  - `POST /api/v1/kiosk/validate-token` — public, validates QR JWT
  - `POST /api/v1/kiosk/charge-booking` — creates InvoiceItem (type: food)
  - `POST /api/v1/kiosk/generate-token` — staff-only, generates QR JWT

## Integration Contracts

See `architecture.md` Section 9 for full request/response shapes.

### From Menu App (to be built on Menu App)
- `GET /api/v1/kiosk/menu` — public, returns nested categories+items

### From Booking App (to be built on Booking App)
- `POST /api/v1/kiosk/validate-guest` — public, accepts `{ lastName, pin }`
- `POST /api/v1/kiosk/validate-token` — public, validates QR JWT
- `POST /api/v1/kiosk/charge-booking` — charges booking via invoice system
- `POST /api/v1/kiosk/generate-token` — staff-only, generates QR JWT for printing

### Kiosk Own API (to be built)
- `POST /api/orders` — place a new order
- `GET /api/orders` — active orders (kitchen display)
- `GET /api/orders/new?since=<ts>` — polling fallback for kitchen
- `PATCH /api/orders/:id/status` — update order status

### Socket.io Events (to be built)
- `new_order` — server → kitchen, when order is placed
- `order_updated` — server → kitchen, when status changes

## Important Notes

- **README.md is partially outdated.** It was the original spec and still
  references room-number-based auth, an admin panel, and a pnpm monorepo.
  The `architecture.md` is the current source of truth for the design.
- **Always use planning mode** before making significant changes.
- **This is a resort LAN application.** It runs on a local network, not the
  public internet. HTTPS is needed for PWA but is handled via local DNS.
- **Touch-first UI.** All screens must work well on tablets and phones. Use
  large tap targets, readable text, and responsive layouts.
- **All three systems use NestJS + TypeScript + MySQL.** The kiosk backend is
  the exception (Node.js + Express + SQLite) because it's self-contained and
  runs locally at the resort.
