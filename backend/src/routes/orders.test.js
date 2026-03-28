/**
 * Unit tests for the order placement route and chargeToBooking integration.
 *
 * Uses Jest with manual mocks for SQLite (better-sqlite3) and fetch.
 */

const express = require('express')
const http = require('http')

// ── Mock the db module ────────────────────────────────────────────────────────
const mockRun = jest.fn()
const mockGet = jest.fn()
const mockAll = jest.fn()
const mockPrepare = jest.fn((sql) => {
  if (sql.includes('SELECT COALESCE')) return { get: jest.fn().mockReturnValue({ total: 0 }) }
  if (sql.includes('SELECT * FROM orders WHERE id')) return { get: mockGet }
  if (sql.includes('SELECT * FROM order_items')) return { all: mockAll }
  if (sql.includes('SELECT * FROM orders')) return { all: mockAll }
  return { run: mockRun, get: mockGet, all: mockAll }
})
const mockTransaction = jest.fn((fn) => () => {
  fn()   // run the transaction body (inserts)
  return 1 // lastInsertRowid
})

jest.mock('../db', () => ({
  getDb: () => ({
    prepare: mockPrepare,
    transaction: mockTransaction,
  }),
}))

// ── Mock email ────────────────────────────────────────────────────────────────
jest.mock('../email', () => ({
  sendOrderConfirmation: jest.fn().mockResolvedValue(undefined),
}))

// ── Mock global fetch ─────────────────────────────────────────────────────────
global.fetch = jest.fn()

// ── Load router after mocks are in place ─────────────────────────────────────
const ordersRouter = require('./orders')

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildApp() {
  const app = express()
  app.use(express.json())
  const mockIo = { emit: jest.fn() }
  app.set('io', mockIo)
  app.use('/api/orders', ordersRouter)
  return { app, mockIo }
}

function request(app, method, path, body) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app)
    server.listen(0, () => {
      const port = server.address().port
      const req = http.request(
        { hostname: 'localhost', port, path, method,
          headers: { 'Content-Type': 'application/json' } },
        (res) => {
          let data = ''
          res.on('data', chunk => (data += chunk))
          res.on('end', () => {
            server.close()
            resolve({ status: res.statusCode, body: JSON.parse(data || 'null') })
          })
        },
      )
      req.on('error', (e) => { server.close(); reject(e) })
      if (body) req.write(JSON.stringify(body))
      req.end()
    })
  })
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('POST /api/orders', () => {
  const validBody = {
    bookingId: 42,
    guestName: 'Maria Santos',
    guestEmail: 'maria@example.com',
    deliveryRoom: '101',
    items: [
      { menuItemId: 1, itemName: 'Caesar Salad', unitPrice: 250, quantity: 2 },
      { menuItemId: 2, itemName: 'Iced Tea',     unitPrice: 80,  quantity: 1 },
    ],
    notes: 'No croutons',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockRun.mockReturnValue({ lastInsertRowid: 1 })
    mockGet.mockReturnValue({ id: 1, booking_id: 42, total_amount: 580, status: 'pending' })
    mockAll.mockReturnValue([])
    global.fetch.mockResolvedValue({ ok: true, json: async () => ({ success: true, invoiceId: 7 }) })
  })

  it('should return 201 with orderId and total on success', async () => {
    const { app } = buildApp()
    const res = await request(app, 'POST', '/api/orders', validBody)

    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ orderId: expect.any(Number), total: 580 })
  })

  it('should emit new_order socket event on success', async () => {
    const { app, mockIo } = buildApp()
    await request(app, 'POST', '/api/orders', validBody)

    expect(mockIo.emit).toHaveBeenCalledWith('new_order', expect.objectContaining({
      order: expect.objectContaining({ booking_id: 42 }),
    }))
  })

  it('should call charge-booking on the Booking App after order is saved', async () => {
    const { app } = buildApp()
    await request(app, 'POST', '/api/orders', validBody)

    // Allow the non-blocking chargeToBooking promise to settle
    await new Promise(resolve => setTimeout(resolve, 50))

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/kiosk/charge-booking'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"bookingId":42'),
      }),
    )
  })

  it('should send item names and prices to charge-booking', async () => {
    const { app } = buildApp()
    await request(app, 'POST', '/api/orders', validBody)
    await new Promise(resolve => setTimeout(resolve, 50))

    const [, fetchOptions] = global.fetch.mock.calls[0]
    const payload = JSON.parse(fetchOptions.body)

    expect(payload.items).toContainEqual({
      description: 'Caesar Salad',
      quantity: 2,
      unitPrice: 250,
    })
    expect(payload.items).toContainEqual({
      description: 'Iced Tea',
      quantity: 1,
      unitPrice: 80,
    })
  })

  it('should still return 201 even if charge-booking fails', async () => {
    global.fetch.mockRejectedValue(new Error('Booking App unreachable'))
    const { app } = buildApp()
    const res = await request(app, 'POST', '/api/orders', validBody)

    // Order is saved and confirmed; charge failure is non-blocking
    expect(res.status).toBe(201)
  })

  it('should return 400 when bookingId is missing', async () => {
    const { app } = buildApp()
    const res = await request(app, 'POST', '/api/orders', { items: validBody.items })

    expect(res.status).toBe(400)
  })

  it('should return 400 when items array is empty', async () => {
    const { app } = buildApp()
    const res = await request(app, 'POST', '/api/orders', { ...validBody, items: [] })

    expect(res.status).toBe(400)
  })

  it('should return 403 when order total exceeds ORDER_CAP', async () => {
    const { app } = buildApp()
    const bigOrder = {
      ...validBody,
      items: [{ menuItemId: 1, itemName: 'Lobster', unitPrice: 6000, quantity: 1 }],
    }
    const res = await request(app, 'POST', '/api/orders', bigOrder)

    expect(res.status).toBe(403)
    expect(res.body.error).toBe('spending_limit')
  })

  it('should return 403 when daily cap would be exceeded', async () => {
    // Simulate that today's spending is already close to the daily cap
    mockPrepare.mockImplementation((sql) => {
      if (sql.includes('SELECT COALESCE')) {
        return { get: jest.fn().mockReturnValue({ total: 14800 }) } // only 200 left
      }
      if (sql.includes('SELECT * FROM orders WHERE id')) return { get: mockGet }
      if (sql.includes('SELECT * FROM order_items')) return { all: mockAll }
      return { run: mockRun, get: mockGet, all: mockAll }
    })

    const { app } = buildApp()
    const res = await request(app, 'POST', '/api/orders', validBody) // total 580

    expect(res.status).toBe(403)
    expect(res.body.error).toBe('spending_limit')
  })
})

describe('GET /api/orders/:id', () => {
  const mockOrder = {
    id: 42,
    booking_id: 1,
    guest_name: 'Maria Santos',
    delivery_room: '101',
    status: 'pending',
    total_amount: 580,
    charged: 0,
    invoice_id: null,
    invoice_item_ids: null,
    created_at: '2026-03-25 10:00:00',
    updated_at: '2026-03-25 10:00:00',
  }

  const mockItems = [
    { id: 1, order_id: 42, item_name: 'Caesar Salad', quantity: 2, unit_price: 250 },
    { id: 2, order_id: 42, item_name: 'Iced Tea',     quantity: 1, unit_price: 80  },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    mockGet.mockReturnValue(mockOrder)
    mockAll.mockReturnValue(mockItems)
    global.fetch.mockResolvedValue({ ok: true, json: async () => ({}) })
  })

  it('should return order with items when found', async () => {
    const { app } = buildApp()
    const res = await request(app, 'GET', '/api/orders/42')

    expect(res.status).toBe(200)
    expect(res.body.id).toBe(42)
    expect(res.body.guest_name).toBe('Maria Santos')
    expect(res.body.items).toHaveLength(2)
    expect(res.body.items[0].item_name).toBe('Caesar Salad')
  })

  it('should return 404 when order is not found', async () => {
    mockGet.mockReturnValue(undefined)
    const { app } = buildApp()
    const res = await request(app, 'GET', '/api/orders/999')

    expect(res.status).toBe(404)
    expect(res.body.error).toBe('Order not found')
  })
})

describe('POST /api/orders/:id/cancel', () => {
  const pendingOrder = {
    id: 10,
    status: 'pending',
    charged: 0,
    invoice_id: null,
    invoice_item_ids: null,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockGet.mockReturnValue(pendingOrder)
    mockRun.mockReturnValue({ changes: 1 })
    global.fetch.mockResolvedValue({ ok: true, json: async () => ({}) })
  })

  it('should cancel a pending order and return cancelled status', async () => {
    const { app } = buildApp()
    const res = await request(app, 'POST', '/api/orders/10/cancel')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ orderId: 10, status: 'cancelled' })
  })

  it('should emit order_updated socket event on cancel', async () => {
    const { app, mockIo } = buildApp()
    await request(app, 'POST', '/api/orders/10/cancel')

    expect(mockIo.emit).toHaveBeenCalledWith('order_updated', {
      orderId: 10,
      status: 'cancelled',
    })
  })

  it('should return 404 when order does not exist', async () => {
    mockGet.mockReturnValue(undefined)
    const { app } = buildApp()
    const res = await request(app, 'POST', '/api/orders/999/cancel')

    expect(res.status).toBe(404)
  })

  it('should return 409 when order is already ready (not cancellable)', async () => {
    mockGet.mockReturnValue({ ...pendingOrder, status: 'ready' })
    const { app } = buildApp()
    const res = await request(app, 'POST', '/api/orders/10/cancel')

    expect(res.status).toBe(409)
    expect(res.body.error).toBe('not_cancellable')
  })

  it('should return 409 when order is already served', async () => {
    mockGet.mockReturnValue({ ...pendingOrder, status: 'served' })
    const { app } = buildApp()
    const res = await request(app, 'POST', '/api/orders/10/cancel')

    expect(res.status).toBe(409)
    expect(res.body.error).toBe('not_cancellable')
  })

  it('should call uncharge-booking when order was charged', async () => {
    mockGet.mockReturnValue({
      ...pendingOrder,
      charged: 1,
      invoice_id: 7,
      invoice_item_ids: '[1,2]',
    })
    const { app } = buildApp()
    await request(app, 'POST', '/api/orders/10/cancel')

    await new Promise(resolve => setTimeout(resolve, 50))

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/kiosk/uncharge-booking'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"invoiceId":7'),
      }),
    )
  })

  it('should still cancel successfully even if uncharge-booking call fails', async () => {
    mockGet.mockReturnValue({
      ...pendingOrder,
      charged: 1,
      invoice_id: 7,
      invoice_item_ids: '[1,2]',
    })
    global.fetch.mockRejectedValue(new Error('Booking App down'))
    const { app } = buildApp()
    const res = await request(app, 'POST', '/api/orders/10/cancel')

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('cancelled')
  })
})
