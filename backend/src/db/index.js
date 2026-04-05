const Database = require('better-sqlite3')
const path = require('path')
const { CREATE_ORDERS, CREATE_ORDER_ITEMS } = require('./schema')

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', '..', 'database.sqlite')
let db

function migrateDatabase(db) {
  const version = db.pragma('user_version', { simple: true })

  if (version < 1) {
    // v1: add cancelled status + invoice charge tracking columns
    db.exec(`
      CREATE TABLE orders_v2 (
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
    `)
    db.exec(`
      INSERT INTO orders_v2 (id, booking_id, guest_name, guest_email, delivery_room,
                              status, total_amount, notes, charged, created_at, updated_at)
      SELECT id, booking_id, guest_name, guest_email, delivery_room,
             status, total_amount, notes, charged, created_at, updated_at
      FROM orders
    `)
    db.exec('DROP TABLE orders')
    db.exec('ALTER TABLE orders_v2 RENAME TO orders')
    db.pragma('user_version = 1')
    console.log('[db] Migration v1 applied: cancelled status + invoice tracking')
  }
}

function initDatabase() {
  db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.exec(CREATE_ORDERS)
  db.exec(CREATE_ORDER_ITEMS)
  migrateDatabase(db)
  return db
}

function getDb() {
  if (!db) throw new Error('Database not initialized')
  return db
}

module.exports = { initDatabase, getDb }
