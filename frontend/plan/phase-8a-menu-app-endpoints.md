# Phase 8a: Menu App — Kiosk Integration Endpoint

> **System:** `menu-management-system/backend/`
> **Stack:** NestJS 11 + TypeScript + MySQL + TypeORM
> **Port:** 3002
> **Effort:** ~0.5 day

---

## Overview

Add one public endpoint to the Menu Management System that returns the full
active menu with categories and nested items, without requiring authentication.
This is the only endpoint the kiosk needs from this system.

---

## Task 1: Create Kiosk Module

Create a dedicated module to keep kiosk-facing endpoints separate from the
existing admin API.

### Files to create

```
backend/src/kiosk/
├── kiosk.module.ts
├── kiosk-menu.controller.ts
└── kiosk-menu.service.ts
```

### 1.1 `kiosk.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuCategory } from '../menu/entities/menu-category.entity';
import { MenuItem } from '../menu/entities/menu-item.entity';
import { KioskMenuController } from './kiosk-menu.controller';
import { KioskMenuService } from './kiosk-menu.service';

@Module({
  imports: [TypeOrmModule.forFeature([MenuCategory, MenuItem])],
  controllers: [KioskMenuController],
  providers: [KioskMenuService],
})
export class KioskModule {}
```

### 1.2 Register in `app.module.ts`

Add `KioskModule` to the imports array in `app.module.ts`:

```typescript
import { KioskModule } from './kiosk/kiosk.module';

@Module({
  imports: [
    // ... existing modules
    KioskModule,
  ],
})
export class AppModule {}
```

---

## Task 2: Implement the Endpoint

### 2.1 `kiosk-menu.service.ts`

Query all active categories with their active+available items, sorted by
`sort_order`.

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { MenuCategory } from '../menu/entities/menu-category.entity';

@Injectable()
export class KioskMenuService {
  constructor(
    @InjectRepository(MenuCategory)
    private readonly categoryRepo: Repository<MenuCategory>,
  ) {}

  async getKioskMenu() {
    const categories = await this.categoryRepo
      .createQueryBuilder('cat')
      .leftJoinAndSelect('cat.items', 'item',
        'item.is_available = :avail AND item.is_active = :active AND item.deleted_at IS NULL',
        { avail: true, active: true }
      )
      .where('cat.is_active = :active', { active: true })
      .andWhere('cat.deleted_at IS NULL')
      .orderBy('cat.sort_order', 'ASC')
      .addOrderBy('item.sort_order', 'ASC')
      .getMany();

    // Filter out categories with no available items
    return categories
      .filter(cat => cat.items && cat.items.length > 0)
      .map(cat => ({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        sortOrder: cat.sortOrder,
        items: cat.items.map(item => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          isAvailable: item.isAvailable,
          imageUrl: item.imageUrl,
          sortOrder: item.sortOrder,
        })),
      }));
  }
}
```

### 2.2 `kiosk-menu.controller.ts`

Single GET endpoint, marked as `@Public()` to bypass the global `AuthGuard`.

```typescript
import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { KioskMenuService } from './kiosk-menu.service';

@Controller('kiosk')
export class KioskMenuController {
  constructor(private readonly kioskMenuService: KioskMenuService) {}

  @Public()
  @Get('menu')
  async getMenu() {
    const data = await this.kioskMenuService.getKioskMenu();
    return { success: true, data };
  }
}
```

---

## Task 3: Verify the `@Public()` Decorator Works

The Menu App uses a global `AuthGuard` registered via `APP_GUARD`. The existing
`@Public()` decorator (in `auth/decorators/public.decorator.ts`) sets metadata
`isPublic = true`, which the `AuthGuard` checks to skip JWT validation.

**Verify:** The `AuthGuard` in `auth/guards/auth.guard.ts` handles the
`IS_PUBLIC_KEY` metadata. If it does, no changes needed. If not, update the
guard to check for public routes.

The existing decorator:

```typescript
// auth/decorators/public.decorator.ts — already exists
import { SetMetadata } from '@nestjs/common';
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

---

## Task 4: Test

### Manual test with curl

```bash
# Should return menu without auth token
curl http://localhost:3002/api/v1/kiosk/menu | jq

# Expected response shape:
# {
#   "success": true,
#   "data": [
#     {
#       "id": 1,
#       "name": "Main",
#       "description": "Main course dishes",
#       "sortOrder": 1,
#       "items": [
#         {
#           "id": 101,
#           "name": "Garlic Chicken",
#           "description": "Prepared by quickly frying...",
#           "price": 150.00,
#           "isAvailable": true,
#           "imageUrl": "http://localhost:3002/uploads/garlic-chicken.jpg",
#           "sortOrder": 1
#         }
#       ]
#     }
#   ]
# }
```

### Verify filters

1. Items where `is_available = false` should NOT appear
2. Items where `is_active = false` should NOT appear
3. Soft-deleted items (`deleted_at IS NOT NULL`) should NOT appear
4. Categories where `is_active = false` should NOT appear
5. Categories with zero available items should NOT appear
6. Items and categories should be sorted by `sort_order` ASC

---

## Task 5: Update Kiosk `api.js` (on kiosk side)

Once this endpoint is live, update the real API implementation in the kiosk's
`frontend/src/api.js` to point to this endpoint:

```javascript
async function realFetchMenu() {
  const res = await fetch('http://<menu-app-host>:3002/api/v1/kiosk/menu')
  if (!res.ok) throw new Error('Failed to load menu')
  const json = await res.json()
  return json.data  // unwrap the { success, data } envelope
}
```

The response shape maps to what the kiosk frontend expects:
- `name` → category tab label
- `items[].name` → item card title
- `items[].description` → item card description
- `items[].price` → item card price
- `items[].imageUrl` → item card image (fallback to emoji if null)

**Note:** The existing mock data in `api.js` includes an `emoji` field per item.
The Menu App doesn't have this. The kiosk frontend should be updated to show
`imageUrl` when available, and fall back to a generic food icon (not emoji)
when `imageUrl` is null.

---

## Summary

| # | Task | File(s) | Effort |
|---|---|---|---|
| 1 | Create kiosk module | `kiosk/kiosk.module.ts`, register in `app.module.ts` | 15 min |
| 2 | Implement endpoint | `kiosk-menu.controller.ts`, `kiosk-menu.service.ts` | 1 hr |
| 3 | Verify @Public works | `auth/guards/auth.guard.ts` | 15 min |
| 4 | Test | curl / Postman | 30 min |
| 5 | Update kiosk api.js | `playa-montana-kiosk/frontend/src/api.js` | 15 min |
