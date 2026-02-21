# Restaurant Kiosk Ordering System

## Overview

A locally-hosted, self-contained ordering system for a hotel/resort restaurant.
Guests identify themselves by **Room Number + Last Name**, browse the menu on a
kiosk or their mobile device, place an order, and kitchen staff see live
notifications on wall-mounted displays with tappable status updates.

---

## Decisions Locked In

| # | Topic | Decision |
|---|-------|----------|
| 1 | Guest validation | Mock API — `POST /api/mock/validate-guest` |
| 2 | Kitchen status | Tappable: **Pending → Preparing → Ready** |
| 3 | Billing | Prices shown on menu; charge-to-room via mock API |
| 4 | Menu management | Admin panel included (CRUD on categories + items) |
| 5 | Device support | Fully responsive — works on tablet, kiosk, mobile |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           LOCAL NETWORK (LAN)                           │
│                                                                         │
│  ┌──────────────────┐     ┌──────────────────┐     ┌─────────────────┐  │
│  │  KIOSK / MOBILE  │     │ KITCHEN DISPLAY  │     │   ADMIN PANEL   │  │
│  │  (any browser)   │     │  (TV / Monitor)  │     │ (any browser)   │  │
│  │                  │     │                  │     │                 │  │
│  │  • Enter room #  │     │  • Live orders   │     │  • Add/edit     │  │
│  │  • Browse menu   │     │  • Tap to update │     │    categories   │  │
│  │  • Place order   │     │    status        │     │  • Add/edit     │  │
│  │  • Charge to room│     │  • Sound/visual  │     │    menu items   │  │
│  │                  │     │    alert on new  │     │  • Toggle       │  │
│  └────────┬─────────┘     └────────┬─────────┘     │    availability │  │
│           │                        │               └────────┬────────┘  │
│           │  REST + WS             │  WS (receive)          │ REST      │
│           │                        │  HTTP poll (fallback)  │           │
│           ▼                        ▼                        ▼           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    BACKEND SERVER  (Node.js)                     │    │
│  │                                                                  │    │
│  │  ┌──────────────┐  ┌───────────────┐  ┌────────────────────┐    │    │
│  │  │  REST API    │  │  Socket.io    │  │  Mock External     │    │    │
│  │  │  (Express)   │  │  WebSocket    │  │  APIs              │    │    │
│  │  │              │  │  Server       │  │                    │    │    │
│  │  │  /menu       │  │               │  │  /mock/validate-   │    │    │
│  │  │  /orders     │  │  emit:        │  │    guest           │    │    │
│  │  │  /admin      │  │  "new_order"  │  │  /mock/charge-     │    │    │
│  │  │  /mock/*     │  │  "order_upd"  │  │    room            │    │    │
│  │  └──────┬───────┘  └──────┬────────┘  └────────────────────┘    │    │
│  │         └─────────────────┴──────────────────┐                  │    │
│  │                                               ▼                  │    │
│  │                                     ┌──────────────┐            │    │
│  │                                     │   SQLite DB   │            │    │
│  │                                     └──────────────┘            │    │
│  └──────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Order Flow

```
CUSTOMER (Kiosk / Mobile)           SERVER                  KITCHEN DISPLAY
        │                              │                           │
        │  1. Enter Room # + Last Name │                           │
        ├─────────────────────────────►│                           │
        │  POST /api/mock/validate-guest                           │
        │◄─────────────────────────────┤                           │
        │  { valid: true, name: "..." } │                           │
        │                              │                           │
        │  2. Browse menu              │                           │
        │  3. Add items to cart        │                           │
        │  4. Review order + total     │                           │
        │  5. Confirm → POST /orders   │                           │
        ├─────────────────────────────►│                           │
        │                              │  Save order (status=pending)
        │                              │  POST /mock/charge-room   │
        │                              │─────── emit "new_order" ─►│
        │  6. Order confirmed screen   │                           │ 🔔 Alert
        │◄─────────────────────────────┤                           │
        │                              │                           │
        │                         [WS fails?]                      │
        │                              │◄──────────────────────────┤
        │                              │  GET /orders/new?since=.. │
        │                              │  (every 5s polling)       │
        │                              │──────────────────────────►│

KITCHEN STAFF taps status button:
        │                              │                           │
        │                              │◄──────────────────────────┤
        │                              │  PATCH /orders/:id/status │
        │                              │  { status: "preparing" }  │
        │                              │──── emit "order_updated" ─►│
        │                              │  (all kitchen displays    │
        │                              │   update in real-time)    │
```

---

## WebSocket Fallback Strategy

```
Kitchen Display loads
         │
         ▼
  Try Socket.io connection
         │
    Connected? ──YES──► Listen for "new_order" / "order_updated" events
         │                          │
         NO                    Disconnected?
         │                          │YES
         ▼                          │
  Start polling ◄───────────────────┘
  GET /orders/new?since=<timestamp>
  every 5 seconds
         │
  WS back online? ──YES──► Stop polling, resume WS
```

---

## Data Models

```
┌────────────────────────────┐
│        menu_categories     │
├────────────────────────────┤
│  id            INTEGER PK  │
│  name          TEXT        │
│  display_order INTEGER     │
│  created_at    DATETIME    │
└────────────────────────────┘

┌────────────────────────────┐
│         menu_items         │
├────────────────────────────┤
│  id            INTEGER PK  │
│  category_id   INTEGER FK  │
│  name          TEXT        │
│  description   TEXT        │
│  price         DECIMAL     │
│  image_url     TEXT        │  ← optional
│  tags          TEXT        │  ← JSON: ["vegan","gluten-free"]
│  available     BOOLEAN     │  ← togglable from admin panel
│  display_order INTEGER     │
│  created_at    DATETIME    │
└────────────────────────────┘

┌────────────────────────────┐
│           orders           │
├────────────────────────────┤
│  id            INTEGER PK  │
│  room_number   TEXT        │
│  guest_name    TEXT        │
│  status        TEXT        │  ← pending | preparing | ready
│  total_amount  DECIMAL     │
│  notes         TEXT        │  ← order-level special note
│  charged       BOOLEAN     │  ← room charge succeeded
│  created_at    DATETIME    │
│  updated_at    DATETIME    │
└────────────────────────────┘

┌────────────────────────────┐
│         order_items        │
├────────────────────────────┤
│  id            INTEGER PK  │
│  order_id      INTEGER FK  │
│  menu_item_id  INTEGER FK  │
│  item_name     TEXT        │  ← snapshot at time of order
│  unit_price    DECIMAL     │  ← snapshot at time of order
│  quantity      INTEGER     │
│  item_notes    TEXT        │  ← e.g. "no onions"
└────────────────────────────┘
```

> **Note:** `item_name` and `unit_price` are snapshotted onto each order item so
> that changing the menu later never alters historical order records.

---

## Tech Stack

| Layer              | Technology            | Why                                              |
|--------------------|-----------------------|--------------------------------------------------|
| Kiosk / Kitchen UI | React + Vite          | Fast, component-based, great for touch UIs       |
| Admin Panel        | React (same app)      | Shared components, separate `/admin` route       |
| Styling            | Tailwind CSS          | Responsive utilities, easy large-text for kiosk  |
| Backend            | Node.js + Express     | Lightweight, first-class Socket.io support       |
| Real-time          | Socket.io             | WS with auto-reconnect + fallback built in       |
| Database           | SQLite (better-sqlite3) | Zero config, file-based, perfect for local      |
| Package manager    | pnpm workspaces       | Monorepo with shared types between frontend/backend |

---

## Project Structure

```
restaurant-kiosk/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── schema.js          ← table definitions
│   │   │   ├── seed.js            ← sample menu data
│   │   │   └── index.js           ← DB connection (better-sqlite3)
│   │   ├── routes/
│   │   │   ├── menu.js            ← GET /menu, GET /menu/categories
│   │   │   ├── orders.js          ← POST /orders, PATCH /orders/:id/status
│   │   │   │                         GET /orders/new?since=<ts>
│   │   │   ├── admin.js           ← CRUD for categories & items
│   │   │   └── mock.js            ← POST /mock/validate-guest
│   │   │                             POST /mock/charge-room
│   │   ├── socket/
│   │   │   └── index.js           ← Socket.io setup + event emitters
│   │   └── index.js               ← Express entry point
│   ├── database.sqlite
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── kiosk/
│   │   │   │   ├── Welcome.jsx    ← Room # + Last Name entry
│   │   │   │   ├── Menu.jsx       ← Category tabs + item grid
│   │   │   │   ├── Cart.jsx       ← Review items + total + notes
│   │   │   │   └── Confirmation.jsx
│   │   │   ├── kitchen/
│   │   │   │   └── KitchenBoard.jsx ← 3-column Kanban (Pending/Preparing/Ready)
│   │   │   └── admin/
│   │   │       ├── AdminLogin.jsx
│   │   │       ├── Categories.jsx
│   │   │       └── MenuItems.jsx
│   │   ├── hooks/
│   │   │   ├── useOrderStream.js  ← WS connection + polling fallback
│   │   │   └── useCart.js
│   │   ├── components/
│   │   │   ├── MenuItem.jsx
│   │   │   ├── OrderCard.jsx      ← shared between kitchen + admin views
│   │   │   └── StatusBadge.jsx
│   │   ├── router.jsx             ← / = kiosk, /kitchen, /admin
│   │   └── main.jsx
│   └── package.json
│
├── package.json                   ← pnpm workspace root
└── README.md
```

---

## Screen Layouts

### Kiosk — Welcome Screen (mobile + tablet friendly)
```
┌──────────────────────────────────┐
│                                  │
│       Welcome to [Restaurant]    │
│                                  │
│   ┌──────────────────────────┐   │
│   │  Room Number             │   │
│   └──────────────────────────┘   │
│   ┌──────────────────────────┐   │
│   │  Last Name               │   │
│   └──────────────────────────┘   │
│                                  │
│   ┌──────────────────────────┐   │
│   │        START ORDER       │   │
│   └──────────────────────────┘   │
│                                  │
└──────────────────────────────────┘
```

### Kiosk — Menu Screen
```
┌──────────────────────────────────┐
│  Room 204 · Smith    🛒 Cart (3) │
├──────────────────────────────────┤
│  [Starters] [Mains] [Desserts]  │
│             [Drinks]             │
├──────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐     │
│  │  🍔       │  │  🍕       │     │
│  │  Burger  │  │  Pizza   │     │
│  │  $12.00  │  │  $14.00  │     │
│  │  [Add +] │  │  [Add +] │     │
│  └──────────┘  └──────────┘     │
│  ┌──────────┐  ┌──────────┐     │
│  │  🥗       │  │  🍝       │     │
│  │  Salad   │  │  Pasta   │     │
│  │  $10.00  │  │  $13.00  │     │
│  │  [Add +] │  │  [Add +] │     │
│  └──────────┘  └──────────┘     │
└──────────────────────────────────┘
```

### Kitchen Board
```
┌─────────────────────────────────────────────────────────┐
│  KITCHEN ORDERS                    ● LIVE    14:32      │
├──────────────────┬──────────────────┬───────────────────┤
│  🔴 PENDING (2)  │  🟡 PREPARING(1) │  🟢 READY (1)    │
├──────────────────┼──────────────────┼───────────────────┤
│  #1042  2m ago   │  #1039  8m ago   │  #1037  15m ago  │
│  Room 204 Smith  │  Room 118 Johnson│  Room 305 Martinez│
│  ─────────────── │  ──────────────  │  ──────────────   │
│  2× Burger       │  1× Caesar Salad │  1× Steak        │
│  1× Fries        │  2× Pizza        │  1× Wine         │
│  1× Coke         │                  │                   │
│  Note: no pickles│                  │                   │
│  ─────────────── │  ──────────────  │  ──────────────   │
│  [▶ PREPARING]   │  [▶ READY]       │  [✓ SERVED]      │
│                  │                  │                   │
│  #1041  3m ago   │                  │                   │
│  Room 101 Lee    │                  │                   │
│  ─────────────── │                  │                   │
│  1× Pancakes     │                  │                   │
│  2× OJ           │                  │                   │
│  [▶ PREPARING]   │                  │                   │
└──────────────────┴──────────────────┴───────────────────┘
```

### Admin Panel
```
┌───────────────────────────────────────────────────────┐
│  ⚙ Admin Panel            [Categories] [Menu Items]  │
├───────────────────────────────────────────────────────┤
│  Menu Items                              [+ Add Item] │
│                                                       │
│  Name           Category   Price  Avail  Actions     │
│  ─────────────────────────────────────────────────── │
│  Burger         Mains      $12    ✅      [Edit][Del] │
│  Caesar Salad   Starters   $10    ✅      [Edit][Del] │
│  Chocolate Cake Desserts   $8     ❌      [Edit][Del] │
└───────────────────────────────────────────────────────┘
```

---

## API Reference

### Public (Kiosk)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/menu/categories` | All categories with their items |
| POST | `/api/orders` | Place a new order |
| POST | `/api/mock/validate-guest` | Validate room # + last name |

### Kitchen
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | All active orders (not yet served) |
| GET | `/api/orders/new?since=<ts>` | Orders since timestamp (polling fallback) |
| PATCH | `/api/orders/:id/status` | Update order status |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/admin/categories` | List / create categories |
| PUT/DELETE | `/api/admin/categories/:id` | Update / delete category |
| GET/POST | `/api/admin/items` | List / create menu items |
| PUT/DELETE | `/api/admin/items/:id` | Update / delete menu item |

### Mock External APIs
| Method | Endpoint | Mocks |
|--------|----------|-------|
| POST | `/api/mock/validate-guest` | Hotel guest validation API |
| POST | `/api/mock/charge-room` | Room billing / PMS charge API |

---

## Socket.io Events

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `new_order` | Server → Kitchen | `{ order }` | Fired when a new order is placed |
| `order_updated` | Server → Kitchen | `{ orderId, status }` | Fired when status changes |
| `connection_ack` | Server → Client | `{ timestamp }` | Confirms WS is live |

---

## Running Locally

```bash
# Install dependencies
pnpm install

# Start backend  (port 3001)
pnpm --filter backend dev

# Start frontend (port 5173)
pnpm --filter frontend dev

# Routes:
#   http://localhost:5173/          → Kiosk
#   http://localhost:5173/kitchen  → Kitchen Display
#   http://localhost:5173/admin    → Admin Panel
```

---

## Remaining Questions (Minor)

1. **Admin authentication** — Should the admin panel be password-protected,
   or is access-by-URL sufficient since it's local-only?

2. **Item photos** — Will you provide images for menu items, or should the UI
   work gracefully with no photos (icon/placeholder fallback)?

3. **"Ready" → final step** — After a kitchen staff member marks an order
   **Ready**, is that the end, or should they also mark it **Served/Delivered**?
   (Currently the model stops at Ready.)

4. **Order history** — Should the admin panel have an order history / report
   view, or is that out of scope for now?

---

*Ready to start coding on your go.*
