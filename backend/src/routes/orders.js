const router = require('express').Router()
const { getDb } = require('../db')

const ORDER_CAP = Number(process.env.ORDER_CAP || 5000)
const DAILY_CAP = Number(process.env.DAILY_CAP || 15000)
const BOOKING_APP_URL = process.env.BOOKING_APP_URL || 'http://localhost:3001'

async function chargeToBooking(bookingId, items, notes) {
  const payload = {
    bookingId,
    items: items.map(i => ({
      description: i.itemName,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
    })),
    notes,
  }

  const res = await fetch(`${BOOKING_APP_URL}/api/v1/kiosk/charge-booking`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`charge-booking failed (${res.status}): ${text}`)
  }

  return res.json()
}

router.post('/', (req, res) => {
  const { bookingId, guestName, guestEmail, deliveryRoom, items, notes } = req.body

  if (!bookingId || !items?.length) {
    return res.status(400).json({ error: 'bookingId and items are required' })
  }

  const db = getDb()
  const totalAmount = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)

  if (totalAmount > ORDER_CAP) {
    return res.status(403).json({
      error: 'spending_limit',
      message: `Order exceeds the ₱${ORDER_CAP.toLocaleString()} per-order limit. Please contact the front desk.`,
    })
  }

  const today = new Date().toISOString().split('T')[0]
  const dailyTotal = db.prepare(`
    SELECT COALESCE(SUM(total_amount), 0) as total
    FROM orders
    WHERE booking_id = ? AND date(created_at) = ?
  `).get(bookingId, today)

  if (dailyTotal.total + totalAmount > DAILY_CAP) {
    return res.status(403).json({
      error: 'spending_limit',
      message: `Daily limit of ₱${DAILY_CAP.toLocaleString()} reached for this booking. Please contact the front desk.`,
    })
  }

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
        item.unitPrice, item.quantity, item.notes || null
      )
    }

    return orderId
  })

  try {
    const orderId = transaction()
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId)
    const orderItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId)

    const io = req.app.get('io')
    io.emit('new_order', { order: { ...order, items: orderItems } })

    const { sendOrderConfirmation } = require('../email')
    sendOrderConfirmation(order, orderItems).catch(() => {})

    // Charge to booking invoice — track result for potential rollback
    chargeToBooking(bookingId, items, notes).then(charge => {
      db.prepare(`
        UPDATE orders
        SET charged = 1, invoice_id = ?, invoice_item_ids = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(charge.invoiceId, JSON.stringify(charge.invoiceItemIds), orderId)
    }).catch(err => {
      console.error(`[charge-booking] Failed for order ${orderId}:`, err.message)
    })

    res.status(201).json({ orderId: Number(orderId), total: totalAmount })
  } catch (err) {
    console.error('Failed to place order:', err)
    res.status(500).json({ error: 'Failed to place order' })
  }
})

router.get('/', (req, res) => {
  const db = getDb()
  const orders = db.prepare(`
    SELECT * FROM orders
    WHERE status != 'served'
    ORDER BY created_at ASC
  `).all()

  const getItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?')
  const result = orders.map(order => ({
    ...order,
    items: getItems.all(order.id),
  }))

  res.json(result)
})

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

router.get('/:id', (req, res) => {
  const { id } = req.params
  const db = getDb()
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id)
  if (!order) return res.status(404).json({ error: 'Order not found' })
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id)
  res.json({ ...order, items })
})

router.post('/:id/cancel', async (req, res) => {
  const { id } = req.params
  const db = getDb()

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id)
  if (!order) return res.status(404).json({ error: 'Order not found' })

  if (!['pending', 'preparing'].includes(order.status)) {
    return res.status(409).json({
      error: 'not_cancellable',
      message: `Order cannot be cancelled — it is already ${order.status}.`,
    })
  }

  db.prepare(`
    UPDATE orders SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?
  `).run(id)

  const io = req.app.get('io')
  io.emit('order_updated', { orderId: Number(id), status: 'cancelled' })

  // Reverse the charge if it was applied
  if (order.charged && order.invoice_id && order.invoice_item_ids) {
    try {
      const invoiceItemIds = JSON.parse(order.invoice_item_ids)
      await fetch(`${BOOKING_APP_URL}/api/v1/kiosk/uncharge-booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: order.invoice_id, invoiceItemIds }),
      }).then(r => {
        if (!r.ok) throw new Error(`uncharge failed: ${r.status}`)
      })
    } catch (err) {
      console.error(`[uncharge-booking] Failed for order ${id}:`, err.message)
      // Order is still cancelled — staff must manually remove invoice items
    }
  }

  res.json({ orderId: Number(id), status: 'cancelled' })
})

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

  const io = req.app.get('io')
  io.emit('order_updated', { orderId: Number(id), status })

  res.json({ orderId: Number(id), status })
})

module.exports = router
