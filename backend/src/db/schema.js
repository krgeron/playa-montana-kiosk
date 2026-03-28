const CREATE_ORDERS = `
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER NOT NULL,
    guest_name TEXT NOT NULL,
    guest_email TEXT,
    delivery_room TEXT,
    status TEXT NOT NULL DEFAULT 'pending'
      CHECK(status IN ('pending', 'preparing', 'ready', 'served', 'cancelled')),
    total_amount DECIMAL(10,2) NOT NULL,
    notes TEXT,
    charged BOOLEAN NOT NULL DEFAULT 0,
    invoice_id INTEGER,
    invoice_item_ids TEXT,
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
