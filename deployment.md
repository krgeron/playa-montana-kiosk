# Playa Montana Kiosk — Railway Deployment Plan

## Overview

Deploy the Playa Montana Kiosk as a **single service** in the existing **beach-hotel** Railway project.
The Dockerfile builds the React frontend and bundles it into the Express backend — one image, one service.

### Existing project state

| Service                       | Status  | Role                                                        |
|-------------------------------|---------|-------------------------------------------------------------|
| `MySQL`                       | Online  | Shared DB — not used by kiosk                               |
| `beach-hotel-backend`         | Online  | Booking App — provides kiosk auth + charge endpoints ✅     |
| `beach-hotel-frontend`        | Online  | Admin UI — unrelated, do not touch                          |
| `menu-management-backend`     | Online  | Menu App — provides kiosk menu endpoint ✅                  |
| `menu-management-frontend`    | Online  | Menu admin UI — unrelated, do not touch                     |

### New service

| Service                | Builder    | Source Directory          |
|------------------------|------------|---------------------------|
| `playa-montana-kiosk`  | Dockerfile | `playa-montana-kiosk/`    |

---

## Architecture

```
beach-hotel (Railway project)
├── MySQL                           ← existing, not used by kiosk
├── beach-hotel-backend             ← BOOKING_APP_URL
│   └── /api/v1/kiosk/*             ← validate-guest, validate-token,
│                                      charge-booking, uncharge-booking ✅
├── beach-hotel-frontend            ← untouched
├── menu-management-backend         ← MENU_APP_URL
│   └── /api/v1/kiosk/menu          ← public menu endpoint ✅
├── menu-management-frontend        ← untouched
└── playa-montana-kiosk             ← NEW (single service)
    ├── React SPA (served as static files)
    ├── Express BFF + Socket.io
    ├── SQLite orders DB
    └── playa-montana-kiosk-volume → /app/database.sqlite
```

### How the kiosk integrates

| Kiosk Action                | Calls                                                        |
|-----------------------------|--------------------------------------------------------------|
| Load menu                   | `GET MENU_APP_URL/api/v1/kiosk/menu`                        |
| Validate guest (surname+PIN)| `POST BOOKING_APP_URL/api/v1/kiosk/validate-guest`          |
| Validate QR token           | `POST BOOKING_APP_URL/api/v1/kiosk/validate-token`          |
| Charge order to booking     | `POST BOOKING_APP_URL/api/v1/kiosk/charge-booking`          |
| Reverse charge              | `POST BOOKING_APP_URL/api/v1/kiosk/uncharge-booking`        |
| Real-time kitchen updates   | Socket.io (self-contained within kiosk service)             |

---

## Readiness Assessment

### No code blockers
The kiosk is deployment-ready with no code changes required:

| Check | Status |
|---|---|
| `railway.toml` configured (Dockerfile builder, `/health` check) | ✅ |
| Multi-stage Dockerfile (React → Express bundle) | ✅ |
| Health endpoint `GET /health` → `{ status: 'ok' }` | ✅ |
| Frontend uses relative `/api` path (no hardcoded production URLs) | ✅ |
| Backend URLs fully env-var driven | ✅ |
| `beach-hotel-backend` kiosk module built | ✅ |
| `menu-management-backend` kiosk menu endpoint built | ✅ |

### One infrastructure requirement
SQLite database at `/app/database.sqlite` is ephemeral by default.
A Railway Volume must be mounted at `/app/database.sqlite` to persist orders across redeploys.

---

## Environment Variables

### `playa-montana-kiosk`

| Variable          | Value                                                                    | Required | Notes                                    |
|-------------------|--------------------------------------------------------------------------|----------|------------------------------------------|
| `MENU_APP_URL`    | `https://menu-management-backend-production-52b8.up.railway.app`        | ✅       | Menu App already deployed                |
| `BOOKING_APP_URL` | `https://beach-hotel-backend-production.up.railway.app`                 | ✅       | Booking App already deployed             |
| `ORDER_CAP`       | `5000`                                                                   | Optional | Per-order spending cap (PHP)             |
| `DAILY_CAP`       | `15000`                                                                  | Optional | Daily spending cap per booking (PHP)     |
| `PORT`            | *(Railway auto-assigns)*                                                 | Optional | Defaults to 3004                         |
| `SMTP_HOST`       | *(leave blank)*                                                          | Optional | Email confirmations disabled if unset    |
| `SMTP_USER`       | *(leave blank)*                                                          | Optional | Configure later to enable email          |
| `SMTP_PASS`       | *(leave blank)*                                                          | Optional | Configure later to enable email          |
| `EMAIL_FROM`      | `orders@playamontana.com`                                                | Optional | Sender address for order confirmations   |

---

## Deployment Steps

### Step 1 — Create the service

```bash
railway link --project 66341413-c693-4539-9ab0-334c356a14cf
railway add --service playa-montana-kiosk
```

### Step 2 — Set environment variables

```bash
railway service link playa-montana-kiosk

railway variables set \
  MENU_APP_URL=https://menu-management-backend-production-52b8.up.railway.app \
  BOOKING_APP_URL=https://beach-hotel-backend-production.up.railway.app \
  ORDER_CAP=5000 \
  DAILY_CAP=15000
```

### Step 3 — Deploy from the correct subdirectory

```bash
railway up /Users/carloliwanag/workspaces/beach-hotel/playa-montana-kiosk \
  --path-as-root \
  --service playa-montana-kiosk \
  --detach
```

Railway reads `railway.toml` in the uploaded directory → Dockerfile builder.

### Step 4 — Generate a public domain

```bash
railway domain --service playa-montana-kiosk
```

Note the generated URL (e.g. `playa-montana-kiosk-production.up.railway.app`).

### Step 5 — Add persistent volume for SQLite orders

```bash
railway volume add --mount-path /app/database.sqlite
```

This ensures orders survive container restarts and redeploys.

### Step 6 — Verify deployment

```bash
# Health check
curl https://<kiosk-domain>/health
# Expected: {"status":"ok"}

# Menu proxy (calls menu-management-backend)
curl https://<kiosk-domain>/api/menu/categories
# Expected: array of menu categories with items

# Frontend
open https://<kiosk-domain>/
# Expected: React SPA welcome screen loads
```

---

## Post-Deployment Checklist

- [ ] Health check returns `{ "status": "ok" }`
- [ ] Frontend React SPA loads in browser
- [ ] Menu categories and items load (calls `menu-management-backend`)
- [ ] Guest login works with surname + PIN (calls `beach-hotel-backend`)
- [ ] Test order placed — appears in SQLite + Socket.io kitchen view
- [ ] Redeploy and confirm orders persist (volume test)
- [ ] Existing beach-hotel services unaffected

---

## Rollback Plan

If the service is unhealthy:

```bash
railway logs --service playa-montana-kiosk
railway rollback --service playa-montana-kiosk
```

The SQLite volume persists independently — a rollback does not affect stored orders.

---

## Risks & Mitigations

| Risk                                                   | Mitigation                                                              |
|--------------------------------------------------------|-------------------------------------------------------------------------|
| Orders lost on container restart/redeploy              | Railway Volume mounted at `/app/database.sqlite` (Step 5)              |
| `MENU_APP_URL` misconfigured → menu fails to load      | URL confirmed; `GET /api/v1/kiosk/menu` verified on menu backend        |
| `BOOKING_APP_URL` misconfigured → guest login fails    | URL confirmed; full kiosk module verified on beach-hotel-backend        |
| Railway uploads workspace root instead of subdirectory | Use `--path-as-root` flag (lesson learned from menu-management deploy)  |
| Socket.io CORS set to `*`                              | Acceptable for LAN kiosk use; tighten if exposed to public internet     |
| SQLite not suited for high concurrency                 | Acceptable for resort use; WAL mode enabled for concurrent reads        |
