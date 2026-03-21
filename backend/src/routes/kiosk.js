const router = require('express').Router()

const BOOKING_APP_URL = (process.env.BOOKING_APP_URL || 'http://localhost:3001').replace(/\/$/, '')

router.post('/validate-guest', async (req, res) => {
  try {
    const response = await fetch(`${BOOKING_APP_URL}/api/v1/kiosk/validate-guest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    })
    const data = await response.json()
    res.status(response.status).json(data)
  } catch (err) {
    res.status(503).json({ error: 'Booking service unavailable' })
  }
})

router.post('/validate-token', async (req, res) => {
  try {
    const response = await fetch(`${BOOKING_APP_URL}/api/v1/kiosk/validate-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    })
    const data = await response.json()
    res.status(response.status).json(data)
  } catch (err) {
    res.status(503).json({ error: 'Booking service unavailable' })
  }
})

router.post('/charge-booking', async (req, res) => {
  try {
    const response = await fetch(`${BOOKING_APP_URL}/api/v1/kiosk/charge-booking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    })
    const data = await response.json()
    res.status(response.status).json(data)
  } catch (err) {
    res.status(503).json({ error: 'Booking service unavailable' })
  }
})

module.exports = router
