const Database = require('better-sqlite3')
const path = require('path')
const { CREATE_ORDERS, CREATE_ORDER_ITEMS } = require('./schema')

const DB_PATH = path.join(__dirname, '..', '..', 'database.sqlite')
let db

function initDatabase() {
  db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.exec(CREATE_ORDERS)
  db.exec(CREATE_ORDER_ITEMS)
  return db
}

function getDb() {
  if (!db) throw new Error('Database not initialized')
  return db
}

module.exports = { initDatabase, getDb }
