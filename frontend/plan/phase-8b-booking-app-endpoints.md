# Phase 8b: Booking App — Kiosk Integration Endpoints

> **System:** `backend/` (Beach Hotel Booking Management)
> **Stack:** NestJS 11 + TypeScript + MySQL + TypeORM
> **Port:** 3000
> **Effort:** ~2–3 days

---

## Overview

Add kiosk-facing endpoints to the Booking Management App so the kiosk can:
1. Validate guests by surname + PIN
2. Validate QR code tokens (JWT)
3. Charge orders to a booking (via the invoice system)
4. Generate QR tokens for printing at check-in (staff-only)

This also requires adding `email` and `kiosk_pin` fields to the Guest entity.

---

## Task 1: Database Migration — Add Fields to Guest

Add two new nullable columns to the `guests` table.

### 1.1 Create migration

```bash
cd backend
npx typeorm migration:create src/migrations/AddKioskFieldsToGuest
```

### 1.2 Migration code

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddKioskFieldsToGuest<timestamp> implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE guests
      ADD COLUMN email VARCHAR(255) NULL AFTER mobileNumber,
      ADD COLUMN kiosk_pin VARCHAR(4) NULL AFTER email
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE guests
      DROP COLUMN kiosk_pin,
      DROP COLUMN email
    `);
  }
}
```

### 1.3 Update Guest entity

In `src/guests/entities/guest.entity.ts`, add the new fields:

```typescript
@Column({ type: 'varchar', length: 255, nullable: true })
email: string | null;

@Column({ name: 'kiosk_pin', type: 'varchar', length: 4, nullable: true })
kioskPin: string | null;
```

Add these after the `mobileNumber` field.

### 1.4 Run migration

```bash
npm run migration:run
```

---

## Task 2: Update Guest DTOs and Service

### 2.1 Update CreateGuestDto

Add optional fields so staff can set email and PIN when creating/updating guests:

```typescript
@IsOptional()
@IsEmail()
email?: string;

@IsOptional()
@IsString()
@Length(4, 4)
@Matches(/^\d{4}$/, { message: 'PIN must be exactly 4 digits' })
kioskPin?: string;
```

### 2.2 Update UpdateGuestDto

Same fields, optional.

### 2.3 Consider auto-generating PIN at check-in

In the bookings service, when status changes to `checked_in`:
- If the guest does not have a `kioskPin`, generate a random 4-digit PIN
- Save it to the guest record
- Return it in the check-in response (so it can be printed on the welcome card)

```typescript
function generatePin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}
```

---

## Task 3: Create Kiosk Module

### Files to create

```
backend/src/kiosk/
├── kiosk.module.ts
├── kiosk.controller.ts
├── kiosk.service.ts
└── dtos/
    ├── validate-guest.dto.ts
    ├── validate-token.dto.ts
    └── charge-booking.dto.ts
```

### 3.1 `kiosk.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Guest } from '../guests/entities/guest.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { BookingRoom } from '../bookings/entities/booking-room.entity';
import { Invoice } from '../invoices/entities/invoice.entity';
import { InvoiceItem } from '../invoices/entities/invoice-item.entity';
import { KioskController } from './kiosk.controller';
import { KioskService } from './kiosk.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Guest, Booking, BookingRoom, Invoice, InvoiceItem]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('KIOSK_JWT_SECRET'),
        signOptions: { },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [KioskController],
  providers: [KioskService],
})
export class KioskModule {}
```

### 3.2 Register in `app.module.ts`

```typescript
import { KioskModule } from './kiosk/kiosk.module';

@Module({
  imports: [
    // ... existing modules
    KioskModule,
  ],
})
```

### 3.3 Add environment variable

In `.env`:

```
KIOSK_JWT_SECRET=your-secure-random-secret-here
```

---

## Task 4: DTOs

### 4.1 `validate-guest.dto.ts`

```typescript
import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';

export class ValidateGuestDto {
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @Length(4, 4)
  @Matches(/^\d{4}$/, { message: 'PIN must be exactly 4 digits' })
  pin: string;
}
```

### 4.2 `validate-token.dto.ts`

```typescript
import { IsString, IsNotEmpty } from 'class-validator';

export class ValidateTokenDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}
```

### 4.3 `charge-booking.dto.ts`

```typescript
import { IsNumber, IsNotEmpty, IsString, IsOptional, IsArray,
         ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

class ChargeLineItem {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class ChargeBookingDto {
  @IsNumber()
  @IsNotEmpty()
  bookingId: number;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChargeLineItem)
  items?: ChargeLineItem[];
}
```

---

## Task 5: Kiosk Service

### 5.1 `kiosk.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Guest } from '../guests/entities/guest.entity';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
import { BookingRoom } from '../bookings/entities/booking-room.entity';
import { Invoice, InvoiceStatus } from '../invoices/entities/invoice.entity';
import { InvoiceItem, InvoiceItemType } from '../invoices/entities/invoice-item.entity';

@Injectable()
export class KioskService {
  constructor(
    @InjectRepository(Guest)
    private readonly guestRepo: Repository<Guest>,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(BookingRoom)
    private readonly bookingRoomRepo: Repository<BookingRoom>,
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(InvoiceItem)
    private readonly invoiceItemRepo: Repository<InvoiceItem>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ─── Validate Guest (Surname + PIN) ──────────────────────────

  async validateGuest(lastName: string, pin: string) {
    // Find guest by last name (case-insensitive) and PIN
    const guest = await this.guestRepo
      .createQueryBuilder('guest')
      .where('LOWER(guest.lastName) = LOWER(:lastName)', { lastName })
      .andWhere('guest.kiosk_pin = :pin', { pin })
      .andWhere('guest.deletedAt IS NULL')
      .getOne();

    if (!guest) {
      return { valid: false };
    }

    // Find active (checked-in) booking for this guest
    const booking = await this.bookingRepo.findOne({
      where: {
        guestId: guest.id,
        status: BookingStatus.CHECKED_IN,
        deletedAt: null,
      },
    });

    if (!booking) {
      return { valid: false };
    }

    // Get rooms for this booking
    const rooms = await this.getRoomsForBooking(booking.id);

    return {
      valid: true,
      bookingId: booking.id,
      guestName: `${guest.firstName} ${guest.lastName}`,
      guestEmail: guest.email || null,
      rooms,
      checkOut: booking.checkOutDateTime,
    };
  }

  // ─── Validate Token (QR JWT) ─────────────────────────────────

  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      const bookingId = payload.bookingId;

      // Verify booking still exists and is checked in
      const booking = await this.bookingRepo.findOne({
        where: {
          id: bookingId,
          status: BookingStatus.CHECKED_IN,
          deletedAt: null,
        },
        relations: ['guest'],
      });

      if (!booking || !booking.guest) {
        return { valid: false, reason: 'Booking not found or not active' };
      }

      const rooms = await this.getRoomsForBooking(booking.id);

      return {
        valid: true,
        bookingId: booking.id,
        guestName: `${booking.guest.firstName} ${booking.guest.lastName}`,
        guestEmail: booking.guest.email || null,
        rooms,
      };
    } catch (err) {
      const reason = err.name === 'TokenExpiredError'
        ? 'Token expired'
        : 'Invalid token';
      return { valid: false, reason };
    }
  }

  // ─── Charge Booking ──────────────────────────────────────────

  async chargeBooking(
    bookingId: number,
    amount: number,
    description: string,
    lineItems?: { name: string; quantity: number; unitPrice: number }[],
  ) {
    // Verify booking exists
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId, deletedAt: null },
    });

    if (!booking) {
      return { success: false, reason: 'Booking not found' };
    }

    // Find or create invoice for this booking
    let invoice = await this.invoiceRepo.findOne({
      where: {
        bookingId,
        status: InvoiceStatus.DRAFT,
        deletedAt: null,
      },
    });

    if (!invoice) {
      invoice = await this.invoiceRepo.findOne({
        where: {
          bookingId,
          status: InvoiceStatus.ISSUED,
          deletedAt: null,
        },
      });
    }

    if (!invoice) {
      return { success: false, reason: 'No active invoice for this booking' };
    }

    // Create invoice item for the food charge
    const invoiceItem = this.invoiceItemRepo.create({
      invoiceId: invoice.id,
      description,
      quantity: 1,
      unitPrice: amount,
      totalPrice: amount,
      itemType: InvoiceItemType.FOOD,
    });

    const saved = await this.invoiceItemRepo.save(invoiceItem);

    // Update invoice totals
    invoice.subtotal = Number(invoice.subtotal) + amount;
    invoice.totalAmount = Number(invoice.totalAmount) + amount;
    await this.invoiceRepo.save(invoice);

    return { success: true, invoiceItemId: saved.id };
  }

  // ─── Generate Token (staff use) ──────────────────────────────

  async generateToken(bookingId: number) {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId, deletedAt: null },
      relations: ['guest'],
    });

    if (!booking || !booking.guest) {
      return null;
    }

    const rooms = await this.getRoomsForBooking(bookingId);

    const payload = {
      bookingId: booking.id,
      guestName: `${booking.guest.firstName} ${booking.guest.lastName}`,
      rooms: rooms.map(r => r.roomNumber),
      checkOut: booking.checkOutDateTime,
    };

    // Token expires at checkout time
    const expiresAt = new Date(booking.checkOutDateTime);
    const expiresInSeconds = Math.max(
      0,
      Math.floor((expiresAt.getTime() - Date.now()) / 1000)
    );

    const token = this.jwtService.sign(payload, {
      expiresIn: expiresInSeconds,
    });

    const kioskDomain = this.configService.get<string>(
      'KIOSK_DOMAIN',
      'https://order.playamontana.com'
    );

    return {
      token,
      url: `${kioskDomain}/order?token=${token}`,
      expiresAt: expiresAt.toISOString(),
    };
  }

  // ─── Helper ──────────────────────────────────────────────────

  private async getRoomsForBooking(bookingId: number) {
    const bookingRooms = await this.bookingRoomRepo.find({
      where: { bookingId, deletedAt: null },
      relations: ['room'],
    });

    return bookingRooms.map(br => ({
      id: br.room.id,
      roomNumber: br.room.roomNumber,
      name: br.room.name,
    }));
  }
}
```

---

## Task 6: Kiosk Controller

### 6.1 `kiosk.controller.ts`

```typescript
import { Controller, Post, Body, Param, ParseIntPipe,
         HttpCode, HttpStatus } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { KioskService } from './kiosk.service';
import { ValidateGuestDto } from './dtos/validate-guest.dto';
import { ValidateTokenDto } from './dtos/validate-token.dto';
import { ChargeBookingDto } from './dtos/charge-booking.dto';

@Controller('kiosk')
export class KioskController {
  constructor(private readonly kioskService: KioskService) {}

  @Public()
  @Post('validate-guest')
  @HttpCode(HttpStatus.OK)
  async validateGuest(@Body() dto: ValidateGuestDto) {
    return this.kioskService.validateGuest(dto.lastName, dto.pin);
  }

  @Public()
  @Post('validate-token')
  @HttpCode(HttpStatus.OK)
  async validateToken(@Body() dto: ValidateTokenDto) {
    return this.kioskService.validateToken(dto.token);
  }

  @Public()
  @Post('charge-booking')
  @HttpCode(HttpStatus.OK)
  async chargeBooking(@Body() dto: ChargeBookingDto) {
    return this.kioskService.chargeBooking(
      dto.bookingId,
      dto.amount,
      dto.description,
      dto.items,
    );
  }

  // Staff-only: requires existing auth JWT
  @Post('generate-token/:bookingId')
  async generateToken(@Param('bookingId', ParseIntPipe) bookingId: number) {
    const result = await this.kioskService.generateToken(bookingId);
    if (!result) {
      return { success: false, reason: 'Booking not found' };
    }
    return { success: true, ...result };
  }
}
```

**Note:** The first three endpoints are `@Public()` (no auth). The
`generate-token` endpoint requires staff authentication (existing `AuthGuard`
applies automatically).

---

## Task 7: Auto-Generate PIN on Check-In

In the bookings service, when booking status changes to `checked_in`, auto-
generate a PIN if the guest doesn't have one.

### 7.1 Find the status update method

In `src/bookings/services/bookings.service.ts`, locate the method that handles
status changes (likely `updateStatus` or similar).

### 7.2 Add PIN generation logic

After the status is set to `checked_in`:

```typescript
if (newStatus === BookingStatus.CHECKED_IN && booking.guest) {
  if (!booking.guest.kioskPin) {
    booking.guest.kioskPin = Math.floor(1000 + Math.random() * 9000).toString();
    await this.guestRepo.save(booking.guest);
  }
}
```

### 7.3 Return PIN in check-in response

Update the status change response to include the PIN so it can be displayed
or printed:

```typescript
return {
  ...bookingResponse,
  kioskPin: booking.guest?.kioskPin,
};
```

---

## Task 8: Add Environment Variables

Add to `.env.example` and `.env`:

```bash
# Kiosk integration
KIOSK_JWT_SECRET=change-me-to-a-secure-random-string
KIOSK_DOMAIN=https://order.playamontana.com
```

---

## Task 9: Test All Endpoints

### 9.1 Validate Guest

```bash
# First, ensure a guest exists with a PIN:
# (set via admin or auto-generated at check-in)

curl -X POST http://localhost:3000/api/v1/kiosk/validate-guest \
  -H "Content-Type: application/json" \
  -d '{"lastName": "Santos", "pin": "8374"}'

# Success:
# {
#   "valid": true,
#   "bookingId": 42,
#   "guestName": "Maria Santos",
#   "guestEmail": "maria.santos@email.com",
#   "rooms": [{ "id": 5, "roomNumber": "204", "name": "Deluxe 204" }],
#   "checkOut": "2026-03-15T12:00:00.000Z"
# }

# Failure (wrong PIN or no active booking):
# { "valid": false }
```

### 9.2 Validate Token

```bash
# First, generate a token (requires staff auth):
curl -X POST http://localhost:3000/api/v1/kiosk/generate-token/42 \
  -H "Authorization: Bearer <staff-jwt>"

# Then validate it:
curl -X POST http://localhost:3000/api/v1/kiosk/validate-token \
  -H "Content-Type: application/json" \
  -d '{"token": "eyJhbGciOi..."}'
```

### 9.3 Charge Booking

```bash
curl -X POST http://localhost:3000/api/v1/kiosk/charge-booking \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": 42,
    "amount": 598.00,
    "description": "Restaurant order #1042",
    "items": [
      {"name": "Garlic Chicken", "quantity": 2, "unitPrice": 150.00},
      {"name": "Iced Tea", "quantity": 1, "unitPrice": 69.00}
    ]
  }'

# Verify: check the invoice for booking 42 has a new FOOD item
```

### 9.4 Generate Token

```bash
curl -X POST http://localhost:3000/api/v1/kiosk/generate-token/42 \
  -H "Authorization: Bearer <staff-jwt>"

# {
#   "success": true,
#   "token": "eyJhbGciOi...",
#   "url": "https://order.playamontana.com/order?token=eyJhbGciOi...",
#   "expiresAt": "2026-03-15T12:00:00.000Z"
# }
```

---

## Task 10: Edge Cases to Handle

| Scenario | Expected Behavior |
|---|---|
| Wrong last name | `{ valid: false }` |
| Wrong PIN | `{ valid: false }` |
| Correct credentials but guest not checked in | `{ valid: false }` |
| Guest checked out (booking status = checked_out) | `{ valid: false }` |
| Expired QR token | `{ valid: false, reason: "Token expired" }` |
| Tampered QR token | `{ valid: false, reason: "Invalid token" }` |
| Charge to non-existent booking | `{ success: false, reason: "Booking not found" }` |
| Charge to booking with no invoice | `{ success: false, reason: "No active invoice..." }` |
| Multiple guests with same last name + different PINs | Each gets a unique PIN; only exact match works |
| Guest has no email | `guestEmail` returns `null`; kiosk skips email step |

---

## Summary

| # | Task | Files | Effort |
|---|---|---|---|
| 1 | Migration: add email + kiosk_pin to guests | migration file, guest.entity.ts | 30 min |
| 2 | Update guest DTOs | create/update DTOs | 15 min |
| 3 | Create kiosk module | kiosk.module.ts, register in app.module.ts | 15 min |
| 4 | Create DTOs | 3 DTO files | 20 min |
| 5 | Implement kiosk service | kiosk.service.ts (4 methods) | 2–3 hrs |
| 6 | Implement controller | kiosk.controller.ts (4 endpoints) | 30 min |
| 7 | Auto-generate PIN on check-in | bookings.service.ts | 30 min |
| 8 | Environment variables | .env, .env.example | 5 min |
| 9 | Test all endpoints | curl / Postman | 1 hr |
| 10 | Edge case verification | — | 30 min |
