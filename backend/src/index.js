require('dotenv').config({ path: require('path').join(__dirname, '../.env') })

const express = require('express')
const cors = require('cors')
const http = require('http')
const path = require('path')
const { Server } = require('socket.io')
const { initDatabase } = require('./db')

const app = express()
const server = http.createServer(app)
const io = new Server(server, { cors: { origin: '*' } })

app.use(cors())
app.use(express.json())

app.set('io', io)

initDatabase()

app.use('/api/menu', require('./routes/menu'))
app.use('/api/orders', require('./routes/orders'))
app.use('/api/kiosk', require('./routes/kiosk'))

require('./socket')(io)

app.get('/health', (req, res) => res.json({ status: 'ok' }))

// Serve built frontend static files (production only)
const publicDir = path.join(__dirname, '../public')
app.use(express.static(publicDir))
// SPA fallback — return index.html for all non-API routes
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'))
})

const PORT = process.env.PORT || 3004
const MENU_APP_URL = (process.env.MENU_APP_URL || 'http://localhost:3002').replace(/\/$/, '')
const BOOKING_APP_URL = (process.env.BOOKING_APP_URL || 'http://localhost:3001').replace(/\/$/, '')

server.listen(PORT, () => {
  console.log(`Kiosk backend running on port ${PORT}`)
  console.log(`  MENU_APP_URL=${MENU_APP_URL} (menu-management GET /api/v1/kiosk/menu)`)
  console.log(`  BOOKING_APP_URL=${BOOKING_APP_URL}`)
  if (MENU_APP_URL === BOOKING_APP_URL) {
    console.warn(
      '  WARNING: MENU_APP_URL equals BOOKING_APP_URL — menu calls will hit the booking API and 404.',
    )
  }
})
